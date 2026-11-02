import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    // 1. Overall status counts
    const statusCounts: any = await executeQuery(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_count,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) AS assigned_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
        SUM(CASE WHEN status <> 'resolved' AND NOW() > sla_due_at THEN 1 ELSE 0 END) AS sla_breached_count
      FROM complaints
    `);

    // 2. Ward breakdown (GROUP BY + JOIN)
    const wardStats = await executeQuery(`
      SELECT 
        w.ward_id,
        w.ward_number,
        w.ward_name,
        w.zone,
        COUNT(c.complaint_id) AS total_complaints,
        SUM(CASE WHEN c.status = 'resolved' THEN 1 ELSE 0 END) AS resolved_complaints
      FROM wards w
      LEFT JOIN complaints c ON w.ward_id = c.ward_id
      GROUP BY w.ward_id, w.ward_number, w.ward_name, w.zone
      ORDER BY total_complaints DESC
    `);

    // 3. Department breakdown
    const departmentStats = await executeQuery(`
      SELECT 
        d.department_name,
        COUNT(c.complaint_id) AS complaint_count,
        COUNT(sp.staff_id) AS staff_count
      FROM departments d
      LEFT JOIN issue_categories cat ON d.department_id = cat.department_id
      LEFT JOIN complaints c ON cat.category_id = c.category_id
      LEFT JOIN staff_profiles sp ON d.department_id = sp.department_id
      GROUP BY d.department_id, d.department_name
      ORDER BY complaint_count DESC
    `);

    // 4. Recent activity log from status_history
    const recentActivity = await executeQuery(`
      SELECT 
        sh.history_id,
        sh.old_status,
        sh.new_status,
        sh.changed_at,
        sh.remarks,
        c.complaint_id,
        c.title
      FROM status_history sh
      JOIN complaints c ON sh.complaint_id = c.complaint_id
      ORDER BY sh.changed_at DESC
      LIMIT 6
    `);

    return NextResponse.json({
      success: true,
      source: 'mysql',
      summary: statusCounts[0] || {},
      wardStats,
      departmentStats,
      recentActivity,
    });
  } catch (error: any) {
    // Fallback analytics when MySQL is offline
    return NextResponse.json({
      success: true,
      source: 'fallback',
      summary: {
        total: 5,
        open_count: 2,
        assigned_count: 1,
        in_progress_count: 1,
        resolved_count: 1,
        sla_breached_count: 0,
      },
      wardStats: [
        { ward_id: 1, ward_number: 174, ward_name: 'HSR Layout', zone: 'South Zone', total_complaints: 2, resolved_complaints: 1 },
        { ward_id: 2, ward_number: 150, ward_name: 'Bellandur', zone: 'Mahadevapura Zone', total_complaints: 1, resolved_complaints: 0 },
        { ward_id: 3, ward_number: 151, ward_name: 'Koramangala', zone: 'South Zone', total_complaints: 1, resolved_complaints: 0 },
        { ward_id: 4, ward_number: 149, ward_name: 'Varthur', zone: 'Mahadevapura Zone', total_complaints: 1, resolved_complaints: 0 },
      ],
      departmentStats: [
        { department_name: 'Road Infrastructure & Traffic', complaint_count: 2, staff_count: 1 },
        { department_name: 'Water Supply & Sewerage (BWSSB)', complaint_count: 1, staff_count: 1 },
        { department_name: 'Solid Waste & Sanitation', complaint_count: 1, staff_count: 1 },
        { department_name: 'Electricity & Street Lighting (BESCOM)', complaint_count: 1, staff_count: 1 },
      ],
      recentActivity: [
        { history_id: 6, complaint_id: 4, old_status: 'in_progress', new_status: 'resolved', changed_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), remarks: 'Site cleared and bleached; waste removed to processing plant', title: 'Illegal commercial garbage dumping near park boundary' },
        { history_id: 3, complaint_id: 2, old_status: 'assigned', new_status: 'in_progress', changed_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), remarks: 'Jetting machine deployed to clear block', title: 'Sewage overflow near Bellandur Lake outer gate' },
        { history_id: 2, complaint_id: 2, old_status: 'open', new_status: 'assigned', changed_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), remarks: 'Assigned to Anand Murthy for urgent field inspection', title: 'Sewage overflow near Bellandur Lake outer gate' },
        { history_id: 1, complaint_id: 1, old_status: 'open', new_status: 'assigned', changed_at: new Date(Date.now() - 9 * 3600 * 1000).toISOString(), remarks: 'Auto-assigned to Rajesh Kumar (Roads Infrastructure)', title: 'Deep pothole on 27th Main near HSR Club' },
      ],
    });
  }
}
