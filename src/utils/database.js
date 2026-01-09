import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

let pool = null;

/**
 * Create or get MySQL connection pool
 */
export async function getPool() {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0
  });

  return pool;
}

/**
 * Get a connection from the pool
 */
export async function getConnection() {
  const pool = await getPool();
  return pool.getConnection();
}

/**
 * Execute a query
 */
export async function query(sql, values = []) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const connection = await getConnection();
    const result = await connection.query('SELECT 1');
    connection.release();
    return { success: true, message: 'Database connected successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Close the pool
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
