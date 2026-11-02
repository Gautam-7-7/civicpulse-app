import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { fallbackStaff } from '@/lib/mockData';

export async function GET() {
  try {
    const staff = await executeQuery(`
      SELECT 
        sp.staff_id,
        sp.department_id,
        sp.designation,
        sp.active_load,
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        d.department_name
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.user_id
      JOIN departments d ON sp.department_id = d.department_id
      ORDER BY sp.active_load ASC, u.full_name ASC
    `);

    return NextResponse.json({ success: true, source: 'mysql', staff });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      staff: fallbackStaff,
    });
  }
}
