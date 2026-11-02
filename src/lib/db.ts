import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'civicpulse',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      timezone: '+00:00',
    });
  }
  return pool;
}

export async function resetDbPool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
    } catch {
      // Ignore cleanup error
    }
    pool = null;
  }
}

export async function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T> {
  const db = getDbPool();
  const [rows] = await db.query(sql, params);
  return rows as T;
}

export async function testConnection(): Promise<{ ok: boolean; message: string; version?: string }> {
  try {
    const db = getDbPool();
    const [rows]: any = await db.query('SELECT VERSION() as version, DATABASE() as db');
    return {
      ok: true,
      message: 'Successfully connected to MySQL database',
      version: rows[0]?.version,
    };
  } catch (error: any) {
    // If unknown database error, pool should be cleared so it can reconnect once created
    if (error?.code === 'ER_BAD_DB_ERROR') {
      await resetDbPool();
    }
    return {
      ok: false,
      message: error?.message || 'Failed to connect to MySQL',
    };
  }
}
