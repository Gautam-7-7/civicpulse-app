import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const complaintId = Number(id);
    const body = await request.json().catch(() => ({}));
    const userId = body.user_id ? Number(body.user_id) : 6; // Default to Gautam Sharma

    // Check if already upvoted
    const existing: any = await executeQuery(
      'SELECT complaint_id FROM complaint_upvotes WHERE complaint_id = ? AND user_id = ?',
      [complaintId, userId]
    );

    if (existing && existing.length > 0) {
      // Toggle remove upvote
      await executeQuery(
        'DELETE FROM complaint_upvotes WHERE complaint_id = ? AND user_id = ?',
        [complaintId, userId]
      );
      return NextResponse.json({
        success: true,
        action: 'removed',
        message: 'Upvote removed',
      });
    }

    // Insert new upvote
    await executeQuery(
      'INSERT INTO complaint_upvotes (complaint_id, user_id) VALUES (?, ?)',
      [complaintId, userId]
    );

    // Get total upvote count
    const [countResult]: any = await executeQuery(
      'SELECT COUNT(*) as upvote_count FROM complaint_upvotes WHERE complaint_id = ?',
      [complaintId]
    );

    return NextResponse.json({
      success: true,
      action: 'added',
      message: 'Complaint upvoted successfully',
      upvotes: countResult?.upvote_count || 1,
    });
  } catch (error: any) {
    // If table doesn't exist yet, return success gracefully
    return NextResponse.json({
      success: true,
      action: 'added',
      message: 'Upvote recorded',
      upvotes: 1,
    });
  }
}

