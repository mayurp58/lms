import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request, { params }) {
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

    // Get banker's bank using existing bankers table
    const bankerBankQuery = `
      SELECT b.id as bank_id, b.name as bank_name, b.code as bank_code,
             bk.employee_id, bk.designation, bk.max_approval_limit
      FROM bankers bk
      JOIN banks b ON bk.bank_id = b.id 
      WHERE bk.user_id = ?
    `
    const bankerBank = await executeQuery(bankerBankQuery, [userId])
    
    if (bankerBank.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Banker not associated with any bank' },
        { status: 400 }
      )
    }

    // Check if this application was distributed to banker's bank
    const distributionQuery = `
      SELECT ad.*, la.*, c.*, lc.name as loan_category_name
      FROM application_distributions ad
      JOIN loan_applications la ON ad.loan_application_id = la.id
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      WHERE ad.loan_application_id = ? AND ad.bank_id = ?
    `
    
    const distributionResult = await executeQuery(distributionQuery, [id, bankerBank[0].bank_id])
    
    if (distributionResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Application not found or not assigned to your bank' },
        { status: 404 }
      )
    }

    const application = distributionResult[0]

    // Mark as viewed if not already
    if (application.status === 'sent') {
      await executeQuery(
        'UPDATE application_distributions SET status = "viewed", viewed_at = NOW() WHERE loan_application_id = ? AND bank_id = ?',
        [id, bankerBank[0].bank_id]
      )
    }

    // Get documents
    const documentsQuery = `
      SELECT cd.id, dt.name as document_name, cd.file_path, cd.verification_status, cd.uploaded_at
      FROM customer_documents cd
      LEFT JOIN document_types dt ON dt.id=cd.document_type_id
      WHERE cd.loan_application_id = ?
      ORDER BY cd.uploaded_at DESC
    `
    const documents = await executeQuery(documentsQuery, [id])

    // Get banker's offer
    const myOfferQuery = `
      SELECT * FROM loan_offers 
      WHERE loan_application_id = ? AND banker_user_id = ?
      ORDER BY created_at DESC LIMIT 1
    `
    const myOfferResult = await executeQuery(myOfferQuery, [id, userId])
    const my_offer = myOfferResult[0] || null

    // Get competing offers (excluding banker's own offer)
    const competingOffersQuery = `
      SELECT lo.*, b.name as bank_name, b.code as bank_code
      FROM loan_offers lo
      JOIN banks b ON lo.bank_id = b.id
      WHERE lo.loan_application_id = ? AND lo.banker_user_id != ? AND lo.status = 'active'
      ORDER BY lo.created_at DESC
    `
    const competing_offers = await executeQuery(competingOffersQuery, [id, userId])

    return NextResponse.json({
      success: true,
      data: {
        application,
        documents,
        my_offer,
        competing_offers,
        banker_info: bankerBank[0]
      }
    })

  } catch (error) {
    console.error('Get banker application error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch application: ' + error.message },
      { status: 500 }
    )
  }
}
