'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'

export default function BankerReportsPage() {
  const [reports, setReports] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeReport, setActiveReport] = useState('overview')
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0] // today
  })

  useEffect(() => {
    fetchReports()
  }, [activeReport, dateRange])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        report_type: activeReport,
        ...dateRange
      })

      const res = await fetch(`/api/banker/reports?${params}`)
      const data = await res.json()

      if (data.success) {
        setReports(data.data)
      } else {
        console.error('Failed to fetch reports:', data.message)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
    setLoading(false)
  }

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
  }

  const exportReport = async (format = 'csv') => {
    try {
      const params = new URLSearchParams({
        report_type: activeReport,
        format,
        ...dateRange
      })

      const res = await fetch(`/api/banker/reports/export?${params}`)
      const blob = await res.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `banker-report-${activeReport}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export report')
    }
  }

  return (
    <DashboardLayout requiredRole="banker">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive insights into loan portfolio and performance metrics
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => exportReport('csv')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              📊 Export CSV
            </button>
            <button
              onClick={fetchReports}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Date Range Filter</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div className="flex items-end">
              <div className="flex space-x-2 w-full">
                <button
                  onClick={() => setDateRange({
                    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end_date: new Date().toISOString().split('T')[0]
                  })}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setDateRange({
                    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end_date: new Date().toISOString().split('T')[0]
                  })}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Last 30 Days
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'applications', label: 'Applications', icon: '📋' },
              { key: 'approvals', label: 'Approvals', icon: '✅' },
              { key: 'disbursements', label: 'Disbursements', icon: '💰' },
              { key: 'performance', label: 'Performance', icon: '📈' },
              { key: 'portfolio', label: 'Portfolio', icon: '💼' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveReport(tab.key)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeReport === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading report data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Report */}
            {activeReport === 'overview' && (
              <OverviewReport data={reports} />
            )}

            {/* Applications Report */}
            {activeReport === 'applications' && (
              <ApplicationsReport data={reports} />
            )}

            {/* Approvals Report */}
            {activeReport === 'approvals' && (
              <ApprovalsReport data={reports} />
            )}

            {/* Disbursements Report */}
            {activeReport === 'disbursements' && (
              <DisbursementsReport data={reports} />
            )}

            {/* Performance Report */}
            {activeReport === 'performance' && (
              <PerformanceReport data={reports} />
            )}

            {/* Portfolio Report */}
            {activeReport === 'portfolio' && (
              <PortfolioReport data={reports} />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// Overview Report Component
function OverviewReport({ data }) {
  const { overview = {}, trends = [] } = data

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Applications</p>
              <p className="text-3xl font-bold">{overview.total_applications || 0}</p>
              <p className="text-blue-200 text-sm">
                {overview.applications_change > 0 ? '+' : ''}{overview.applications_change || 0}% vs previous period
              </p>
            </div>
            <div className="text-blue-200">📋</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Approval Rate</p>
              <p className="text-3xl font-bold">{overview.approval_rate || 0}%</p>
              <p className="text-green-200 text-sm">
                {overview.approved_applications || 0} approved
              </p>
            </div>
            <div className="text-green-200">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Disbursed</p>
              <p className="text-2xl font-bold">{formatCurrency(overview.total_disbursed || 0)}</p>
              <p className="text-purple-200 text-sm">
                {overview.disbursed_count || 0} loans
              </p>
            </div>
            <div className="text-purple-200">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Avg Processing Time</p>
              <p className="text-3xl font-bold">{overview.avg_processing_days || 0}</p>
              <p className="text-yellow-200 text-sm">days</p>
            </div>
            <div className="text-yellow-200">⏱️</div>
          </div>
        </div>
      </div>

      {/* Application Status Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Application Status Breakdown</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { status: 'submitted', label: 'Submitted', count: overview.submitted_count || 0 },
              { status: 'under_verification', label: 'Under Review', count: overview.under_verification_count || 0 },
              { status: 'verified', label: 'Verified', count: overview.verified_count || 0 },
              { status: 'approved', label: 'Approved', count: overview.approved_count || 0 },
              { status: 'rejected', label: 'Rejected', count: overview.rejected_count || 0 },
              { status: 'disbursed', label: 'Disbursed', count: overview.disbursed_count || 0 }
            ].map((item) => (
              <div key={item.status} className="text-center p-4 border rounded-lg">
                <div className={`text-2xl font-bold ${
                  item.status === 'approved' || item.status === 'disbursed' ? 'text-green-600' :
                  item.status === 'rejected' ? 'text-red-600' :
                  item.status === 'verified' ? 'text-blue-600' :
                  'text-yellow-600'
                }`}>
                  {item.count}
                </div>
                <div className="text-sm text-gray-600">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Monthly Trends</h3>
        </div>
        <div className="p-6">
          {trends.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Disbursed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trends.map((trend, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trend.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trend.total_applications || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        {trend.approved_applications || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trend.total_applications > 0 
                          ? Math.round(((trend.approved_applications || 0) / trend.total_applications) * 100)
                          : 0}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        {formatCurrency(trend.disbursed_amount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No trend data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Applications Report Component
function ApplicationsReport({ data }) {
  const { applications = [], summary = {} } = data

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">📋</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">New Applications</dt>
                <dd className="text-lg font-medium text-gray-900">{summary.new_applications || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border-l-4 border-yellow-500 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600">⏳</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                <dd className="text-lg font-medium text-gray-900">{summary.pending_review || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border-l-4 border-green-500 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">✅</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Ready for Decision</dt>
                <dd className="text-lg font-medium text-gray-900">{summary.ready_for_decision || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border-l-4 border-purple-500 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600">💰</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.total_value || 0)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.slice(0, 10).map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {app.application_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {app.customer_first_name} {app.customer_last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(app.requested_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.loan_category_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(app.status)}`}>
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(app.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Approvals Report Component - DETAILED IMPLEMENTATION
function ApprovalsReport({ data }) {
    const { approvals = [], summary = {}, trends = [], performance = {} } = data
  
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white p-6 rounded-lg border-l-4 border-green-500 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Approvals</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.total_approvals || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
  
          <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.total_approved_amount || 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
  
          <div className="bg-white p-6 rounded-lg border-l-4 border-yellow-500 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Loan Size</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.avg_loan_amount || 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
  
          <div className="bg-white p-6 rounded-lg border-l-4 border-purple-500 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600">⏱️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Decision Time</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.avg_decision_days || 0} days</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
  
        {/* Approval Trends by Category */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Approvals by Loan Category</h3>
          </div>
          <div className="p-6">
            {performance.by_category && performance.by_category.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {performance.by_category.map((category, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{category.loan_category_name}</h4>
                      <span className="text-sm font-semibold text-green-600">{category.approval_rate}%</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {category.approved_count} of {category.total_count} applications
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${category.approval_rate}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm font-medium text-gray-900">
                      {formatCurrency(category.total_amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No category data available</div>
            )}
          </div>
        </div>
  
        {/* Recent Approvals */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Approvals</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvals.slice(0, 10).map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {approval.application_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.customer_first_name} {approval.customer_last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {approval.loan_category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatCurrency(approval.approved_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.approved_interest_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.approved_tenure_months} months
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(approval.approved_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
  
        {/* Approval Trends Chart Data */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Monthly Approval Trends</h3>
          </div>
          <div className="p-6">
            {trends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approvals</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trends.map((trend, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trend.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trend.total_applications}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {trend.approved_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trend.approval_rate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {formatCurrency(trend.avg_approved_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No trend data available</div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // Disbursements Report Component - DETAILED IMPLEMENTATION
  function DisbursementsReport({ data }) {
    const { disbursements = [], summary = {}, trends = [], banks = [] } = data
  
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white p-6 rounded-lg border-l-4 border-purple-500 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Disbursed</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.total_disbursed || 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
  
          <div className="bg-white p-6 rounded-lg border-l-4 border-green-500 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Loans Disbursed</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.total_count || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
  
          <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600">📈</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Disbursement</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.avg_amount || 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
  
          <div className="bg-white p-6 rounded-lg border-l-4 border-yellow-500 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600">⚡</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Time to Disburse</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.avg_days || 0} days</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
  
        {/* Disbursement by Category */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Disbursements by Category</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {summary.by_category && summary.by_category.map((category, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">{category.loan_category_name}</h4>
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {formatCurrency(category.total_amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {category.loan_count} loans • Avg: {formatCurrency(category.avg_amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
  
        {/* Recent Disbursements */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Disbursements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disbursed Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days to Disburse</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {disbursements.slice(0, 10).map((disbursement) => (
                  <tr key={disbursement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {disbursement.application_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {disbursement.customer_first_name} {disbursement.customer_last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                      {formatCurrency(disbursement.disbursed_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {disbursement.bank_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(disbursement.disbursed_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {disbursement.days_to_disburse || 0} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
  
        {/* Monthly Disbursement Trends */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Monthly Disbursement Trends</h3>
          </div>
          <div className="p-6">
            {trends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Days</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trends.map((trend, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trend.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trend.disbursement_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                          {formatCurrency(trend.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(trend.avg_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trend.avg_days} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No trend data available</div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // Performance Report Component - DETAILED IMPLEMENTATION
  function PerformanceReport({ data }) {
    const { performance = {}, kpis = [], efficiency = {}, quality = {} } = data
  
    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Approval Rate</p>
                <p className="text-3xl font-bold">{performance.approval_rate || 0}%</p>
                <p className="text-green-200 text-sm">
                  {performance.approval_trend > 0 ? '↗️' : performance.approval_trend < 0 ? '↘️' : '➡️'} 
                  {Math.abs(performance.approval_trend || 0)}% vs last period
                </p>
              </div>
              <div className="text-green-200">✅</div>
            </div>
          </div>
  
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Processing Speed</p>
                <p className="text-3xl font-bold">{efficiency.avg_processing_time || 0}</p>
                <p className="text-blue-200 text-sm">days average</p>
              </div>
              <div className="text-blue-200">⚡</div>
            </div>
          </div>
  
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Portfolio Value</p>
                <p className="text-2xl font-bold">{formatCurrency(performance.total_portfolio || 0)}</p>
                <p className="text-purple-200 text-sm">{performance.active_loans || 0} active loans</p>
              </div>
              <div className="text-purple-200">💼</div>
            </div>
          </div>
  
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Quality Score</p>
                <p className="text-3xl font-bold">{quality.overall_score || 0}</p>
                <p className="text-yellow-200 text-sm">out of 100</p>
              </div>
              <div className="text-yellow-200">⭐</div>
            </div>
          </div>
        </div>
  
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Processing Efficiency */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Processing Efficiency</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-sm font-medium text-blue-700">Average Processing Time</span>
                  <span className="text-lg font-bold text-blue-900">{efficiency.avg_processing_time || 0} days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-sm font-medium text-green-700">Fastest Processing</span>
                  <span className="text-lg font-bold text-green-900">{efficiency.fastest_processing || 0} days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <span className="text-sm font-medium text-yellow-700">Applications Processed</span>
                  <span className="text-lg font-bold text-yellow-900">{efficiency.total_processed || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="text-sm font-medium text-purple-700">Daily Average</span>
                  <span className="text-lg font-bold text-purple-900">{efficiency.daily_average || 0}</span>
                </div>
              </div>
            </div>
          </div>
  
          {/* Quality Metrics */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quality Metrics</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Documentation Accuracy</span>
                    <span className="text-gray-900">{quality.documentation_score || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${quality.documentation_score || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Risk Assessment</span>
                    <span className="text-gray-900">{quality.risk_score || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${quality.risk_score || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Customer Satisfaction</span>
                    <span className="text-gray-900">{quality.customer_satisfaction || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${quality.customer_satisfaction || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Compliance Score</span>
                    <span className="text-gray-900">{quality.compliance_score || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${quality.compliance_score || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Performance Trends */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Performance Trends</h3>
          </div>
          <div className="p-6">
            {kpis.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Process Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Portfolio Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {kpis.map((kpi, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {kpi.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {kpi.total_applications}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {kpi.approval_rate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {kpi.avg_process_time} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {formatCurrency(kpi.portfolio_value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No performance data available</div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // Portfolio Report Component - DETAILED IMPLEMENTATION
  function PortfolioReport({ data }) {
    const { portfolio = {}, breakdown = [], risk_analysis = {}, outstanding = [] } = data
  
    return (
      <div className="space-y-6">
        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100">Active Portfolio</p>
                <p className="text-2xl font-bold">{formatCurrency(portfolio.total_active || 0)}</p>
                <p className="text-indigo-200 text-sm">{portfolio.active_count || 0} active loans</p>
              </div>
              <div className="text-indigo-200">💼</div>
            </div>
          </div>
  
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Performing Loans</p>
                <p className="text-3xl font-bold">{portfolio.performing_percentage || 0}%</p>
                <p className="text-green-200 text-sm">{portfolio.performing_count || 0} loans</p>
              </div>
              <div className="text-green-200">✅</div>
            </div>
          </div>
  
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">At Risk</p>
                <p className="text-3xl font-bold">{portfolio.at_risk_percentage || 0}%</p>
                <p className="text-red-200 text-sm">{formatCurrency(portfolio.at_risk_amount || 0)}</p>
              </div>
              <div className="text-red-200">⚠️</div>
            </div>
          </div>
  
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Avg Interest Rate</p>
                <p className="text-3xl font-bold">{portfolio.avg_interest_rate || 0}%</p>
                <p className="text-blue-200 text-sm">weighted average</p>
              </div>
              <div className="text-blue-200">📊</div>
            </div>
          </div>
        </div>
  
        {/* Portfolio Breakdown by Category */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Portfolio Breakdown by Category</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">By Loan Category</h4>
                <div className="space-y-3">
                  {breakdown.by_category && breakdown.by_category.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{category.loan_category_name}</div>
                        <div className="text-xs text-gray-500">{category.loan_count} loans</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(category.total_amount)}</div>
                        <div className="text-xs text-gray-500">{category.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
  
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">By Risk Level</h4>
                <div className="space-y-3">
                  {breakdown.by_risk && breakdown.by_risk.map((risk, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className={`text-sm font-medium ${
                          risk.risk_level === 'Low' ? 'text-green-600' :
                          risk.risk_level === 'Medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {risk.risk_level} Risk
                        </div>
                        <div className="text-xs text-gray-500">{risk.loan_count} loans</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(risk.total_amount)}</div>
                        <div className="text-xs text-gray-500">{risk.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Risk Analysis */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Risk Analysis</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Default Rate</h4>
                <div className="text-2xl font-bold text-red-600">{risk_analysis.default_rate || 0}%</div>
                <div className="text-xs text-gray-500">
                  {risk_analysis.defaulted_loans || 0} of {risk_analysis.total_loans || 0} loans
                </div>
              </div>
  
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recovery Rate</h4>
                <div className="text-2xl font-bold text-green-600">{risk_analysis.recovery_rate || 0}%</div>
                <div className="text-xs text-gray-500">
                  {formatCurrency(risk_analysis.recovered_amount || 0)} recovered
                </div>
              </div>
  
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">NPL Ratio</h4>
                <div className="text-2xl font-bold text-yellow-600">{risk_analysis.npl_ratio || 0}%</div>
                <div className="text-xs text-gray-500">
                  Non-performing loans
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Outstanding Loans */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Outstanding Loans Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disbursed Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outstanding.slice(0, 10).map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {loan.customer_first_name} {loan.customer_last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loan.loan_category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(loan.disbursed_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      {formatCurrency(loan.outstanding_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {loan.approved_interest_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        loan.loan_status === 'Performing' ? 'bg-green-100 text-green-800' :
                        loan.loan_status === 'At Risk' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {loan.loan_status || 'Performing'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(loan.disbursed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
  
