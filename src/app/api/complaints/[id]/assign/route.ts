import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, getConnection } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const complaintId = Number(id);
    const body = await request.json();
    const { staff_id, auto_assign, department_id } = body;

    if (auto_assign) {
      // Find department_id if not supplied
      let deptId = department_id;
      if (!deptId) {
        const [complaint]: any = await executeQuery(
          `SELECT cat.department_id 
           FROM complaints c 
           JOIN issue_categories cat ON c.category_id = cat.category_id 
           WHERE c.complaint_id = ?`,
          [complaintId]
        );
        if (!complaint) {
          return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });
        }
        deptId = complaint.department_id;
      }

      // Execute Stored Procedure
      await executeQuery('CALL sp_auto_assign_complaint(?, ?)', [complaintId, deptId]);

      return NextResponse.json({
        success: true,
        message: 'Complaint automatically assigned using stored procedure sp_auto_assign_complaint',
      });
    }

    if (!staff_id) {
      return NextResponse.json(
        { success: false, error: 'staff_id is required for manual assignment' },
        { status: 400 }
      );
    }

    // ACID Transaction for manual staff assignment
    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      // 1. Fetch currently active assignment to balance previous staff load
      const [old]: any = await conn.query(
        'SELECT staff_id FROM assignments WHERE complaint_id = ? AND is_active = TRUE',
        [complaintId]
      );

      // 2. Deactivate previous assignments for this complaint
      await conn.query('UPDATE assignments SET is_active = FALSE WHERE complaint_id = ?', [complaintId]);

      // 3. Decrement active load for previously assigned staff (never below 0)
      if (old && old.length > 0) {
        await conn.query(
          'UPDATE staff_profiles SET active_load = GREATEST(active_load - 1, 0) WHERE staff_id = ?',
          [old[0].staff_id]
        );
      }

      // 4. Create new active assignment
      await conn.query(
        'INSERT INTO assignments (complaint_id, staff_id, is_active) VALUES (?, ?, TRUE)',
        [complaintId, Number(staff_id)]
      );

      // 5. Increment active load for newly assigned staff
      await conn.query(
        'UPDATE staff_profiles SET active_load = active_load + 1 WHERE staff_id = ?',
        [Number(staff_id)]
      );

      // 6. Transition complaint status to 'assigned'
      await conn.query(
        "UPDATE complaints SET status = 'assigned' WHERE complaint_id = ?",
        [complaintId]
      );

      await conn.commit();
    } catch (txError) {
      await conn.rollback();
      throw txError;
    } finally {
      conn.release();
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member assigned successfully (ACID transaction committed)',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign complaint' },
      { status: 500 }
    );
  }
}
