import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate') 
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || '30days' // 7days, 30days, 90days, 1year

    let dateFilter = ''
    let dateParams = []

    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(la.created_at) BETWEEN ? AND ?'
      dateParams = [startDate, endDate]
    } else {
      const days = period === '7days' ? 7 : period === '30days' ? 30 : period === '90days' ? 90 : 365
      dateFilter = 'WHERE la.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)'
      dateParams = [days]
    }

    let reportData = {}

    switch (reportType) {
      case 'overview':
        reportData = await generateOverviewReport(dateFilter, dateParams)
        break
      case 'financial':
        reportData = await generateFinancialReport(dateFilter, dateParams)
        break
      case 'performance':
        reportData = await generatePerformanceReport(dateFilter, dateParams)
        break
      case 'detailed':
        reportData = await generateDetailedReport(dateFilter, dateParams)
        break
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid report type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      reportType,
      period: { startDate, endDate, period }
    })

  } catch (error) {
    console.error('Admin reports error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to generate report: ' + error.message },
      { status: 500 }
    )
  }
}

// Overview Report - FIXED with proper aliases
async function generateOverviewReport(dateFilter, dateParams) {
  // Application Statistics
  const applicationStats = await executeQuery(`
    SELECT 
      COUNT(*) as total_applications,
      COUNT(CASE WHEN la.status = 'submitted' THEN 1 END) as submitted,
      COUNT(CASE WHEN la.status = 'under_verification' THEN 1 END) as under_verification,
      COUNT(CASE WHEN la.status = 'verified' THEN 1 END) as verified,
      COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approved,
      COUNT(CASE WHEN la.status = 'rejected' THEN 1 END) as rejected,
      COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as disbursed,
      ROUND(AVG(CASE WHEN la.status IN ('approved', 'disbursed') THEN la.approved_amount END), 2) as avg_approval_amount,
      ROUND(AVG(CASE WHEN la.status IN ('approved', 'disbursed') THEN la.approved_interest_rate END), 2) as avg_interest_rate
    FROM loan_applications la
    ${dateFilter}
  `, dateParams)

  // Daily Application Trend
  const dailyTrend = await executeQuery(`
    SELECT 
      DATE(la.created_at) as date,
      COUNT(*) as applications,
      COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approvals,
      COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as disbursals,
      COALESCE(SUM(CASE WHEN la.status = 'approved' THEN la.approved_amount ELSE 0 END), 0) as approved_amount,
      COALESCE(SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END), 0) as disbursed_amount
    FROM loan_applications la
    ${dateFilter}
    GROUP BY DATE(la.created_at)
    ORDER BY date DESC
  `, dateParams)

  // Loan Category Performance
  const categoryPerformance = await executeQuery(`
    SELECT 
      lc.name as category,
      COUNT(la.id) as applications,
      COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approvals,
      COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as disbursals,
      ROUND((COUNT(CASE WHEN la.status = 'approved' THEN 1 END) * 100.0 / COUNT(la.id)), 2) as approval_rate,
      COALESCE(SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END), 0) as total_disbursed
    FROM loan_categories lc
    LEFT JOIN loan_applications la ON lc.id = la.loan_category_id 
    ${dateFilter.replace('WHERE la.created_at', 'WHERE la.created_at').replace('WHERE', 'AND')}
    GROUP BY lc.id, lc.name
    HAVING applications > 0
    ORDER BY total_disbursed DESC
  `, dateParams)

  // Top Performers
  const topConnectors = await executeQuery(`
    SELECT 
      conn.agent_code,
      up.first_name, up.last_name,
      COUNT(la.id) as applications,
      COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approvals,
      COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as disbursals,
      COALESCE(SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END), 0) as total_business
    FROM connectors conn
    JOIN users u ON conn.user_id = u.id
    JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN loan_applications la ON conn.id = la.connector_id
    ${dateFilter.replace('WHERE la.created_at', 'WHERE la.created_at').replace('WHERE', 'AND')}
    GROUP BY conn.id, conn.agent_code, up.first_name, up.last_name
    HAVING applications > 0
    ORDER BY total_business DESC
    LIMIT 10
  `, dateParams)

  return {
    applicationStats: applicationStats[0],
    dailyTrend,
    categoryPerformance,
    topConnectors
  }
}

