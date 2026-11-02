import { NextResponse } from 'next/server';
import { getVectorDbStats } from '@/lib/vectorDb';

export async function GET() {
  try {
    const stats = getVectorDbStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get vector stats' },
      { status: 500 }
    );
  }
}

