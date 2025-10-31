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
    const reportType = searchParams.get('report_type') || 'overview'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Build date filter
    let dateFilter = ''
    let dateParams = []
    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(la.created_at) BETWEEN ? AND ?'
      dateParams = [startDate, endDate]
    }

    let reportData = {}

    switch (reportType) {
      case 'overview':
        reportData = await getOverviewReport(dateFilter, dateParams)
        break
      case 'applications':
        reportData = await getApplicationsReport(dateFilter, dateParams)
        break
      case 'approvals':
        reportData = await getApprovalsReport(dateFilter, dateParams)
        break
      case 'disbursements':
        reportData = await getDisbursementsReport(dateFilter, dateParams)
        break
      case 'performance':
        reportData = await getPerformanceReport(dateFilter, dateParams)
        break
      case 'portfolio':
        reportData = await getPortfolioReport(dateFilter, dateParams)
        break
      default:
        reportData = await getOverviewReport(dateFilter, dateParams)
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })

  } catch (error) {
    console.error('Banker reports error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reports: ' + error.message },
      { status: 500 }
    )
  }
}

async function getOverviewReport(dateFilter, dateParams) {
  try {
    // Get overall statistics
    const overviewQuery = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN la.status = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN la.status = 'under_verification' THEN 1 END) as under_verification_count,
        COUNT(CASE WHEN la.status = 'verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN la.status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as disbursed_count,
        
        SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END) as total_disbursed,
        
        ROUND(
          (COUNT(CASE WHEN la.status IN ('approved', 'disbursed') THEN 1 END) * 100.0 / 
          NULLIF(COUNT(*), 0)), 2
        ) as approval_rate,
        
        AVG(
          CASE WHEN la.approved_at IS NOT NULL 
          THEN DATEDIFF(la.approved_at, la.created_at) 
          END
        ) as avg_processing_days
        
      FROM loan_applications la
      ${dateFilter}
    `

    const overviewResult = await executeQuery(overviewQuery, dateParams)
    const overview = overviewResult[0] || {}

    // Get monthly trends
    const trendsQuery = `
      SELECT 
        DATE_FORMAT(la.created_at, '%Y-%m') as month,
        COUNT(*) as total_applications,
        COUNT(CASE WHEN la.status IN ('approved', 'disbursed') THEN 1 END) as approved_applications,
        SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END) as disbursed_amount
      FROM loan_applications la
      WHERE la.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(la.created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `

    const trends = await executeQuery(trendsQuery)

    return {
      overview: {
        ...overview,
        total_disbursed: parseFloat(overview.total_disbursed || 0),
        approval_rate: parseFloat(overview.approval_rate || 0),
        avg_processing_days: Math.round(parseFloat(overview.avg_processing_days || 0))
      },
      trends: trends.map(trend => ({
        ...trend,
        disbursed_amount: parseFloat(trend.disbursed_amount || 0)
      }))
    }
  } catch (error) {
    console.error('Overview report error:', error)
    return { overview: {}, trends: [] }
  }
}

async function getApplicationsReport(dateFilter, dateParams) {
  try {
    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as new_applications,
        COUNT(CASE WHEN la.status IN ('submitted', 'under_verification') THEN 1 END) as pending_review,
        COUNT(CASE WHEN la.status = 'verified' THEN 1 END) as ready_for_decision,
        SUM(la.requested_amount) as total_value
      FROM loan_applications la
      ${dateFilter}
    `

    const summaryResult = await executeQuery(summaryQuery, dateParams)
    const summary = summaryResult[0] || {}

    // Get recent applications
    const applicationsQuery = `
      SELECT 
        la.id, la.application_number, la.requested_amount, la.status, la.created_at,
        c.first_name as customer_first_name, c.last_name as customer_last_name,
        lc.name as loan_category_name
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      ${dateFilter}
      ORDER BY la.created_at DESC
      LIMIT 20
    `

    const applications = await executeQuery(applicationsQuery, dateParams)

    return {
      summary: {
        ...summary,
        total_value: parseFloat(summary.total_value || 0)
      },
      applications
    }
  } catch (error) {
    console.error('Applications report error:', error)
    return { summary: {}, applications: [] }
  }
}

