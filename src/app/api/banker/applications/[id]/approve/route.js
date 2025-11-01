import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'banker') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const {
      approved_amount,
      interest_rate,
      tenure_months,
      banker_remarks,
      processing_fee = 0
    } = await request.json()

    // Validation
    if (!approved_amount || !interest_rate || !tenure_months) {
      return NextResponse.json(
        { success: false, message: 'Approved amount, interest rate, and tenure are required' },
        { status: 400 }
      )
    }

    // Check if application exists and can be approved
    const appQuery = 'SELECT id, status, marketplace_status FROM loan_applications WHERE id = ?'
    const appResult = await executeQuery(appQuery, [id])
    
    if (appResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    if (appResult[0].status !== 'verified') {
      return NextResponse.json(
        { success: false, message: 'Application must be verified before approval' },
        { status: 400 }
      )
    }

    // Get banker's bank information
    const bankerBankQuery = `
      SELECT b.id as bank_id, b.name as bank_name, b.code as bank_code
      FROM users u
      LEFT JOIN bank_users bu ON u.id = bu.user_id
      LEFT JOIN banks b ON bu.bank_id = b.id
      WHERE u.id = ? AND u.role = 'banker'
    `

    const bankerBankResult = await executeQuery(bankerBankQuery, [userId])
    
    // If banker has no bank association, assign to a default bank or create one
    let bankId, bankName
    if (bankerBankResult.length === 0 || !bankerBankResult[0].bank_id) {
      // Create or get default bank for this banker
      const defaultBankQuery = `
        INSERT IGNORE INTO banks (name, code, description, is_active, created_at) 
        VALUES ('Default Bank', 'DEFAULT', 'Default bank for direct approvals', TRUE, NOW())
      `
      await executeQuery(defaultBankQuery)
      
      const getBankQuery = "SELECT id, name FROM banks WHERE code = 'DEFAULT'"
      const bankResult = await executeQuery(getBankQuery)
      bankId = bankResult[0].id
      bankName = bankResult[0].name
      
      // Associate banker with default bank
      const associateQuery = `
        INSERT IGNORE INTO bank_users (bank_id, user_id, role, is_active, created_at) 
        VALUES (?, ?, 'banker', TRUE, NOW())
      `
      await executeQuery(associateQuery, [bankId, userId])
    } else {
      bankId = bankerBankResult[0].bank_id
      bankName = bankerBankResult[0].bank_name
    }

    // Calculate EMI and totals
    const monthlyRate = interest_rate / (12 * 100)
    const emi = (approved_amount * monthlyRate * Math.pow(1 + monthlyRate, tenure_months)) / 
                (Math.pow(1 + monthlyRate, tenure_months) - 1)
    const totalPayable = emi * tenure_months
    const totalInterest = totalPayable - approved_amount

    // Set validity to 30 days from now
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 30)

    // Create loan offer record
    const insertOfferQuery = `
      INSERT INTO loan_offers (
        loan_application_id, bank_id, banker_user_id,
        offered_amount, interest_rate, tenure_months, processing_fee,
        monthly_emi, total_interest, total_payable,
        status, valid_until, remarks,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'selected', ?, ?, NOW(), NOW())
    `

    const offerResult = await executeQuery(insertOfferQuery, [
      id, bankId, userId,
      approved_amount, interest_rate, tenure_months, processing_fee,
      Math.round(emi), Math.round(totalInterest), Math.round(totalPayable),
      validUntil, banker_remarks || ''
    ])

    const offerId = offerResult.insertId

    // Update application with approval details
    const updateAppQuery = `
      UPDATE loan_applications 
      SET 
        status = 'approved',
        approved_amount = ?,
        approved_interest_rate = ?,
        approved_tenure_months = ?,
        approved_at = NOW(),
        approved_by = ?,
        banker_remarks = ?,
        selected_offer_id = ?,
        marketplace_status = COALESCE(marketplace_status, 'offer_selected'),
        updated_at = NOW()
      WHERE id = ?
    `

    await executeQuery(updateAppQuery, [
      approved_amount,
      interest_rate,
      tenure_months,
      userId,
      banker_remarks || '',
      offerId,
      id
    ])

    // Log the activity
    const logQuery = `
      INSERT INTO system_logs (
        user_id, action, entity_type, entity_id, 
        new_values, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `

    await executeQuery(logQuery, [
      userId,
      'APPLICATION_APPROVED',
      'loan_application',
      id,
      JSON.stringify({
        approved_amount,
        interest_rate,
        tenure_months,
        monthly_emi: Math.round(emi),
        offer_id: offerId,
        bank_id: bankId
      }),
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    return NextResponse.json({
      success: true,
      message: 'Application approved successfully and loan offer created',
      data: {
        application_id: id,
        offer_id: offerId,
        approved_amount,
        interest_rate,
        tenure_months,
        monthly_emi: Math.round(emi),
        total_payable: Math.round(totalPayable),
        bank_name: bankName,
        approved_at: new Date()
      }
    })

  } catch (error) {
    console.error('Approve application error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to approve application: ' + error.message },
      { status: 500 }
    )
  }
}

// Also support POST method
export async function POST(request, { params }) {
  return PUT(request, { params })
}
