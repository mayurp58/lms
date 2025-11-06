import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function POST(request, { params }) {
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

    const { bank_id,banker_id, response_due_hours = 48 } = await request.json()

    if (!bank_id || bank_id.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please select a banker' },
        { status: 400 }
      )
    }

    // Check if application exists and is verified
    const appQuery = 'SELECT id, status FROM loan_applications WHERE id = ?'
    const appResult = await executeQuery(appQuery, [id])
    
    if (appResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    /*if (appResult[0].status !== 'verified') {
      return NextResponse.json(
        { success: false, message: 'Application must be verified before distributing to banks' },
        { status: 400 }
      )
    }*/

    // Calculate response due date
    const responseDueDate = new Date()
    responseDueDate.setHours(responseDueDate.getHours() + response_due_hours)


    const duplicateCheckQuery = `
      SELECT id FROM application_distributions 
      WHERE loan_application_id = ? AND (
        (banker_user_id = ?) OR 
        (bank_id = ? AND banker_user_id = ?)
      )
    `
    
    const existingDistribution = await executeQuery(duplicateCheckQuery, [
      id, 
      banker_id, 
      bank_id, 
      banker_id
    ])
    
    if (existingDistribution.length > 0) {
      return NextResponse.json(
        { success: false, message: 'This application has already been sent to this banker/branch' },
        { status: 400 }
      )
    }
   

    const distributionQuery = `
        INSERT INTO application_distributions 
        (loan_application_id, bank_id, banker_user_id, operator_user_id, response_due_date, sent_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `
     executeQuery(distributionQuery, [id, bank_id, banker_id, userId, responseDueDate])

    // Update application marketplace status
    const updateAppQuery = `
      UPDATE loan_applications 
      SET status='sent_to_bankers', marketplace_status = 'distributed', updated_at = NOW() 
      WHERE id = ?
    `
    await executeQuery(updateAppQuery, [id])

    // Log the activity
    const logQuery = `
      INSERT INTO system_logs (
        user_id, action, entity_type, entity_id, 
        new_values, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `

    await executeQuery(logQuery, [
      userId,
      'APPLICATION_DISTRIBUTED',
      'loan_application',
      id,
      JSON.stringify({ distributed_to_banks: bank_id, banker_id, response_due_hours }),
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    return NextResponse.json({
      success: true,
      message: `Application assigned to banker successfully`,
      data: {
        distributed_count: bank_id.length,
        response_due_date: responseDueDate
      }
    })

  } catch (error) {
    console.error('Assign application error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to assign application: ' + error.message },
      { status: 500 }
    )
  }
}
