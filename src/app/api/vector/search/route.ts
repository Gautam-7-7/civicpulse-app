import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarComplaints } from '@/lib/vectorDb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, ward_id, category_id, exclude_id, limit, threshold } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query text is required for vector search' },
        { status: 400 }
      );
    }

    const matches = await searchSimilarComplaints(text, {
      wardId: ward_id ? Number(ward_id) : undefined,
      categoryId: category_id ? Number(category_id) : undefined,
      excludeComplaintId: exclude_id ? Number(exclude_id) : undefined,
      limit: limit ? Number(limit) : 5,
      threshold: threshold ? Number(threshold) : 0.45,
    });

    return NextResponse.json({
      success: true,
      query: text,
      matchCount: matches.length,
      matches,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Vector search failed' },
      { status: 500 }
    );
  }
}