async function getApprovalsReport(dateFilter, dateParams) {
    try {
      // Get summary statistics
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_approvals,
          SUM(la.approved_amount) as total_approved_amount,
          AVG(la.approved_amount) as avg_loan_amount,
          AVG(DATEDIFF(la.approved_at, la.created_at)) as avg_decision_days
        FROM loan_applications la
        WHERE la.status IN ('approved', 'disbursed')
        ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
      `
  
      const summaryResult = await executeQuery(summaryQuery, dateParams)
      const summary = summaryResult[0] || {}
  
      // Get approvals by category performance
      const categoryQuery = `
        SELECT 
          lc.name as loan_category_name,
          COUNT(*) as total_count,
          COUNT(CASE WHEN la.status IN ('approved', 'disbursed') THEN 1 END) as approved_count,
          ROUND((COUNT(CASE WHEN la.status IN ('approved', 'disbursed') THEN 1 END) * 100.0 / COUNT(*)), 2) as approval_rate,
          SUM(CASE WHEN la.status IN ('approved', 'disbursed') THEN la.approved_amount ELSE 0 END) as total_amount
        FROM loan_applications la
        JOIN loan_categories lc ON la.loan_category_id = lc.id
        ${dateFilter ? dateFilter : ''}
        GROUP BY lc.id, lc.name
        ORDER BY approval_rate DESC
      `
  
      const categoryPerformance = await executeQuery(categoryQuery, dateParams)
  
      // Get recent approvals
      const approvalsQuery = `
        SELECT 
          la.id, la.application_number, la.approved_amount, la.approved_at,
          la.approved_interest_rate, la.approved_tenure_months,
          c.first_name as customer_first_name, c.last_name as customer_last_name,
          lc.name as loan_category_name
        FROM loan_applications la
        JOIN customers c ON la.customer_id = c.id
        JOIN loan_categories lc ON la.loan_category_id = lc.id
        WHERE la.status IN ('approved', 'disbursed')
        ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
        ORDER BY la.approved_at DESC
        LIMIT 20
      `
  
      const approvals = await executeQuery(approvalsQuery, dateParams)
  
      // Get monthly trends
      const trendsQuery = `
        SELECT 
          DATE_FORMAT(la.created_at, '%Y-%m') as month,
          COUNT(*) as total_applications,
          COUNT(CASE WHEN la.status IN ('approved', 'disbursed') THEN 1 END) as approved_count,
          ROUND((COUNT(CASE WHEN la.status IN ('approved', 'disbursed') THEN 1 END) * 100.0 / COUNT(*)), 2) as approval_rate,
          AVG(CASE WHEN la.status IN ('approved', 'disbursed') THEN la.approved_amount END) as avg_approved_amount
        FROM loan_applications la
        WHERE la.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(la.created_at, '%Y-%m')
        ORDER BY month DESC
      `
  
      const trends = await executeQuery(trendsQuery)
  
      return {
        summary: {
          ...summary,
          total_approved_amount: parseFloat(summary.total_approved_amount || 0),
          avg_loan_amount: parseFloat(summary.avg_loan_amount || 0),
          avg_decision_days: Math.round(parseFloat(summary.avg_decision_days || 0))
        },
        approvals,
        trends: trends.map(trend => ({
          ...trend,
          avg_approved_amount: parseFloat(trend.avg_approved_amount || 0)
        })),
        performance: {
          by_category: categoryPerformance.map(cat => ({
            ...cat,
            total_amount: parseFloat(cat.total_amount || 0)
          }))
        }
      }
    } catch (error) {
      console.error('Approvals report error:', error)
      return { summary: {}, approvals: [], trends: [], performance: {} }
    }
  }
  
  async function getDisbursementsReport(dateFilter, dateParams) {
    try {
      // Get summary statistics
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_count,
          SUM(la.disbursed_amount) as total_disbursed,
          AVG(la.disbursed_amount) as avg_amount,
          AVG(DATEDIFF(la.disbursed_at, la.approved_at)) as avg_days
        FROM loan_applications la
        WHERE la.status = 'disbursed'
        ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
      `
  
      const summaryResult = await executeQuery(summaryQuery, dateParams)
      const summary = summaryResult[0] || {}
  
      // Get disbursements by category
      const categoryQuery = `
        SELECT 
          lc.name as loan_category_name,
          COUNT(*) as loan_count,
          SUM(la.disbursed_amount) as total_amount,
          AVG(la.disbursed_amount) as avg_amount
        FROM loan_applications la
        JOIN loan_categories lc ON la.loan_category_id = lc.id
        WHERE la.status = 'disbursed'
        ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
        GROUP BY lc.id, lc.name
        ORDER BY total_amount DESC
      `
  
      const categoryBreakdown = await executeQuery(categoryQuery, dateParams)
  
      // Get recent disbursements
      const disbursementsQuery = `
        SELECT 
          la.id, la.application_number, la.disbursed_amount, la.disbursed_at,
          c.first_name as customer_first_name, c.last_name as customer_last_name,
          DATEDIFF(la.disbursed_at, la.approved_at) as days_to_disburse,
          CASE 
            WHEN la.disbursement_details IS NOT NULL 
            THEN JSON_UNQUOTE(JSON_EXTRACT(la.disbursement_details, '$.bank_name'))
            ELSE NULL
          END as bank_name
        FROM loan_applications la
        JOIN customers c ON la.customer_id = c.id
        WHERE la.status = 'disbursed'
        ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
        ORDER BY la.disbursed_at DESC
        LIMIT 20
      `
  
      const disbursements = await executeQuery(disbursementsQuery, dateParams)
  
      // Get monthly trends
      const trendsQuery = `
        SELECT 
          DATE_FORMAT(la.disbursed_at, '%Y-%m') as month,
          COUNT(*) as disbursement_count,
          SUM(la.disbursed_amount) as total_amount,
          AVG(la.disbursed_amount) as avg_amount,
          AVG(DATEDIFF(la.disbursed_at, la.approved_at)) as avg_days
        FROM loan_applications la
        WHERE la.status = 'disbursed' 
        AND la.disbursed_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(la.disbursed_at, '%Y-%m')
        ORDER BY month DESC
      `
  
      const trends = await executeQuery(trendsQuery)
  
      return {
        summary: {
          ...summary,
          total_disbursed: parseFloat(summary.total_disbursed || 0),
          avg_amount: parseFloat(summary.avg_amount || 0),
          avg_days: Math.round(parseFloat(summary.avg_days || 0)),
          by_category: categoryBreakdown.map(cat => ({
            ...cat,
            total_amount: parseFloat(cat.total_amount || 0),
            avg_amount: parseFloat(cat.avg_amount || 0)
          }))
        },
        disbursements,
        trends: trends.map(trend => ({
          ...trend,
          total_amount: parseFloat(trend.total_amount || 0),
          avg_amount: parseFloat(trend.avg_amount || 0),
          avg_days: Math.round(parseFloat(trend.avg_days || 0))
        }))
      }
    } catch (error) {
      console.error('Disbursements report error:', error)
      return { summary: {}, disbursements: [], trends: [] }
    }
  }
  
  async function getPerformanceReport(dateFilter, dateParams) {
    try {
      // Get overall performance metrics
      const performanceQuery = `
        SELECT 
          COUNT(*) as total_applications,
          COUNT(CASE WHEN la.status IN ('approved', 'disbursed') THEN 1 END) as approved_applications,
          ROUND((COUNT(CASE WHEN la.status IN ('approved', 'disbursed') THEN 1 END) * 100.0 / COUNT(*)), 2) as approval_rate,
          SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END) as total_portfolio,
          COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as active_loans
        FROM loan_applications la
        ${dateFilter}
      `
  
      const performanceResult = await executeQuery(performanceQuery, dateParams)
      const performance = performanceResult[0] || {}
  
      // Get efficiency metrics
      const efficiencyQuery = `
        SELECT 
          AVG(DATEDIFF(la.approved_at, la.created_at)) as avg_processing_time,
          MIN(DATEDIFF(la.approved_at, la.created_at)) as fastest_processing,
          COUNT(*) as total_processed,
          COUNT(*) / DATEDIFF(MAX(la.created_at), MIN(la.created_at)) as daily_average
        FROM loan_applications la
        WHERE la.approved_at IS NOT NULL
        ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
      `
  
      const efficiencyResult = await executeQuery(efficiencyQuery, dateParams)
      const efficiency = efficiencyResult[0] || {}
  
      // Mock quality metrics (these would come from real quality assessments)
      const quality = {
        overall_score: 85,
        documentation_score: 92,
        risk_score: 78,
        customer_satisfaction: 88,
        compliance_score: 95
      }
  
      // Get KPI trends
      const kpiQuery = `
        SELECT 
          DATE_FORMAT(la.created_at, '%Y-%m') as period,
          COUNT(*) as total_applications,
          ROUND((COUNT(CASE WHEN la.status IN ('approved', 'disbursed') THEN 1 END) * 100.0 / COUNT(*)), 2) as approval_rate,
          AVG(DATEDIFF(la.approved_at, la.created_at)) as avg_process_time,
          SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END) as portfolio_value
        FROM loan_applications la
        WHERE la.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(la.created_at, '%Y-%m')
        ORDER BY period DESC
      `
  
      const kpis = await executeQuery(kpiQuery)
  
      return {
        performance: {
          ...performance,
          total_portfolio: parseFloat(performance.total_portfolio || 0),
          approval_trend: 2.3 // This would be calculated from historical data
        },
        efficiency: {
          ...efficiency,
          avg_processing_time: Math.round(parseFloat(efficiency.avg_processing_time || 0)),
          fastest_processing: Math.round(parseFloat(efficiency.fastest_processing || 0)),
          daily_average: Math.round(parseFloat(efficiency.daily_average || 0))
        },
        quality,
        kpis: kpis.map(kpi => ({
          ...kpi,
          avg_process_time: Math.round(parseFloat(kpi.avg_process_time || 0)),
          portfolio_value: parseFloat(kpi.portfolio_value || 0)
        }))
      }
    } catch (error) {
      console.error('Performance report error:', error)
      return { performance: {}, efficiency: {}, quality: {}, kpis: [] }
    }
  }
  
  async function getPortfolioReport(dateFilter, dateParams) {
    try {
      // Get portfolio summary
      const portfolioQuery = `
        SELECT 
          COUNT(*) as active_count,
          SUM(la.disbursed_amount) as total_active,
          COUNT(CASE WHEN la.loan_status = 'Performing' OR la.loan_status IS NULL THEN 1 END) as performing_count,
          COUNT(CASE WHEN la.loan_status = 'At Risk' THEN 1 END) as at_risk_count,
          SUM(CASE WHEN la.loan_status = 'At Risk' THEN la.disbursed_amount ELSE 0 END) as at_risk_amount,
          AVG(la.approved_interest_rate) as avg_interest_rate
        FROM loan_applications la
        WHERE la.status = 'disbursed'
      `
  
      const portfolioResult = await executeQuery(portfolioQuery)
      const portfolioData = portfolioResult[0] || {}
  
      const portfolio = {
        ...portfolioData,
        total_active: parseFloat(portfolioData.total_active || 0),
        at_risk_amount: parseFloat(portfolioData.at_risk_amount || 0),
        avg_interest_rate: parseFloat(portfolioData.avg_interest_rate || 0),
        performing_percentage: portfolioData.active_count > 0 
          ? Math.round((portfolioData.performing_count / portfolioData.active_count) * 100) 
          : 0,
        at_risk_percentage: portfolioData.active_count > 0 
          ? Math.round((portfolioData.at_risk_count / portfolioData.active_count) * 100) 
          : 0
      }
  
      // Get breakdown by category
      const categoryQuery = `
        SELECT 
          lc.name as loan_category_name,
          COUNT(*) as loan_count,
          SUM(la.disbursed_amount) as total_amount,
          ROUND((SUM(la.disbursed_amount) * 100.0 / (SELECT SUM(disbursed_amount) FROM loan_applications WHERE status = 'disbursed')), 2) as percentage
        FROM loan_applications la
        JOIN loan_categories lc ON la.loan_category_id = lc.id
        WHERE la.status = 'disbursed'
        GROUP BY lc.id, lc.name
        ORDER BY total_amount DESC
      `
  
      const categoryBreakdown = await executeQuery(categoryQuery)
  
      // Mock risk breakdown (this would come from risk assessment system)
      const riskBreakdown = [
        { risk_level: 'Low', loan_count: Math.round(portfolio.active_count * 0.7), total_amount: portfolio.total_active * 0.7, percentage: 70 },
        { risk_level: 'Medium', loan_count: Math.round(portfolio.active_count * 0.2), total_amount: portfolio.total_active * 0.2, percentage: 20 },
        { risk_level: 'High', loan_count: Math.round(portfolio.active_count * 0.1), total_amount: portfolio.total_active * 0.1, percentage: 10 }
      ]
  
      // Get outstanding loans
      const outstandingQuery = `
        SELECT 
          la.id, la.application_number, la.disbursed_amount, la.disbursed_at,
          la.approved_interest_rate,
          c.first_name as customer_first_name, c.last_name as customer_last_name,
          lc.name as loan_category_name,
          la.disbursed_amount as outstanding_amount,
          COALESCE(la.loan_status, 'Performing') as loan_status
        FROM loan_applications la
        JOIN customers c ON la.customer_id = c.id
        JOIN loan_categories lc ON la.loan_category_id = lc.id
        WHERE la.status = 'disbursed'
        ORDER BY la.disbursed_amount DESC
        LIMIT 20
      `
  
      const outstanding = await executeQuery(outstandingQuery)
  
      // Mock risk analysis data
      const risk_analysis = {
        default_rate: 2.5,
        recovery_rate: 85.0,
        npl_ratio: 3.2,
        defaulted_loans: Math.round(portfolio.active_count * 0.025),
        total_loans: portfolio.active_count,
        recovered_amount: portfolio.total_active * 0.02
      }
  
      return {
        portfolio,
        breakdown: {
          by_category: categoryBreakdown.map(cat => ({
            ...cat,
            total_amount: parseFloat(cat.total_amount || 0)
          })),
          by_risk: riskBreakdown.map(risk => ({
            ...risk,
            total_amount: parseFloat(risk.total_amount || 0)
          }))
        },
        risk_analysis,
        outstanding: outstanding.map(loan => ({
          ...loan,
          disbursed_amount: parseFloat(loan.disbursed_amount || 0),
          outstanding_amount: parseFloat(loan.outstanding_amount || 0)
        }))
      }
    } catch (error) {
      console.error('Portfolio report error:', error)
      return { portfolio: {}, breakdown: {}, risk_analysis: {}, outstanding: [] }
    }
  }
  
