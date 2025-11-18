import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql' // <--- REMOVED executeQueryWithLimit
import { hashPassword } from '@/lib/auth/jwt'
import { validateUserData } from '@/lib/validations'
import { generateAgentCode } from '@/lib/utils'

// GET - Fetch all users with pagination and filters 
export async function GET(request) {
  try {
    //console.log('📊 Users API called')
    
    // Check if user is authorized (should be super_admin)
    const userRole = request.headers.get('x-user-role')
    //console.log('👤 User role:', userRole)
    
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    //console.log('🔍 Query params:', { page, limit, role, status, search })

    const offset = (page - 1) * limit

    // Build where clause and parameters separately
    let whereConditions = []
    let queryParams = [] // Parameters for the WHERE clause only

    if (role && role.trim() !== '') {
      whereConditions.push('u.role = ?')
      queryParams.push(role)
    }

    if (status && status.trim() !== '') {
      whereConditions.push('u.status = ?')
      queryParams.push(status)
    }

    if (search && search.trim() !== '') {
      whereConditions.push('(up.first_name LIKE ? OR up.last_name LIKE ? OR u.email LIKE ?)')
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : ''

    //console.log('📝 WHERE clause:', whereClause)
    //console.log('📝 Query params:', queryParams)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ${whereClause}
    `
    
    //console.log('🔢 Count query:', countQuery)
    const countResult = await executeQuery(countQuery, queryParams) // Use queryParams for count
    const total = countResult[0].total
    //console.log('📊 Total users found:', total)

    // Get users with pagination - use string interpolation for LIMIT/OFFSET
    const usersQuery = `
      SELECT 
        u.id, u.email, u.role, u.status, u.created_at,
        up.first_name, up.last_name, up.phone, up.city, up.state,
        c.agent_code, c.total_cases_submitted, c.commission_percentage,
        b.employee_id, b.designation, bank.name as bank_name, b.branch, b.branch_code
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN connectors c ON u.id = c.user_id
      LEFT JOIN bankers b ON u.id = b.user_id
      LEFT JOIN banks bank ON b.bank_id = bank.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset} -- <--- DIRECT INTERPOLATION
    `

    // Now, the parameters array passed to executeQuery should ONLY contain the WHERE clause parameters.
    // LIMIT and OFFSET are already part of the SQL string.
    //console.log('👥 Users query (with interpolated LIMIT/OFFSET):', usersQuery)
    //console.log('👥 Params for users query:', queryParams)

    const users = await executeQuery(usersQuery, queryParams) // <--- Use executeQuery
    //console.log('✅ Users fetched:', users.length)

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('❌ Get users error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users: ' + error.message },
      { status: 500 }
    )
  }
}

// Keep the existing POST method as is...
export async function POST(request) {
  try {
    const body = await request.json()
    const { isValid, errors } = validateUserData(body)

    if (!isValid) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }

    const {
      first_name,
      last_name,
      email,
      password,
      role,
      phone,
      address,
      city,
      state,
      pincode,
      // Connector specific
      connector_city,
      connector_area,
      commission_percentage,
      // Banker specific
      bank_id,
      branch,
      branch_code,
      employee_id,
      designation,
      department,
      max_approval_limit
    } = body

    // Check if email exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const password_hash = await hashPassword(password)

    // Start transaction
    const queries = []

    // Insert user
    queries.push({
      query: 'INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?)',
      params: [email, password_hash, role, 'active']
    })

    // Insert user profile
    queries.push({
      query: `INSERT INTO user_profiles (user_id, first_name, last_name, phone, address, city, state, pincode) 
              VALUES (LAST_INSERT_ID(), ?, ?, ?, ?, ?, ?, ?)`,
      params: [first_name, last_name, phone || null, address || null, city || null, state || null, pincode || null]
    })

    // Role-specific inserts
    if (role === 'connector') {
      const agent_code = generateAgentCode()
      queries.push({
        query: `INSERT INTO connectors (user_id, agent_code, city, area, commission_percentage) 
                VALUES (LAST_INSERT_ID(), ?, ?, ?, ?)`,
        params: [agent_code, connector_city, connector_area, commission_percentage || 2.5]
      })
    }

    if (role === 'banker' && bank_id) {
      queries.push({
        query: `INSERT INTO bankers (user_id, bank_id, branch, branch_code, city, state, pincode, employee_id, designation, department, max_approval_limit) 
                VALUES (LAST_INSERT_ID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [bank_id, branch, branch_code, city, state, pincode, employee_id || null, designation || null, department || null, max_approval_limit || null]
      })
    }

    // Execute transaction
    // Assuming executeTransaction is correctly exported from mysql.js
    const { executeTransaction } = await import('@/lib/db/mysql')
    const results = await executeTransaction(queries)

    // Get the user ID from the first query result
    let userId
    if (results && results[0] && results[0].insertId) {
      userId = results[0].insertId
    } else {
      // Alternative way to get the user ID
      const newUser = await executeQuery('SELECT id FROM users WHERE email = ?', [email])
      userId = newUser[0].id
    }

    // Log activity
    await executeQuery(
      'INSERT INTO system_logs (user_id, action, new_values, ip_address) VALUES (?, ?, ?, ?)',
      [
        request.headers.get('x-user-id'),
        'USER_CREATED',
        JSON.stringify({ created_user_id: userId, email, role }),
        request.headers.get('x-forwarded-for') || 'unknown'
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: { userId }
    }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create user' },
      { status: 500 }
    )
  }
}