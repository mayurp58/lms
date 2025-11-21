import mysql from 'mysql2/promise'

const connectionConfig = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  namedPlaceholders: false
}

let pool

async function createConnection() {
  try {
    if (!pool) {
      pool = mysql.createPool(connectionConfig)

      // Test the connection
      const testConnection = await pool.getConnection() // Use a different variable name here
      console.log('✅ Database connected successfully')
      testConnection.release() // Release the test connection
    }
    return pool
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    throw new Error('Database connection failed')
  }
}

export async function executeQuery(query, params = []) {
  let connection; // Declare connection in a broader scope
  try {
    const dbPool = await createConnection(); // Get the pool
    connection = await dbPool.getConnection(); // Get a connection from the pool

    // Ensure params is always an array
    const cleanParams = Array.isArray(params) ? params.map(param => {
      // ONLY convert undefined to null. This should not affect numbers.
      if (param === undefined) {
        return null;
      }
      return param;
    }) : [];

    console.log('🔍 Executing query:', query);
    console.log('📝 With params (after clean):', cleanParams);
    console.log('📝 Params types (after clean):', cleanParams.map(p => `${p} (${typeof p})`));

    const [results] = await connection.execute(query, cleanParams);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query was:', query);
    console.error('Params were (original):', params);
    console.error('Full database error object:', error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    if (connection) { // Only release if a connection was successfully obtained
      connection.release();
    }
  }
}

// executeQueryWithLimit (if you keep it)
// And executeTransaction (also ensure connection is declared outside the try for cleanup)

export async function executeTransaction(queries) {
  const dbPool = await createConnection() // Get the pool
  let conn; // Declare conn in a broader scope

  try {
    conn = await dbPool.getConnection() // Get a connection from the pool
    await conn.beginTransaction()

    const results = []
    for (const { query, params } of queries) {
      const cleanParams = Array.isArray(params) ? params.map(param =>
        param === undefined ? null : param
      ) : []

      const [result] = await conn.execute(query, cleanParams)
      results.push(result)
    }

    await conn.commit()
    return results
  } catch (error) {
    if (conn) { // Only rollback if a connection was obtained
      await conn.rollback()
    }
    console.error('Transaction error:', error)
    throw error
  } finally {
    if (conn) { // Only release if a connection was obtained
      conn.release()
    }
  }
}


export default createConnection