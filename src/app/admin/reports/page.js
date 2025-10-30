'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils'

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    type: 'overview',
    period: '30days',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchReports()
  }, [filters])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key])
      })

      const res = await fetch(`/api/reports/admin?${params}`)
      const data = await res.json()

      if (data.success) {
        setReportData(data.data)
      } else {
        console.error('Failed to fetch reports:', data.message)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
    setLoading(false)
  }

  const exportReport = async (format = 'csv') => {
    try {
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key])
      })
      params.append('export', format)

      const res = await fetch(`/api/reports/admin/export?${params}`)
      const blob = await res.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `admin-report-${filters.type}-${new Date().toISOString().split('T')[0]}.${format}`
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
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive system performance and business analytics
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => exportReport('csv')}
              disabled={!reportData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => exportReport('pdf')}
              disabled={!reportData}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              📋 Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Report Configuration</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Report Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="overview">Overview</option>
                <option value="financial">Financial</option>
                <option value="performance">Performance</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Time Period</label>
              <select
                value={filters.period}
                onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value, startDate: '', endDate: '' }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {filters.period === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Generating report...</p>
          </div>
        )}

        {/* Report Content */}
        {reportData && !loading && (
          <div className="space-y-6">
            {filters.type === 'overview' && <OverviewReport data={reportData} />}
            {filters.type === 'financial' && <FinancialReport data={reportData} />}
            {filters.type === 'performance' && <PerformanceReport data={reportData} />}
            {filters.type === 'detailed' && <DetailedReport data={reportData} />}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// Overview Report Component
function OverviewReport({ data }) {
  const { applicationStats = {}, dailyTrend = [], categoryPerformance = [], topConnectors = [] } = data || {}

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Applications</p>
              <p className="text-3xl font-bold">{applicationStats.total_applications || 0}</p>
            </div>
            <div className="text-blue-200">📋</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Approved</p>
              <p className="text-3xl font-bold">{applicationStats.approved || 0}</p>
            </div>
            <div className="text-green-200">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Disbursed</p>
              <p className="text-3xl font-bold">{applicationStats.disbursed || 0}</p>
            </div>
            <div className="text-purple-200">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100">Avg Approval</p>
              <p className="text-2xl font-bold">{formatCurrency(applicationStats.avg_approval_amount || 0)}</p>
            </div>
            <div className="text-indigo-200">📊</div>
          </div>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Daily Application Trend</h3>
        </div>
        <div className="p-6">
          {dailyTrend.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approvals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disbursals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disbursed Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyTrend.slice(0, 10).map((day, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(day.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.applications || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{day.approvals || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">{day.disbursals || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(day.approved_amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(day.disbursed_amount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No trend data available for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Category Performance and Top Connectors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Loan Category Performance</h3>
          </div>
          <div className="p-6">
            {categoryPerformance.length > 0 ? (
              <div className="space-y-4">
                {categoryPerformance.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{category.category}</p>
                      <p className="text-sm text-gray-500">
                        {category.applications || 0} applications • {formatPercentage(category.approval_rate || 0)} approval
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(category.total_disbursed || 0)}
                      </p>
                      <p className="text-xs text-gray-500">{category.disbursals || 0} disbursed</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* Top Connectors */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Performing Connectors</h3>
          </div>
          <div className="p-6">
            {topConnectors.length > 0 ? (
              <div className="space-y-4">
                {topConnectors.slice(0, 5).map((connector, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {connector.first_name} {connector.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{connector.agent_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(connector.total_business || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {connector.disbursals || 0} disbursed • {connector.applications || 0} total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No connector data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Financial Report Component - FIXED with null checks
function FinancialReport({ data }) {
  const { 
    financialSummary = {}, 
    monthlyBreakdown = [], 
    commissionAnalysis = {}, 
    amountDistribution = [] 
  } = data || {}

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">💰</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Approved</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(financialSummary.total_approved || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border-l-4 border-green-500 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">💸</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Disbursed</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(financialSummary.total_disbursed || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border-l-4 border-purple-500 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600">💳</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pending Commission</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(commissionAnalysis.pending_commission || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border-l-4 border-indigo-500 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-indigo-600">✅</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Paid Commission</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(commissionAnalysis.paid_commission || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Monthly Financial Breakdown</h3>
        </div>
        <div className="p-6">
          {monthlyBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disbursed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Interest</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyBreakdown.map((month, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {month.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{month.applications || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {formatCurrency(month.requested_amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(month.approved_amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                        {formatCurrency(month.disbursed_amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {month.avg_interest_rate ? `${month.avg_interest_rate}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No monthly data available for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Loan Amount Distribution */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Loan Amount Distribution</h3>
        </div>
        <div className="p-6">
          {amountDistribution.length > 0 ? (
            <div className="space-y-4">
              {amountDistribution.map((range, index) => {
                const total = amountDistribution.reduce((sum, item) => sum + parseInt(item.count || 0), 0)
                const percentage = total > 0 ? (((range.count || 0) / total) * 100).toFixed(1) : 0
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <span className="text-sm font-medium text-gray-700 w-16">{range.amount_range}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-900">{range.count || 0} loans</p>
                      <p className="text-xs text-gray-500">{formatCurrency(range.total_amount || 0)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No amount distribution data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Performance Report Component - FIXED with null checks
function PerformanceReport({ data }) {
  const { 
    bankerPerformance = [], 
    operatorPerformance = [], 
    connectorPerformance = [], 
    processingTimeAnalysis = {} 
  } = data || {}

  return (
    <div className="space-y-6">
      {/* Processing Time Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="text-center">
            <p className="text-blue-100">Avg Approval Time</p>
            <p className="text-3xl font-bold">
              {processingTimeAnalysis.avg_approval_days ? `${Math.round(processingTimeAnalysis.avg_approval_days)} days` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="text-center">
            <p className="text-green-100">Avg Disbursement Time</p>
            <p className="text-3xl font-bold">
              {processingTimeAnalysis.avg_disbursement_days ? `${Math.round(processingTimeAnalysis.avg_disbursement_days)} days` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <div className="text-center">
            <p className="text-purple-100">Total Cycle Time</p>
            <p className="text-3xl font-bold">
              {processingTimeAnalysis.avg_total_days ? `${Math.round(processingTimeAnalysis.avg_total_days)} days` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Banker Performance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Banker Performance</h3>
        </div>
        <div className="p-6">
          {bankerPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Banker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approvals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Approved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bankerPerformance.map((banker, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {banker.first_name} {banker.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{banker.designation}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{banker.employee_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{banker.reviews || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{banker.approvals || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          (banker.approval_rate || 0) >= 70 ? 'bg-green-100 text-green-800' :
                          (banker.approval_rate || 0) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {banker.approval_rate ? `${banker.approval_rate}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(banker.total_approved || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(banker.avg_approval_amount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No banker performance data available
            </div>
          )}
        </div>
      </div>

      {/* Connector Performance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Connector Performance</h3>
        </div>
        <div className="p-6">
          {connectorPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Connector</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Business</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission Earned</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {connectorPerformance.slice(0, 10).map((connector, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {connector.first_name} {connector.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{connector.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                        {connector.agent_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{connector.applications || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          (connector.success_rate || 0) >= 70 ? 'bg-green-100 text-green-800' :
                          (connector.success_rate || 0) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {connector.success_rate ? `${connector.success_rate}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                        {formatCurrency(connector.total_business || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                        {formatCurrency(connector.total_commission_earned || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No connector performance data available
            </div>
          )}
        </div>
      </div>

      {/* Operator Performance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Operator Performance</h3>
        </div>
        <div className="p-6">
          {operatorPerformance.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {operatorPerformance.map((operator, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      {operator.first_name} {operator.last_name}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      (operator.verification_rate || 0) >= 90 ? 'bg-green-100 text-green-800' :
                      (operator.verification_rate || 0) >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {operator.verification_rate ? `${operator.verification_rate}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Documents Processed:</span>
                      <span className="font-medium">{operator.documents_processed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified:</span>
                      <span className="font-medium text-green-600">{operator.verified || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rejected:</span>
                      <span className="font-medium text-red-600">{operator.rejected || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No operator performance data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Detailed Report Component - FIXED with null checks
function DetailedReport({ data }) {
  const { detailedApplications = [] } = data || {}

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Detailed Application Report</h3>
        <p className="text-sm text-gray-500">Complete list of applications with all details</p>
      </div>
      <div className="p-6">
        {detailedApplications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Connector</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Banker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detailedApplications.map((app, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-blue-600">{app.application_number}</div>
                        <div className="text-sm text-gray-500">{app.customer_phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.customer_first_name} {app.customer_last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.loan_category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(app.requested_amount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {app.approved_amount ? formatCurrency(app.approved_amount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        app.status === 'disbursed' ? 'bg-purple-100 text-purple-800' :
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        app.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(app.status || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{app.connector_first_name} {app.connector_last_name}</div>
                        <div className="text-sm text-gray-500 font-mono">{app.agent_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.banker_first_name ? `${app.banker_first_name} ${app.banker_last_name}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(app.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No applications found for the selected criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
