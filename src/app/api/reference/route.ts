import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { fallbackWards, fallbackDepartments, fallbackCategories } from '@/lib/mockData';

export async function GET() {
  try {
    const wards = await executeQuery('SELECT ward_id, ward_number, ward_name, zone, population FROM wards ORDER BY ward_number ASC');
    const departments = await executeQuery('SELECT department_id, department_name, helpline FROM departments ORDER BY department_name ASC');
    const categories = await executeQuery(`
      SELECT c.category_id, c.category_name, c.department_id, c.sla_hours, c.default_priority, d.department_name
      FROM issue_categories c
      JOIN departments d ON c.department_id = d.department_id
      ORDER BY c.category_name ASC
    `);

    return NextResponse.json({
      success: true,
      source: 'mysql',
      wards,
      departments,
      categories,
    });
  } catch (error: any) {
    // Graceful fallback to static master seed data if MySQL is not yet initialized
    return NextResponse.json({
      success: true,
      source: 'fallback',
      wards: fallbackWards,
      departments: fallbackDepartments,
      categories: fallbackCategories,
      warning: 'Serving fallback reference data. Initialize MySQL in DB & Schema tab to query live database.',
    });
  }
}
