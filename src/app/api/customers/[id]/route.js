import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'
import { validateCustomerData } from '@/lib/validations'
import { formatDateForMySQL } from '@/lib/utils'

// GET - Get single customer
export async function GET(request, { params }) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const { id } = await params

    //console.log('📋 Get customer called, ID:', id, 'User:', userId, 'Role:', userRole)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    let customerQuery = `
      SELECT 
        c.*, 
        conn.agent_code,
        up.first_name as connector_first_name,
        up.last_name as connector_last_name,
        u.email as connector_email
      FROM customers c
      LEFT JOIN connectors conn ON c.connector_id = conn.id
      LEFT JOIN users u ON conn.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.id = ?
    `

    let queryParams = [id]

    // If connector, ensure they can only access their own customers
    if (userRole === 'connector') {
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

      customerQuery += ' AND c.connector_id = ?'
      queryParams.push(connectorResult[0].id)
    }

    const customers = await executeQuery(customerQuery, queryParams)

    if (customers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: customers[0]
    })

  } catch (error) {
    console.error('❌ Get customer error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customer: ' + error.message },
      { status: 500 }
    )
  }
}

// PUT - Update customer
export async function PUT(request, { params }) {
    try {
      const userId = request.headers.get('x-user-id')
      const userRole = request.headers.get('x-user-role')
      const { id } = await params
  
      //console.log('✏️ Update customer called, ID:', id, 'User:', userId, 'Role:', userRole)
  
      if (!userId) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        )
      }
  
      // Only connectors can update their customers, or admins can update any
      if (userRole === 'connector') {
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
  
        // Verify customer belongs to this connector
        const customerCheck = await executeQuery(
          'SELECT id FROM customers WHERE id = ? AND connector_id = ?',
          [id, connectorResult[0].id]
        )
  
        if (customerCheck.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Customer not found or access denied' },
            { status: 404 }
          )
        }
      }
  
      const body = await request.json()
      const { isValid, errors } = validateCustomerData(body, true) // true for update
  
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
        phone,
        date_of_birth,
        gender,
        marital_status,
        address,
        city,
        state,
        pincode
      } = body
  
      // Format date_of_birth for MySQL
      let formattedDateOfBirth = null
      if (date_of_birth) {
        try {
          // Handle both date strings and ISO date strings
          const date = new Date(date_of_birth)
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD for MySQL
            formattedDateOfBirth = date.toISOString().split('T')[0]
          }
        } catch (error) {
          console.error('Date parsing error:', error)
        }
      }
  
      //console.log('📅 Original date:', date_of_birth, 'Formatted date:', formattedDateOfBirth)
  
      // Update customer (excluding Aadhar and PAN as they shouldn't be changed)
      await executeQuery(
        `UPDATE customers SET 
         first_name = ?, last_name = ?, email = ?, phone = ?, 
         date_of_birth = ?, gender = ?, marital_status = ?,
         address = ?, city = ?, state = ?, pincode = ?
         WHERE id = ?`,
        [
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
          id
        ]
      )
  
      // Log activity
      await executeQuery(
        'INSERT INTO system_logs (user_id, action, entity_type, entity_id, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [
          userId,
          'CUSTOMER_UPDATED',
          'customer',
          id,
          JSON.stringify({ ...body, date_of_birth: formattedDateOfBirth }),
          request.headers.get('x-forwarded-for') || 'unknown'
        ]
      )
  
      return NextResponse.json({
        success: true,
        message: 'Customer updated successfully'
      })
  
    } catch (error) {
      console.error('❌ Update customer error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update customer: ' + error.message },
        { status: 500 }
      )
    }
  }
  
