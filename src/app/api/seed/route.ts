import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { resetDbPool, executeQuery } from '@/lib/db';
import { syncAllComplaintsToVectorDb } from '@/lib/vectorDb';

export async function POST() {
  let connection;
  try {
    // Connect without database first in case database does not exist
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      multipleStatements: true,
    });

    const rootDir = path.resolve(process.cwd(), '..');
    const ddlPath = path.join(rootDir, 'civicpulse_ddl_mysql.sql');
    const seedPath = path.join(rootDir, 'civicpulse_seed_data.sql');

    if (!fs.existsSync(ddlPath)) {
      return NextResponse.json(
        { success: false, error: `DDL file not found at ${ddlPath}` },
        { status: 404 }
      );
    }

    const ddlSql = fs.readFileSync(ddlPath, 'utf-8');
    // Clean up DELIMITER statements for mysql2 driver compatibility
    const cleanedDdl = ddlSql
      .replace(/DELIMITER \$\$/g, '')
      .replace(/DELIMITER ;/g, '')
      .replace(/\$\$/g, ';');

    await connection.query(cleanedDdl);

    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      await connection.query(seedSql);
    }

    await connection.end();

    // Reset app database connection pool so it binds to the freshly created civicpulse db
    await resetDbPool();

    // Automatically vectorize all seeded complaints into Vector DB
    let vectorCount = 0;
    try {
      const seededComplaints: any = await executeQuery(`
        SELECT complaint_id, ward_id, category_id, title, description, status, reported_at 
        FROM complaints
      `);
      if (Array.isArray(seededComplaints) && seededComplaints.length > 0) {
        vectorCount = await syncAllComplaintsToVectorDb(seededComplaints);
      }
    } catch (vErr) {
      console.warn('Vector seeding warning:', vErr);
    }

    return NextResponse.json({
      success: true,
      message: `Database schema, seed data, and ${vectorCount} vector embeddings loaded successfully!`,
      vectorCount,
    });
  } catch (error: any) {
    if (connection) {
      try {
        await connection.end();
      } catch {}
    }
    await resetDbPool();
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute seed/DDL script' },
      { status: 500 }
    );
  }
}
