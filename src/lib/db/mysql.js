import mysql from 'mysql2/promise'

const connectionConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'root',
  database: process.env.DATABASE_NAME || 'gcfinance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Remove the problematic options
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}

let pool

async function createConnection() {
  try {
    if (!pool) {
      pool = mysql.createPool(connectionConfig)
      
      // Test the connection
      const connection = await pool.getConnection()
      console.log('✅ Database connected successfully')
      connection.release()
    }
    return pool
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    throw new Error('Database connection failed')
  }
}

export async function executeQuery(query, params = []) {
  try {
    const connection = await createConnection()
    
    // Ensure params is always an array and handle null/undefined values
    const cleanParams = Array.isArray(params) ? params.map(param => {
      // Convert undefined to null for MySQL
      return param === undefined ? null : param
    }) : []
    
    console.log('🔍 Executing query:', query)
    console.log('📝 With params:', cleanParams)
    console.log('📝 Params types:', cleanParams.map(p => typeof p))
    
    const [results] = await connection.execute(query, cleanParams)
    return results
  } catch (error) {
    console.error('Database query error:', error)
    console.error('Query was:', query)
    console.error('Params were:', params)
    throw new Error(`Database query failed: ${error.message}`)
  }
}

// Alternative query method that uses string interpolation for LIMIT/OFFSET
export async function executeQueryWithLimit(baseQuery, params = [], limit = 10, offset = 0) {
  try {
    const connection = await createConnection()
    
    // Clean the base parameters
    const cleanParams = Array.isArray(params) ? params.map(param => {
      return param === undefined ? null : param
    }) : []
    
    // Add LIMIT and OFFSET directly to the query string to avoid parameter issues
    const fullQuery = `${baseQuery} LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`
    
    console.log('🔍 Executing query with limit:', fullQuery)
    console.log('📝 With params:', cleanParams)
    
    const [results] = await connection.execute(fullQuery, cleanParams)
    return results
  } catch (error) {
    console.error('Database query error:', error)
    throw new Error(`Database query failed: ${error.message}`)
  }
}

export async function executeTransaction(queries) {
  const connection = await createConnection()
  const conn = await connection.getConnection()
  
  try {
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
    await conn.rollback()
    console.error('Transaction error:', error)
    throw error
  } finally {
    conn.release()
  }
}

export default createConnection
