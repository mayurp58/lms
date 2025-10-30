import { NextResponse } from 'next/server'
import { executeTransaction } from '@/lib/db/mysql'
import { hashPassword } from '@/lib/auth/jwt'
import { validateUserData } from '@/lib/validations'
import { generateAgentCode } from '@/lib/utils'

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
      aadhar_number,
      pan_number,
      // Connector specific fields
      connector_city,
      connector_area,
      commission_percentage,
      // Banker specific fields
      bank_id,
      employee_id,
      designation,
      department,
      max_approval_limit
    } = body

    // Hash password
    const password_hash = await hashPassword(password)

    // Prepare transaction queries
    const queries = []

    // Insert user
    queries.push({
      query: 'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      params: [email, password_hash, role]
    })

    // Insert user profile
    queries.push({
      query: `INSERT INTO user_profiles (user_id, first_name, last_name, phone, address, city, state, pincode, aadhar_number, pan_number) 
              VALUES (LAST_INSERT_ID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [first_name, last_name, phone, address, city, state, pincode, aadhar_number, pan_number]
    })

    // Role-specific inserts
    if (role === 'connector') {
      const agent_code = generateAgentCode()
      queries.push({
        query: `INSERT INTO connectors (user_id, agent_code, city, area, commission_percentage) 
                VALUES ((SELECT id FROM users WHERE email = ?), ?, ?, ?, ?)`,
        params: [email, agent_code, connector_city, connector_area, commission_percentage || 2.5]
      })
    }

    if (role === 'banker' && bank_id) {
      queries.push({
        query: `INSERT INTO bankers (user_id, bank_id, employee_id, designation, department, max_approval_limit) 
                VALUES ((SELECT id FROM users WHERE email = ?), ?, ?, ?, ?, ?)`,
        params: [email, bank_id, employee_id, designation, department, max_approval_limit]
      })
    }

    // Execute transaction
    const results = await executeTransaction(queries)

    // Log registration activity
    const userId = results[0].insertId
    await executeQuery(
      'INSERT INTO system_logs (user_id, action, new_values, ip_address) VALUES (?, ?, ?, ?)',
      [
        userId, 
        'USER_REGISTRATION', 
        JSON.stringify({ email, role }), 
        request.headers.get('x-forwarded-for') || 'unknown'
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      userId: userId
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle duplicate entry errors
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, message: 'Email, Aadhar, or PAN already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
