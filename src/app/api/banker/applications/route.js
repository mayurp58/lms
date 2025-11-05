import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'banker') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20

    // Get banker's bank information using existing bankers table
    const bankerBankQuery = `
      SELECT b.id as bank_id, b.name as bank_name, b.code as bank_code,
             bk.employee_id, bk.designation, bk.department, bk.max_approval_limit
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

    const bankInfo = bankerBank[0]

    // Get applications distributed to this bank
    let whereCondition = 'WHERE ad.bank_id = ?'
    let queryParams = [bankInfo.bank_id]

    // Apply filters
    if (filter === 'pending') {
      whereCondition += ' AND la.status = "submitted"'
    } else if (filter === 'approved') {
      whereCondition += ' AND la.status = "approved"'
    } else if (filter === 'disbursed') {
      whereCondition += ' AND la.status = "disbursed"'
    }
    else
    {
      whereCondition += ` AND la.status = "${filter}"`
    }

    console.log(whereCondition)

    const applicationsQuery = `
      SELECT 
        la.id,
        la.application_number,
        la.requested_amount,
        la.status,
        la.marketplace_status,
        la.created_at,
        la.monthly_income,
        la.employment_type,
        la.company_name,
        la.work_experience_years,
        la.existing_loans_amount,

        
        -- Customer details
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone as customer_phone,
        c.email as customer_email,
        
        -- Loan category
        lc.name as loan_category_name,
        
        -- Distribution info
        ad.status as distribution_status,
        ad.sent_at,
        ad.viewed_at,
        ad.response_due_date,
        
        -- My offer info
        lo.id as my_offer_id,
        lo.offered_amount as my_offer_amount,
        lo.interest_rate as my_offer_rate,
        lo.tenure_months as my_offer_tenure,
        lo.status as my_offer_status,
        
        -- Competition info
        (SELECT COUNT(*) FROM loan_offers lo2 WHERE lo2.loan_application_id = la.id AND lo2.status = 'active') as total_offers
        
      FROM application_distributions ad
      JOIN loan_applications la ON ad.loan_application_id = la.id
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      LEFT JOIN loan_offers lo ON la.id = lo.loan_application_id AND lo.banker_user_id = ?
      ${whereCondition}
      ORDER BY ad.sent_at DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `
    console.log(applicationsQuery)
    console.log(userId, ...queryParams)
    const applications = await executeQuery(applicationsQuery, [userId, ...queryParams])

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN ad.status = 'sent' THEN 1 END) as pending_review,
        COUNT(CASE WHEN ad.status = 'viewed' THEN 1 END) as applications_reviewed,
        COUNT(CASE WHEN lo.id IS NOT NULL THEN 1 END) as offers_submitted,
        COUNT(CASE WHEN lo.status = 'selected' THEN 1 END) as offers_selected
      FROM application_distributions ad
      LEFT JOIN loan_offers lo ON ad.loan_application_id = lo.loan_application_id AND lo.banker_user_id = ?
      WHERE ad.bank_id = ?
    `

    const statsResult = await executeQuery(statsQuery, [userId, bankInfo.bank_id])
    const stats = statsResult[0] || {}

    return NextResponse.json({
      success: true,
      data: {
        applications,
        stats,
        banker_info: bankInfo,
        pagination: {
          page,
          limit,
          total: applications.length
        }
      }
    })

  } catch (error) {
    console.error('Banker applications error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch applications: ' + error.message },
      { status: 500 }
    )
  }
}
