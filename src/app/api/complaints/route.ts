import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { upsertComplaintVector } from '@/lib/vectorDb';
import { fallbackComplaints } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const status = searchParams.get('status');
    const wardId = searchParams.get('ward_id');
    const categoryId = searchParams.get('category_id');

    let sql = `
      SELECT 
        c.complaint_id,
        c.title,
        c.description,
        c.latitude,
        c.longitude,
        c.status,
        c.priority,
        c.reported_at,
        c.sla_due_at,
        c.resolved_at,
        w.ward_id,
        w.ward_number,
        w.ward_name,
        w.zone,
        cat.category_id,
        cat.category_name,
        cat.sla_hours,
        d.department_name,
        u.full_name AS citizen_name,
        u.email AS citizen_email,
        staff_u.full_name AS assigned_staff_name,
        sp.designation AS staff_designation,
        CASE 
          WHEN c.status = 'resolved' THEN 0
          WHEN NOW() > c.sla_due_at THEN 1
          ELSE 0
        END AS is_sla_breached,
        TIMESTAMPDIFF(HOUR, NOW(), c.sla_due_at) AS hours_left_sla
      FROM complaints c
      JOIN wards w ON c.ward_id = w.ward_id
      JOIN issue_categories cat ON c.category_id = cat.category_id
      JOIN departments d ON cat.department_id = d.department_id
      JOIN users u ON c.citizen_id = u.user_id
      LEFT JOIN assignments a ON c.complaint_id = a.complaint_id AND a.is_active = TRUE
      LEFT JOIN staff_profiles sp ON a.staff_id = sp.staff_id
      LEFT JOIN users staff_u ON sp.user_id = staff_u.user_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    if (wardId && wardId !== 'all') {
      sql += ' AND c.ward_id = ?';
      params.push(Number(wardId));
    }

    if (categoryId && categoryId !== 'all') {
      sql += ' AND c.category_id = ?';
      params.push(Number(categoryId));
    }

    if (q) {
      sql += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    sql += ' ORDER BY c.reported_at DESC';

    const complaints = await executeQuery(sql, params);

    return NextResponse.json({ success: true, source: 'mysql', count: complaints.length, complaints });
  } catch (error: any) {
    // Graceful fallback to initial seed complaints if MySQL is offline
    let filtered = [...fallbackComplaints];
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const status = searchParams.get('status');
    const wardId = searchParams.get('ward_id');
    const categoryId = searchParams.get('category_id');

    if (status && status !== 'all') {
      filtered = filtered.filter((c) => c.status === status);
    }
    if (wardId && wardId !== 'all') {
      filtered = filtered.filter((c) => Number(c.ward_id) === Number(wardId));
    }
    if (categoryId && categoryId !== 'all') {
      filtered = filtered.filter((c) => Number(c.category_id) === Number(categoryId));
    }
    if (q) {
      const lower = q.toLowerCase();
      filtered = filtered.filter((c) => c.title.toLowerCase().includes(lower) || c.description.toLowerCase().includes(lower));
    }

    return NextResponse.json({
      success: true,
      source: 'fallback',
      count: filtered.length,
      complaints: filtered,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category_id, ward_id, priority, latitude, longitude, citizen_id } = body;

    if (!title || !description || !category_id || !ward_id) {
      return NextResponse.json(
        { success: false, error: 'Title, description, category, and ward are required' },
        { status: 400 }
      );
    }

    // Default to Gautam Sharma (user_id = 6) if not provided
    const citizenUserId = citizen_id || 6;

    const insertSql = `
      INSERT INTO complaints (citizen_id, category_id, ward_id, title, description, latitude, longitude, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertResult: any = await executeQuery(insertSql, [
      citizenUserId,
      Number(category_id),
      Number(ward_id),
      title.trim(),
      description.trim(),
      latitude ? Number(latitude) : null,
      longitude ? Number(longitude) : null,
      priority || null, // If null, the BEFORE INSERT trigger populates it
    ]);

    const newComplaintId = insertResult.insertId;

    // Automatically index new complaint in Vector Database for semantic search
    try {
      await upsertComplaintVector({
        complaint_id: newComplaintId,
        ward_id: Number(ward_id),
        category_id: Number(category_id),
        title: title.trim(),
        description: description.trim(),
        status: 'open',
      });
    } catch (vecErr) {
      console.warn('Vector DB sync warning:', vecErr);
    }

    // Fetch the inserted complaint to verify trigger-calculated fields
    const [created]: any = await executeQuery(
      `SELECT c.*, cat.category_name, w.ward_name, d.department_name
       FROM complaints c
       JOIN issue_categories cat ON c.category_id = cat.category_id
       JOIN departments d ON cat.department_id = d.department_id
       JOIN wards w ON c.ward_id = w.ward_id
       WHERE c.complaint_id = ?`,
      [newComplaintId]
    );

    return NextResponse.json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: created,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit complaint' },
      { status: 500 }
    );
  }
}
