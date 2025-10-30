import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'
import { validateCustomerData } from '@/lib/validations'
import { formatDateForMySQL } from '@/lib/utils'

// GET - Fetch customers (filtered by connector)
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    console.log('📊 Customers API called, User ID:', userId, 'Role:', userRole)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // Build query based on user role
    let whereConditions = []
    let queryParams = []

    if (userRole === 'connector') {
      // Connectors can only see their own customers
      const connectorResult = await executeQuery(
        'SELECT id FROM connectors WHERE user_id = ?',
        [userId]
      )
      
      if (connectorResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Connector not found' },
          { status: 404 }
        )
      }

      whereConditions.push('c.connector_id = ?')
      queryParams.push(connectorResult[0].id)
    } else if (userRole === 'super_admin' || userRole === 'operator') {
      // Admin and operators can see all customers - no additional where clause needed
    } else {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    if (search && search.trim() !== '') {
      whereConditions.push('(c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)')
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : ''

    console.log('📝 WHERE clause:', whereClause)
    console.log('📝 Query params:', queryParams)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM customers c
      ${whereClause}
    `
    
    console.log('🔢 Count query:', countQuery)
    const countResult = await executeQuery(countQuery, queryParams)
    const total = countResult[0].total
    console.log('📊 Total customers found:', total)

    // Get customers with pagination - build the complete query with LIMIT directly
    const customersQuery = `
      SELECT 
        c.id, c.first_name, c.last_name, c.email, c.phone, 
        c.date_of_birth, c.gender, c.marital_status,
        c.address, c.city, c.state, c.pincode,
        c.aadhar_number, c.pan_number, c.created_at,
        conn.agent_code,
        up.first_name as connector_first_name,
        up.last_name as connector_last_name
      FROM customers c
      LEFT JOIN connectors conn ON c.connector_id = conn.id
      LEFT JOIN users u ON conn.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `

    console.log('👥 Customers query:', customersQuery)
    console.log('👥 Query params:', queryParams)

    const customers = await executeQuery(customersQuery, queryParams)
    console.log('✅ Customers fetched:', customers.length)

    return NextResponse.json({
      success: true,
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('❌ Get customers error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customers: ' + error.message },
      { status: 500 }
    )
  }
}

// POST - Create new customer (FIXED VERSION)
export async function POST(request) {
    try {
      const userId = request.headers.get('x-user-id')
      const userRole = request.headers.get('x-user-role')
  
      console.log('👤 Creating customer, User ID:', userId, 'Role:', userRole)
  
      if (!userId || userRole !== 'connector') {
        return NextResponse.json(
          { success: false, message: 'Only connectors can add customers' },
          { status: 403 }
        )
      }
  
      const body = await request.json()
      const { isValid, errors } = validateCustomerData(body)
  
      if (!isValid) {
        return NextResponse.json(
          { success: false, errors },
          { status: 400 }
        )
      }
  
      // Get connector ID
      const connectorResult = await executeQuery(
        'SELECT id FROM connectors WHERE user_id = ?',
        [userId]
      )
  
      if (connectorResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Connector not found' },
          { status: 404 }
        )
      }
  
      const connectorId = connectorResult[0].id
      console.log('🔗 Connector ID:', connectorId)
  
      const {
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        gender,
        marital_status,
        address,
        city,
        state,
        pincode,
        aadhar_number,
        pan_number
      } = body
  
      // Format date_of_birth for MySQL
      let formattedDateOfBirth = null
      if (date_of_birth) {
        try {
          const date = new Date(date_of_birth)
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD for MySQL
            formattedDateOfBirth = date.toISOString().split('T')[0]
          }
        } catch (error) {
          console.error('Date parsing error:', error)
        }
      }
  
      console.log('📅 Original date:', date_of_birth, 'Formatted date:', formattedDateOfBirth)
  
      // Check if customer with same Aadhar or PAN already exists
      const existingCustomer = await executeQuery(
        'SELECT id FROM customers WHERE aadhar_number = ? OR pan_number = ?',
        [aadhar_number, pan_number]
      )
  
      if (existingCustomer.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Customer with this Aadhar or PAN already exists' },
          { status: 409 }
        )
      }
  
      // Insert customer
      const result = await executeQuery(
        `INSERT INTO customers 
         (connector_id, first_name, last_name, email, phone, date_of_birth, gender, marital_status, 
          address, city, state, pincode, aadhar_number, pan_number) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          connectorId, 
          first_name, 
          last_name, 
          email || null, 
          phone, 
          formattedDateOfBirth, 
          gender || null, 
          marital_status || null, 
          address, 
          city, 
          state, 
          pincode, 
          aadhar_number, 
          pan_number
        ]
      )
  
      const customerId = result.insertId
      console.log('✅ Customer created with ID:', customerId)
  
      // Update connector's total cases
      await executeQuery(
        'UPDATE connectors SET total_cases_submitted = total_cases_submitted + 1 WHERE id = ?',
        [connectorId]
      )
  
      // Log activity
      await executeQuery(
        'INSERT INTO system_logs (user_id, action, entity_type, entity_id, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [
          userId,
          'CUSTOMER_CREATED',
          'customer',
          customerId,
          JSON.stringify({ customer_id: customerId, name: `${first_name} ${last_name}`, date_of_birth: formattedDateOfBirth }),
          request.headers.get('x-forwarded-for') || 'unknown'
        ]
      )
  
      return NextResponse.json({
        success: true,
        message: 'Customer added successfully',
        data: { customerId }
      }, { status: 201 })
  
    } catch (error) {
      console.error('❌ Create customer error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to create customer: ' + error.message },
        { status: 500 }
      )
    }
  }
  
