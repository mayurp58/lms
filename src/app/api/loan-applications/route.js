import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'
import { validateLoanApplicationData } from '@/lib/validations'
import { generateApplicationNumber } from '@/lib/utils'

// GET - Fetch loan applications
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    let whereConditions = []
    let queryParams = []

    // Role-based filtering
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

      whereConditions.push('la.connector_id = ?')
      queryParams.push(connectorResult[0].id)
    }

    if (status && status.trim() !== '') {
      whereConditions.push('la.status = ?')
      queryParams.push(status)
    }

    if (search && search.trim() !== '') {
      whereConditions.push('(la.application_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)')
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : ''

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      ${whereClause}
    `
    
    const countResult = await executeQuery(countQuery, queryParams)
    const total = countResult[0].total

    // Get loan applications with pagination
    const applicationsQuery = `
      SELECT 
        la.id, la.application_number, la.requested_amount, la.purpose,
        la.monthly_income, la.employment_type, la.company_name,
        la.status, la.cibil_score, la.created_at,
        c.first_name, c.last_name, c.phone, c.email,
        lc.name as loan_category_name,
        conn.agent_code,
        up.first_name as connector_first_name,
        up.last_name as connector_last_name
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users u ON conn.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      ${whereClause}
      ORDER BY la.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `

    const applications = await executeQuery(applicationsQuery, queryParams)

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Get loan applications error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch loan applications: ' + error.message },
      { status: 500 }
    )
  }
}

// POST - Create new loan application
export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'connector') {
      return NextResponse.json(
        { success: false, message: 'Only connectors can create loan applications' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { isValid, errors } = validateLoanApplicationData(body)

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

    // Verify customer belongs to this connector
    const customerCheck = await executeQuery(
      'SELECT id FROM customers WHERE id = ? AND connector_id = ?',
      [body.customer_id, connectorId]
    )

    if (customerCheck.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Customer not found or access denied' },
        { status: 403 }
      )
    }

    const {
      customer_id,
      loan_category_id,
      requested_amount,
      purpose,
      monthly_income,
      employment_type,
      company_name,
      work_experience_years,
      existing_loans_amount
    } = body

    // Generate application number
    const applicationNumber = generateApplicationNumber()

    // Insert loan application
    const result = await executeQuery(
      `INSERT INTO loan_applications 
       (application_number, customer_id, connector_id, loan_category_id, requested_amount, 
        purpose, monthly_income, employment_type, company_name, work_experience_years, 
        existing_loans_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicationNumber,
        customer_id,
        connectorId,
        loan_category_id,
        requested_amount,
        purpose,
        monthly_income,
        employment_type,
        company_name || null,
        work_experience_years || null,
        existing_loans_amount || 0,
        'submitted'
      ]
    )

    const applicationId = result.insertId

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
        'LOAN_APPLICATION_CREATED',
        'loan_application',
        applicationId,
        JSON.stringify({ 
          application_number: applicationNumber, 
          customer_id, 
          requested_amount,
          loan_category_id 
        }),
        request.headers.get('x-forwarded-for') || 'unknown'
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Loan application created successfully',
      data: { 
        applicationId,
        applicationNumber 
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create loan application error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create loan application: ' + error.message },
      { status: 500 }
    )
  }
}
