import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { syncAllComplaintsToVectorDb } from '@/lib/vectorDb';

export async function POST() {
  try {
    // Fetch all complaints from SQL database
    const complaints: any = await executeQuery(`
      SELECT 
        complaint_id, 
        ward_id, 
        category_id, 
        title, 
        description, 
        status, 
        reported_at 
      FROM complaints
    `);

    const count = await syncAllComplaintsToVectorDb(complaints);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${count} complaints into Vector Database`,
      indexedCount: count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync vector database' },
      { status: 500 }
    );
  }
}

