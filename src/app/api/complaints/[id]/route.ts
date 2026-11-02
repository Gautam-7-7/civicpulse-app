import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { fallbackComplaints } from '@/lib/mockData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const complaintId = Number(id);

  try {

    const [complaint]: any = await executeQuery(
      `
      SELECT 
        c.*,
        w.ward_number,
        w.ward_name,
        w.zone,
        cat.category_name,
        cat.sla_hours,
        d.department_name,
        u.full_name AS citizen_name,
        u.email AS citizen_email,
        u.phone AS citizen_phone,
        staff_u.full_name AS assigned_staff_name,
        sp.designation AS staff_designation,
        a.assignment_id,
        a.staff_id,
        TIMESTAMPDIFF(HOUR, NOW(), c.sla_due_at) AS hours_left_sla
      FROM complaints c
      JOIN wards w ON c.ward_id = w.ward_id
      JOIN issue_categories cat ON c.category_id = cat.category_id
      JOIN departments d ON cat.department_id = d.department_id
      JOIN users u ON c.citizen_id = u.user_id
      LEFT JOIN assignments a ON c.complaint_id = a.complaint_id AND a.is_active = TRUE
      LEFT JOIN staff_profiles sp ON a.staff_id = sp.staff_id
      LEFT JOIN users staff_u ON sp.user_id = staff_u.user_id
      WHERE c.complaint_id = ?
      `,
      [complaintId]
    );

    if (!complaint) {
      return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });
    }

    const history = await executeQuery(
      `SELECT history_id, old_status, new_status, changed_at, remarks
       FROM status_history
       WHERE complaint_id = ?
       ORDER BY changed_at ASC`,
      [complaintId]
    );

    const feedback = await executeQuery(
      `SELECT f.feedback_id, f.rating, f.comments, f.created_at, u.full_name AS citizen_name
       FROM citizen_feedback f
       JOIN users u ON f.citizen_id = u.user_id
       WHERE f.complaint_id = ?`,
      [complaintId]
    );

    return NextResponse.json({
      success: true,
      complaint,
      history,
      feedback: feedback[0] || null,
    });
  } catch (error: any) {
    const found = fallbackComplaints.find((c) => c.complaint_id === Number(id));
    if (found) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        complaint: found,
        history: [
          {
            history_id: 1,
            old_status: 'open',
            new_status: found.status,
            changed_at: found.reported_at,
            remarks: 'Initial complaint registration',
          },
        ],
        feedback: null,
      });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch complaint detail' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const complaintId = Number(id);
    const body = await request.json();
    const { status, remarks } = body;

    const validStatuses = ['open', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // UPDATE complaint status (triggers will handle resolved_at and status_history)
    await executeQuery(
      'UPDATE complaints SET status = ? WHERE complaint_id = ?',
      [status, complaintId]
    );

    // If custom remarks were provided, update the latest status_history entry remarks
    if (remarks) {
      await executeQuery(
        `UPDATE status_history 
         SET remarks = ? 
         WHERE complaint_id = ? 
         ORDER BY history_id DESC 
         LIMIT 1`,
        [remarks, complaintId]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Status updated to ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update complaint status' },
      { status: 500 }
    );
  }
}
