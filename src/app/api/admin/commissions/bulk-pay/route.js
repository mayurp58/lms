import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

// POST - Process bulk commission payments
export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      commission_ids,
      payment_method,
      payment_reference,
      payment_date,
      payment_remarks
    } = body

    if (!commission_ids || commission_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No commissions selected' },
        { status: 400 }
      )
    }

    if (!payment_method || !payment_reference) {
      return NextResponse.json(
        { success: false, message: 'Payment method and reference are required' },
        { status: 400 }
      )
    }

    // Start transaction
    await executeQuery('START TRANSACTION')

    try {
      // Get commission details before payment
      const placeholders = commission_ids.map(() => '?').join(',')
      const commissionsQuery = `
        SELECT cr.*, conn.agent_code, up.first_name, up.last_name
        FROM commission_records cr
        JOIN connectors conn ON cr.connector_id = conn.id
        JOIN users u ON conn.user_id = u.id
        JOIN user_profiles up ON u.id = up.user_id
        WHERE cr.id IN (${placeholders}) AND cr.status = 'earned'
      `

      const commissions = await executeQuery(commissionsQuery, commission_ids)

      if (commissions.length === 0) {
        await executeQuery('ROLLBACK')
        return NextResponse.json(
          { success: false, message: 'No eligible commissions found' },
          { status: 404 }
        )
      }

      // Calculate total amount
      const totalAmount = commissions.reduce((sum, comm) => sum + parseFloat(comm.commission_amount), 0)

      // Update commission records
      const updateQuery = `
        UPDATE commission_records 
        SET status = 'paid', 
            paid_at = ?, 
            paid_by = ?, 
            payment_reference = ?
        WHERE id IN (${placeholders}) AND status = 'earned'
      `

      const updateParams = [
        payment_date || new Date(),
        userId,
        payment_reference,
        ...commission_ids
      ]

      await executeQuery(updateQuery, updateParams)

      // Create bulk payment record
      await executeQuery(
        `INSERT INTO commission_payments 
         (payment_reference, payment_method, total_amount, commission_count, payment_date, paid_by, remarks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [payment_reference, payment_method, totalAmount, commissions.length, payment_date || new Date(), userId, payment_remarks]
      )

      // Log individual payment activities
      for (const commission of commissions) {
        await executeQuery(
          'INSERT INTO system_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            userId,
            'COMMISSION_PAID',
            'commission_record',
            commission.id,
            JSON.stringify({ old_status: 'earned' }),
            JSON.stringify({ 
              new_status: 'paid',
              payment_reference,
              payment_method,
              amount: parseFloat(commission.commission_amount),
              connector: `${commission.first_name} ${commission.last_name} (${commission.agent_code})`
            }),
            request.headers.get('x-forwarded-for') || 'unknown'
          ]
        )
      }

      // Commit transaction
      await executeQuery('COMMIT')

      return NextResponse.json({
        success: true,
        message: `Successfully paid ${commissions.length} commissions`,
        data: {
          paid_count: commissions.length,
          total_amount: totalAmount,
          payment_reference
        }
      })

    } catch (error) {
      // Rollback transaction
      await executeQuery('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Bulk commission payment error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process payments: ' + error.message },
      { status: 500 }
    )
  }
}
