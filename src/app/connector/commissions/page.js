'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'

export default function ConnectorCommissionsPage() {
  const [commissions, setCommissions] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    period: '30days',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    fetchCommissions()
  }, [filters])

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key])
      })

      const res = await fetch(`/api/connector/commissions?${params}`)
      const data = await res.json()

      if (data.success) {
        setCommissions(data.data.commissions)
        setStats(data.data.stats)
        setPagination(data.data.pagination)
      } else {
        console.error('Failed to fetch commissions:', data.message)
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
    }
    setLoading(false)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const calculateTotalEarned = () => {
    return commissions.reduce((total, commission) => {
      return total + parseFloat(commission.commission_amount || 0)
    }, 0)
  }

  const getPendingCommissions = () => {
    return commissions.filter(c => c.status === 'earned')
  }

  const getPaidCommissions = () => {
    return commissions.filter(c => c.status === 'paid')
  }

  return (
    <DashboardLayout requiredRole="connector">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Commissions</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track your commission earnings and payment history
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchCommissions}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Applications</p>
                <p className="text-3xl font-bold">{stats.total_applications || 0}</p>
              </div>
              <div className="text-blue-200">📋</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Successful Disbursals</p>
                <p className="text-3xl font-bold">{stats.disbursed_count || 0}</p>
              </div>
              <div className="text-green-200">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Pending Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.pending_commission || 0)}</p>
              </div>
              <div className="text-yellow-200">⏳</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.paid_commission || 0)}</p>
              </div>
              <div className="text-purple-200">💰</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Commissions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="earned">Pending Payment</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Time Period</label>
              <select
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: 'all', period: '30days', page: 1, limit: 20 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Commission Summary */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pending Commissions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Commissions</h3>
              <p className="text-sm text-gray-600">Commissions awaiting payment</p>
            </div>
            <div className="p-6">
              {getPendingCommissions().length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-medium text-yellow-800">Total Pending</p>
                      <p className="text-sm text-yellow-600">{getPendingCommissions().length} commissions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-800">
                        {formatCurrency(getPendingCommissions().reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {getPendingCommissions().slice(0, 5).map((commission, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{commission.application_number}</p>
                          <p className="text-xs text-gray-500">{formatDate(commission.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(commission.commission_amount)}
                          </p>
                          <p className="text-xs text-gray-500">{commission.commission_percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                    ⏳
                  </div>
                  <p>No pending commissions</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
              <p className="text-sm text-gray-600">Latest commission payments received</p>
            </div>
            <div className="p-6">
              {getPaidCommissions().length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium text-green-800">Total Paid</p>
                      <p className="text-sm text-green-600">{getPaidCommissions().length} payments</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-800">
                        {formatCurrency(getPaidCommissions().reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {getPaidCommissions().slice(0, 5).map((commission, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{commission.application_number}</p>
                          <p className="text-xs text-gray-500">Paid on {formatDate(commission.paid_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(commission.commission_amount)}
                          </p>
                          <p className="text-xs text-gray-500">{commission.commission_percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                    💰
                  </div>
                  <p>No payments received yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Commission List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Commission History</h3>
            <div className="text-sm text-gray-500">
              {pagination.total || 0} total records
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading commissions...</p>
            </div>
          ) : commissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-blue-600">
                            {commission.application_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {commission.loan_category}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {commission.customer_first_name} {commission.customer_last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {commission.customer_phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(commission.disbursed_amount || commission.approved_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(commission.commission_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {commission.commission_percentage}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(commission.status)}`}>
                          {commission.status === 'earned' ? 'Pending' : 'Paid'}
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
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300 text-4xl">
                📊
              </div>
              <h3 className="text-lg font-medium text-gray-900">No commissions found</h3>
              <p className="text-gray-500">You haven't earned any commissions yet.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleFilterChange('page', Math.min(pagination.totalPages, filters.page + 1))}
                  disabled={filters.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((filters.page - 1) * filters.limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(filters.page * filters.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handleFilterChange('page', pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            filters.page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => handleFilterChange('page', Math.min(pagination.totalPages, filters.page + 1))}
                      disabled={filters.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