// Financial Report - FIXED with proper aliases
async function generateFinancialReport(dateFilter, dateParams) {
  // Financial Summary
  const financialSummary = await executeQuery(`
    SELECT 
      COALESCE(SUM(CASE WHEN la.status = 'approved' THEN la.approved_amount ELSE 0 END), 0) as total_approved,
      COALESCE(SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END), 0) as total_disbursed,
      COALESCE(SUM(la.requested_amount), 0) as total_requested,
      COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approved_count,
      COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as disbursed_count
    FROM loan_applications la
    ${dateFilter}
  `, dateParams)

  // Monthly Financial Breakdown
  const monthlyBreakdown = await executeQuery(`
    SELECT 
      DATE_FORMAT(la.created_at, '%Y-%m') as month,
      COUNT(*) as applications,
      COALESCE(SUM(la.requested_amount), 0) as requested_amount,
      COALESCE(SUM(CASE WHEN la.status = 'approved' THEN la.approved_amount ELSE 0 END), 0) as approved_amount,
      COALESCE(SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END), 0) as disbursed_amount,
      ROUND(AVG(CASE WHEN la.status IN ('approved', 'disbursed') THEN la.approved_interest_rate END), 2) as avg_interest_rate
    FROM loan_applications la
    ${dateFilter}
    GROUP BY DATE_FORMAT(la.created_at, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12
  `, dateParams)

  // Commission Analysis - FIXED QUERY
  let commissionDateFilter = ''
  let commissionParams = []
  
  if (dateParams.length > 0) {
    if (dateFilter.includes('BETWEEN')) {
      commissionDateFilter = 'WHERE DATE(cr.created_at) BETWEEN ? AND ?'
      commissionParams = dateParams
    } else {
      commissionDateFilter = 'WHERE cr.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)'
      commissionParams = dateParams
    }
  }

  const commissionAnalysis = await executeQuery(`
    SELECT 
      COALESCE(SUM(CASE WHEN cr.status = 'earned' THEN cr.commission_amount ELSE 0 END), 0) as pending_commission,
      COALESCE(SUM(CASE WHEN cr.status = 'paid' THEN cr.commission_amount ELSE 0 END), 0) as paid_commission,
      COUNT(CASE WHEN cr.status = 'earned' THEN 1 END) as pending_count,
      COUNT(CASE WHEN cr.status = 'paid' THEN 1 END) as paid_count,
      ROUND(AVG(cr.commission_percentage), 2) as avg_commission_rate
    FROM commission_records cr
    ${commissionDateFilter}
  `, commissionParams)

  // Loan Amount Distribution
  const amountDistribution = await executeQuery(`
    SELECT 
      CASE 
        WHEN la.approved_amount <= 100000 THEN '0-1L'
        WHEN la.approved_amount <= 500000 THEN '1-5L'
        WHEN la.approved_amount <= 1000000 THEN '5-10L'
        WHEN la.approved_amount <= 2000000 THEN '10-20L'
        ELSE '20L+'
      END as amount_range,
      COUNT(*) as count,
      COALESCE(SUM(la.approved_amount), 0) as total_amount
    FROM loan_applications la
    WHERE la.status IN ('approved', 'disbursed') 
    ${dateFilter.replace('WHERE la.created_at', 'AND la.created_at')}
    GROUP BY amount_range
    ORDER BY 
      CASE amount_range
        WHEN '0-1L' THEN 1
        WHEN '1-5L' THEN 2
        WHEN '5-10L' THEN 3
        WHEN '10-20L' THEN 4
        WHEN '20L+' THEN 5
      END
  `, dateParams)

  return {
    financialSummary: financialSummary[0],
    monthlyBreakdown,
    commissionAnalysis: commissionAnalysis[0],
    amountDistribution
  }
}

