import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

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

    const { commission_ids, payment_method, payment_reference, remarks } = await request.json()

    if (!commission_ids || !Array.isArray(commission_ids) || commission_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No commissions selected' },
        { status: 400 }
      )
    }

    // Get commission details before payment - FIXED: using up.phone
    const detailsQuery = `
      SELECT 
        cr.*,
        conn.agent_code,
        up.first_name,
        up.last_name,
        up.phone,
        u.email
      FROM commission_records cr
      JOIN connectors conn ON cr.connector_id = conn.id
      JOIN users u ON conn.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      WHERE cr.id IN (${commission_ids.map(() => '?').join(',')}) 
      AND cr.status = 'earned'
    `

    const commissions = await executeQuery(detailsQuery, commission_ids)

    if (commissions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No eligible commissions found' },
        { status: 400 }
      )
    }

    // Update commissions to paid status
    const updateQuery = `
      UPDATE commission_records 
      SET status = 'paid', 
          paid_at = NOW(), 
          payment_reference = ?
      WHERE id IN (${commission_ids.map(() => '?').join(',')}) 
      AND status = 'earned'
    `

    const updateParams = [payment_reference, ...commission_ids]
    await executeQuery(updateQuery, updateParams)

    // Calculate total amount
    const totalAmount = commissions.reduce((sum, comm) => sum + parseFloat(comm.commission_amount), 0)

    // Log the payment activity
    const logQuery = `
      INSERT INTO system_logs (
        user_id, action, entity_type, entity_id, 
        new_values, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `

    const logData = {
      commission_ids,
      total_amount: totalAmount,
      payment_method,
      payment_reference,
      connector_count: commissions.length
    }

    await executeQuery(logQuery, [
      userId,
      'COMMISSION_PAID',
      'commission_batch',
      null,
      JSON.stringify(logData),
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    return NextResponse.json({
      success: true,
      message: 'Commissions paid successfully',
      data: {
        paid_count: commissions.length,
        total_amount: totalAmount.toFixed(2),
        payment_reference
      }
    })

  } catch (error) {
    console.error('Commission payment error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process payments: ' + error.message },
      { status: 500 }
    )
  }
}
