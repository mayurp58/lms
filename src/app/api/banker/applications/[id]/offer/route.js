import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'banker') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const {
      offered_amount,
      interest_rate,
      tenure_months,
      processing_fee = 0,
      terms_conditions,
      special_features,
      remarks
    } = await request.json()

    if (!offered_amount || !interest_rate || !tenure_months) {
      return NextResponse.json(
        { success: false, message: 'Amount, interest rate, and tenure are required' },
        { status: 400 }
      )
    }

    // Get banker's bank using existing bankers table
    const bankerBankQuery = `
      SELECT b.id, b.name, bk.max_approval_limit
      FROM bankers bk
      JOIN banks b ON bk.bank_id = b.id 
      WHERE bk.user_id = ?
    `
    const bankerBank = await executeQuery(bankerBankQuery, [userId])
    
    if (bankerBank.length === 0) {
      return NextResponse.json({ success: false, message: 'Banker not associated with any bank' }, { status: 400 })
    }

    const bankInfo = bankerBank[0]

    // Check approval limit if set
    if (bankInfo.max_approval_limit && offered_amount > bankInfo.max_approval_limit) {
      return NextResponse.json(
        { success: false, message: `Offered amount exceeds your approval limit of ${bankInfo.max_approval_limit}` },
        { status: 400 }
      )
    }

    // Check if application is available for offers
    const appQuery = `
      SELECT la.id FROM loan_applications la
      JOIN application_distributions ad ON la.id = ad.loan_application_id
      WHERE la.id = ? AND ad.bank_id = ? AND la.marketplace_status IN ('distributed', 'offers_received')
    `
    const appResult = await executeQuery(appQuery, [id, bankInfo.id])
    
    if (appResult.length === 0) {
      return NextResponse.json({ success: false, message: 'Application not available for offers' }, { status: 400 })
    }

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 7) // 7 days validity

    // Insert offer WITHOUT monthly_emi (let database calculate it)
    const offerQuery = `
      INSERT INTO loan_offers (
        loan_application_id, bank_id, banker_user_id, offered_amount, 
        interest_rate, tenure_months, processing_fee, 
        valid_until, terms_conditions, special_features, remarks, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `
    
    const result = await executeQuery(offerQuery, [
      id, bankInfo.id, userId, offered_amount, interest_rate, 
      tenure_months, processing_fee, validUntil, terms_conditions, special_features, remarks
    ])

    // Calculate EMI for response (even though DB calculates it)
    const monthlyRate = interest_rate / (12 * 100)
    const emi = Math.round((offered_amount * monthlyRate * Math.pow(1 + monthlyRate, tenure_months)) / 
                          (Math.pow(1 + monthlyRate, tenure_months) - 1))

    // Update application status to offers_received
    await executeQuery("UPDATE loan_applications SET marketplace_status = 'offers_received' WHERE id = ?", [id])

    // Update distribution status
    await executeQuery(
      "UPDATE application_distributions SET status = 'offer_received' WHERE loan_application_id = ? AND bank_id = ?", 
      [id, bankInfo.id]
    )

    return NextResponse.json({
      success: true,
      message: 'Loan offer submitted successfully',
      data: {
        offer_id: result.insertId,
        offered_amount,
        interest_rate,
        tenure_months,
        monthly_emi: emi,
        bank_name: bankInfo.name
      }
    })
  } catch (error) {
    console.error('Submit offer error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to submit offer: ' + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'banker') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const {
      offered_amount,
      interest_rate,
      tenure_months,
      processing_fee = 0,
      terms_conditions,
      special_features,
      remarks
    } = await request.json()

    if (!offered_amount || !interest_rate || !tenure_months) {
      return NextResponse.json(
        { success: false, message: 'Amount, interest rate, and tenure are required' },
        { status: 400 }
      )
    }

    // Check if banker has an existing active offer
    const existingOfferQuery = `
      SELECT lo.id, bk.max_approval_limit
      FROM loan_offers lo
      JOIN bankers bk ON lo.banker_user_id = bk.user_id
      WHERE lo.loan_application_id = ? AND lo.banker_user_id = ? AND lo.status = 'active'
    `
    
    const existingOffer = await executeQuery(existingOfferQuery, [id, userId])
    
    if (existingOffer.length === 0) {
      return NextResponse.json({ success: false, message: 'No active offer found to update' }, { status: 404 })
    }

    const offerInfo = existingOffer[0]

    // Check approval limit if set
    if (offerInfo.max_approval_limit && offered_amount > offerInfo.max_approval_limit) {
      return NextResponse.json(
        { success: false, message: `Offered amount exceeds your approval limit of ${offerInfo.max_approval_limit}` },
        { status: 400 }
      )
    }

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 7)

    // Update the offer WITHOUT monthly_emi (let database calculate it)
    const updateOfferQuery = `
      UPDATE loan_offers SET
        offered_amount = ?, interest_rate = ?, tenure_months = ?, processing_fee = ?,
        valid_until = ?, terms_conditions = ?, special_features = ?, remarks = ?,
        updated_at = NOW()
      WHERE id = ?
    `

    await executeQuery(updateOfferQuery, [
      offered_amount, interest_rate, tenure_months, processing_fee,
      validUntil, terms_conditions, special_features, remarks, offerInfo.id
    ])

    // Calculate EMI for response
    const monthlyRate = interest_rate / (12 * 100)
    const emi = Math.round((offered_amount * monthlyRate * Math.pow(1 + monthlyRate, tenure_months)) / 
                          (Math.pow(1 + monthlyRate, tenure_months) - 1))

    return NextResponse.json({
      success: true,
      message: 'Loan offer updated successfully',
      data: {
        offer_id: offerInfo.id,
        offered_amount,
        interest_rate,
        tenure_months,
        monthly_emi: emi
      }
    })

  } catch (error) {
    console.error('Update offer error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update offer: ' + error.message },
      { status: 500 }
    )
  }
}
