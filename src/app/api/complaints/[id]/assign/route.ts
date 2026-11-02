import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

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

    // Deactivate prior assignments
    await executeQuery('UPDATE assignments SET is_active = FALSE WHERE complaint_id = ?', [complaintId]);

    // Insert new assignment
    await executeQuery(
      'INSERT INTO assignments (complaint_id, staff_id, is_active) VALUES (?, ?, TRUE)',
      [complaintId, Number(staff_id)]
    );

    // Update staff active load
    await executeQuery(
      'UPDATE staff_profiles SET active_load = active_load + 1 WHERE staff_id = ?',
      [Number(staff_id)]
    );

    // Update complaint status to 'assigned'
    await executeQuery(
      "UPDATE complaints SET status = 'assigned' WHERE complaint_id = ?",
      [complaintId]
    );

    return NextResponse.json({
      success: true,
      message: 'Staff member assigned successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign complaint' },
      { status: 500 }
    );
  }
}
