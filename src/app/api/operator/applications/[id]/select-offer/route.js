import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'operator') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const { offer_id } = await request.json()

    // Get offer details
    const offerQuery = 'SELECT * FROM loan_offers WHERE id = ? AND loan_application_id = ?'
    const offerResult = await executeQuery(offerQuery, [offer_id, id])
    
    if (offerResult.length === 0) {
      return NextResponse.json({ success: false, message: 'Offer not found' }, { status: 404 })
    }

    const offer = offerResult[0]

    // Update application with selected offer
    const updateAppQuery = `
      UPDATE loan_applications SET 
        selected_offer_id = ?,
        marketplace_status = 'offer_selected',
        status = 'approved',
        approved_amount = ?,
        approved_interest_rate = ?,
        approved_tenure_months = ?,
        approved_at = NOW()
      WHERE id = ?
    `
    
    await executeQuery(updateAppQuery, [
      offer_id, offer.offered_amount, offer.interest_rate, 
      offer.tenure_months, id
    ])

    // Update offer statuses
    await executeQuery('UPDATE loan_offers SET status = "selected" WHERE id = ?', [offer_id])
    await executeQuery('UPDATE loan_offers SET status = "rejected" WHERE loan_application_id = ? AND id != ?', [id, offer_id])

    return NextResponse.json({
      success: true,
      message: 'Offer selected and loan approved successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to select offer: ' + error.message },
      { status: 500 }
    )
  }
}
