import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'operator') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get customer details
    const customerQuery = `
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.phone,
        c.email,
        c.address,
        c.city,
        c.state,
        c.pincode,
        c.aadhar_number,
        c.pan_number,
        c.created_at,
        c.updated_at
      FROM customers c
      WHERE c.id = ?
    `

    const customerResult = await executeQuery(customerQuery, [id])

    if (customerResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      )
    }

    const customer = customerResult[0]

    // Get customer's applications
    const applicationsQuery = `
      SELECT 
        la.id,
        la.application_number,
        la.requested_amount,
        la.approved_amount,
        la.disbursed_amount,
        la.approved_interest_rate,
        la.approved_tenure_months,
        la.status,
        la.created_at,
        la.approved_at,
        la.disbursed_at,
        lc.name as loan_category_name,
        conn.agent_code,
        cup.first_name as connector_first_name,
        cup.last_name as connector_last_name
      FROM loan_applications la
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users cu ON conn.user_id = cu.id
      JOIN user_profiles cup ON cu.id = cup.user_id
      WHERE la.customer_id = ?
      ORDER BY la.created_at DESC
    `

    const applications = await executeQuery(applicationsQuery, [id])

    // Get customer's documents
    const documentsQuery = `
      SELECT 
        cd.id,
        cd.document_type_id,
        cd.file_path,
        cd.verification_status,
        cd.verified_at,
        la.application_number,
        up.first_name as verified_by_name,
        up.last_name as verified_by_last_name
      FROM customer_documents cd
      JOIN loan_applications la ON cd.loan_application_id = la.id
      LEFT JOIN users u ON cd.verified_by = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE la.customer_id = ?
    `

    const documents = await executeQuery(documentsQuery, [id])

    return NextResponse.json({
      success: true,
      data: {
        customer,
        applications,
        documents
      }
    })

  } catch (error) {
    console.error('Get customer details error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customer details: ' + error.message },
      { status: 500 }
    )
  }
}
