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

    const { bank_ids, response_due_hours = 48 } = await request.json()

    if (!bank_ids || bank_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please select at least one bank' },
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

    // Insert distribution records
    const insertPromises = bank_ids.map(bankId => {
      const distributionQuery = `
        INSERT INTO application_distributions 
        (loan_application_id, bank_id, operator_user_id, response_due_date, sent_at)
        VALUES (?, ?, ?, ?, NOW())
      `
      return executeQuery(distributionQuery, [id, bankId, userId, responseDueDate])
    })

    await Promise.all(insertPromises)

    // Update application marketplace status
    const updateAppQuery = `
      UPDATE loan_applications 
      SET marketplace_status = 'distributed', updated_at = NOW() 
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
      JSON.stringify({ distributed_to_banks: bank_ids.length, response_due_hours }),
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    return NextResponse.json({
      success: true,
      message: `Application distributed to ${bank_ids.length} bank(s) successfully`,
      data: {
        distributed_count: bank_ids.length,
        response_due_date: responseDueDate
      }
    })

  } catch (error) {
    console.error('Distribute application error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to distribute application: ' + error.message },
      { status: 500 }
    )
  }
}
