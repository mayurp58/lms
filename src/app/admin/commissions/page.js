'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function AdminCommissionsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [overviewData, setOverviewData] = useState(null)
  const [connectorsData, setConnectorsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    connector_id: '',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData()
    } else if (activeTab === 'connectors') {
      fetchConnectorsData()
    }
  }, [activeTab, filters])

  const fetchOverviewData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/commissions')
      const data = await res.json()
      if (data.success) {
        setOverviewData(data.data)
      }
    } catch (error) {
      console.error('Error fetching overview:', error)
    }
    setLoading(false)
  }

  const fetchConnectorsData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key])
      })

      const res = await fetch(`/api/admin/commissions/connectors?${params}`)
      const data = await res.json()
      if (data.success) {
        setConnectorsData(data.data)
      } else {
        console.error('Failed to fetch connectors data:', data.message)
      }
    } catch (error) {
      console.error('Error fetching connectors:', error)
    }
    setLoading(false)
  }

  const handlePayCommissions = async (commissionIds) => {
    if (!commissionIds || commissionIds.length === 0) {
      alert('Please select commissions to pay')
      return
    }

    const paymentReference = prompt('Enter payment reference:')
    if (!paymentReference) return

    try {
      const res = await fetch('/api/admin/commissions/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commission_ids: commissionIds,
          payment_method: 'Bank Transfer',
          payment_reference: paymentReference,
          remarks: 'Batch payment processed'
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert('Commissions paid successfully!')
        fetchConnectorsData() // Refresh data
      } else {
        alert('Failed to pay commissions: ' + data.message)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commission Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Monitor and manage connector commissions and payments
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => fetchConnectorsData()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview & Trends
            </button>
            <button
              onClick={() => setActiveTab('connectors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'connectors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Connector Commissions
            </button>
          </nav>
        </div>

        {/* Content */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading commission data...</p>
          </div>
        )}

        {activeTab === 'overview' && overviewData && !loading && (
          <CommissionsOverview data={overviewData} />
        )}

        {activeTab === 'connectors' && !loading && (
          <CommissionsListContent 
            data={connectorsData} 
            filters={filters}
            setFilters={setFilters}
            onPayCommissions={handlePayCommissions}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// Overview Component
function CommissionsOverview({ data }) {
  const { summary = {}, recent = [], trends = [] } = data || {}

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Pending Commissions</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.pending_amount || 0)}</p>
              <p className="text-yellow-200 text-sm">{summary.pending_count || 0} payments</p>
            </div>
            <div className="text-yellow-200">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Paid Commissions</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.paid_amount || 0)}</p>
              <p className="text-green-200 text-sm">{summary.paid_count || 0} payments</p>
            </div>
            <div className="text-green-200">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Commissions</p>
              <p className="text-2xl font-bold">{summary.total_commissions || 0}</p>
              <p className="text-blue-200 text-sm">All time</p>
            </div>
            <div className="text-blue-200">📊</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Avg Commission Rate</p>
              <p className="text-2xl font-bold">{parseFloat(summary.avg_commission_rate || 0).toFixed(1)}%</p>
              <p className="text-purple-200 text-sm">System average</p>
            </div>
            <div className="text-purple-200">📈</div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Commission Activities</h3>
        </div>
        <div className="p-6">
          {recent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Connector</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recent.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {item.application_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.connector_first_name} {item.connector_last_name}
                          </div>
                          <div className="text-sm text-gray-500">{item.agent_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(item.commission_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent commission activities found
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Monthly Commission Trends</h3>
        </div>
        <div className="p-6">
          {trends.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Commissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trends.map((trend, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trend.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trend.commission_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        {formatCurrency(trend.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(trend.paid_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-yellow-600">
                        {formatCurrency(trend.pending_amount)}
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

// Connectors Commission Component - FIXED with proper null checks
function CommissionsListContent({ data, filters, setFilters, onPayCommissions }) {
  const [selectedCommissions, setSelectedCommissions] = useState([])

  // FIXED: Add null checks and default values
  const { commissions = [], summary = [], totals = {} } = data || {}

  const handleSelectAll = () => {
    const earnedCommissions = commissions.filter(c => c.status === 'earned')
    if (selectedCommissions.length === earnedCommissions.length) {
      setSelectedCommissions([])
    } else {
      setSelectedCommissions(earnedCommissions.map(c => c.id))
    }
  }

  const handleSelectCommission = (commissionId) => {
    if (selectedCommissions.includes(commissionId)) {
      setSelectedCommissions(selectedCommissions.filter(id => id !== commissionId))
    } else {
      setSelectedCommissions([...selectedCommissions, commissionId])
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="earned">Pending Payment</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: 'all', connector_id: '', start_date: '', end_date: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">📊</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Records</dt>
                <dd className="text-lg font-medium text-gray-900">{totals.total_records || 0}</dd>
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
                <dt className="text-sm font-medium text-gray-500 truncate">Pending Amount</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(totals.total_pending_amount || 0)}
                </dd>
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
                <dt className="text-sm font-medium text-gray-500 truncate">Paid Amount</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(totals.total_paid_amount || 0)}
                </dd>
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
                <dt className="text-sm font-medium text-gray-500 truncate">Grand Total</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(totals.grand_total || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Connector Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Connector Commission Summary</h3>
        </div>
        <div className="p-6">
          {summary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Connector</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Commissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.map((connector, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {connector.first_name} {connector.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{connector.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                        {connector.agent_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {connector.total_commissions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-yellow-600">
                        {formatCurrency(connector.total_pending || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(connector.total_paid || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(connector.total_commission_amount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No connector commission data available
            </div>
          )}
        </div>
      </div>

      {/* Detailed Commission Records */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Commission Records</h3>
          {selectedCommissions.length > 0 && (
            <button
              onClick={() => onPayCommissions(selectedCommissions)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Pay Selected ({selectedCommissions.length})
            </button>
          )}
        </div>
        <div className="p-6">
          {commissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCommissions.length > 0 && selectedCommissions.length === commissions.filter(c => c.status === 'earned').length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Connector</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {commission.status === 'earned' && (
                          <input
                            type="checkbox"
                            checked={selectedCommissions.includes(commission.id)}
                            onChange={() => handleSelectCommission(commission.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {commission.application_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {commission.connector_first_name} {commission.connector_last_name}
                          </div>
                          <div className="text-sm text-gray-500">{commission.agent_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {commission.customer_first_name} {commission.customer_last_name}
                          </div>
                          <div className="text-sm text-gray-500">{commission.customer_phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(commission.commission_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commission.commission_percentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(commission.status)}`}>
                          {commission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(commission.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {commission.paid_at ? formatDate(commission.paid_at) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No commission records found for the selected criteria
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