// Performance Report - FIXED with proper aliases and NO u.phone
async function generatePerformanceReport(dateFilter, dateParams) {
  // Banker Performance
  const bankerPerformance = await executeQuery(`
    SELECT 
      up.first_name, up.last_name,
      b.employee_id, b.designation,
      COUNT(la.id) as reviews,
      COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approvals,
      COUNT(CASE WHEN la.status = 'rejected' THEN 1 END) as rejections,
      ROUND((COUNT(CASE WHEN la.status = 'approved' THEN 1 END) * 100.0 / NULLIF(COUNT(la.id), 0)), 2) as approval_rate,
      COALESCE(SUM(CASE WHEN la.status = 'approved' THEN la.approved_amount ELSE 0 END), 0) as total_approved,
      ROUND(AVG(CASE WHEN la.status = 'approved' THEN la.approved_amount END), 0) as avg_approval_amount
    FROM bankers b
    JOIN users u ON b.user_id = u.id
    JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN loan_applications la ON u.id = la.approved_by 
    ${dateFilter.replace('WHERE la.created_at', 'WHERE la.created_at').replace('WHERE', 'AND')}
    GROUP BY b.id, up.first_name, up.last_name, b.employee_id, b.designation
    HAVING reviews > 0
    ORDER BY total_approved DESC
  `, dateParams)

  // Operator Performance - FIXED QUERY
  let operatorDateFilter = ''
  let operatorParams = []
  
  if (dateParams.length > 0) {
    if (dateFilter.includes('BETWEEN')) {
      operatorDateFilter = 'AND DATE(cd.verified_at) BETWEEN ? AND ?'
      operatorParams = dateParams
    } else {
      operatorDateFilter = 'AND cd.verified_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)'
      operatorParams = dateParams
    }
  }

  const operatorPerformance = await executeQuery(`
    SELECT 
      up.first_name, up.last_name,
      COUNT(cd.id) as documents_processed,
      COUNT(CASE WHEN cd.verification_status = 'verified' THEN 1 END) as verified,
      COUNT(CASE WHEN cd.verification_status = 'rejected' THEN 1 END) as rejected,
      ROUND((COUNT(CASE WHEN cd.verification_status = 'verified' THEN 1 END) * 100.0 / NULLIF(COUNT(cd.id), 0)), 2) as verification_rate
    FROM users u
    JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN customer_documents cd ON u.id = cd.verified_by
    WHERE u.role = 'operator'
    ${operatorDateFilter}
    GROUP BY u.id, up.first_name, up.last_name
    HAVING documents_processed > 0
    ORDER BY documents_processed DESC
  `, operatorParams)

  // Connector Performance Detail - FIXED: removed u.phone
  const connectorPerformance = await executeQuery(`
    SELECT 
      conn.agent_code,
      up.first_name, up.last_name,
      u.email,
      up.phone,
      conn.commission_percentage,
      COUNT(la.id) as applications,
      COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approvals,
      COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as disbursals,
      ROUND((COUNT(CASE WHEN la.status = 'approved' THEN 1 END) * 100.0 / NULLIF(COUNT(la.id), 0)), 2) as success_rate,
      COALESCE(SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END), 0) as total_business,
      COALESCE(SUM(cr.commission_amount), 0) as total_commission_earned
    FROM connectors conn
    JOIN users u ON conn.user_id = u.id
    JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN loan_applications la ON conn.id = la.connector_id
    ${dateFilter.replace('WHERE la.created_at', 'WHERE la.created_at').replace('WHERE', 'AND')}
    LEFT JOIN commission_records cr ON conn.id = cr.connector_id AND cr.status = 'paid'
    GROUP BY conn.id, conn.agent_code, up.first_name, up.last_name, u.email, up.phone, conn.commission_percentage
    HAVING applications > 0
    ORDER BY total_business DESC
  `, dateParams)

  // Processing Time Analysis
  const processingTimeAnalysis = await executeQuery(`
    SELECT 
      AVG(CASE WHEN la.approved_at IS NOT NULL 
           THEN DATEDIFF(la.approved_at, la.created_at) 
           ELSE NULL END) as avg_approval_days,
      AVG(CASE WHEN la.disbursed_at IS NOT NULL 
           THEN DATEDIFF(la.disbursed_at, la.approved_at) 
           ELSE NULL END) as avg_disbursement_days,
      AVG(CASE WHEN la.disbursed_at IS NOT NULL 
           THEN DATEDIFF(la.disbursed_at, la.created_at) 
           ELSE NULL END) as avg_total_days
    FROM loan_applications la
    ${dateFilter}
  `, dateParams)

  return {
    bankerPerformance,
    operatorPerformance,
    connectorPerformance,
    processingTimeAnalysis: processingTimeAnalysis[0]
  }
}

// Detailed Report - FIXED with proper aliases
async function generateDetailedReport(dateFilter, dateParams) {
  // Detailed Applications
  const detailedApplications = await executeQuery(`
    SELECT 
      la.application_number,
      la.created_at,
      la.requested_amount,
      la.approved_amount,
      la.disbursed_amount,
      la.status,
      la.approved_interest_rate,
      la.approved_tenure_months,
      c.first_name as customer_first_name,
      c.last_name as customer_last_name,
      c.phone as customer_phone,
      lc.name as loan_category,
      conn.agent_code,
      cup.first_name as connector_first_name,
      cup.last_name as connector_last_name,
      bup.first_name as banker_first_name,
      bup.last_name as banker_last_name,
      la.approved_at,
      la.disbursed_at
    FROM loan_applications la
    JOIN customers c ON la.customer_id = c.id
    JOIN loan_categories lc ON la.loan_category_id = lc.id
    JOIN connectors conn ON la.connector_id = conn.id
    JOIN users cu ON conn.user_id = cu.id
    JOIN user_profiles cup ON cu.id = cup.user_id
    LEFT JOIN users bu ON la.approved_by = bu.id
    LEFT JOIN user_profiles bup ON bu.id = bup.user_id
    ${dateFilter}
    ORDER BY la.created_at DESC
    LIMIT 1000
  `, dateParams)

  return {
    detailedApplications
  }
}
