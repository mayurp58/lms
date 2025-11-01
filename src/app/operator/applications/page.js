'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function OperatorApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    fetchApplications()
  }, [filters])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      // Add each parameter only once
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters.priority && filters.priority !== 'all') {
        params.append('priority', filters.priority)
      }
      params.append('page', filters.page.toString())
      params.append('limit', filters.limit.toString())
  
      //console.log('Fetching with params:', params.toString())
  
      const res = await fetch(`/api/operator/applications?${params}`)
      const data = await res.json()
  
      if (data.success) {
        setApplications(data.data.applications)
        setStats(data.data.stats)
        setPagination(data.data.pagination)
      } else {
        console.error('Failed to fetch applications:', data.message)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
    setLoading(false)
  }
  

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleStatusUpdate = async (applicationId, newStatus, remarks = '') => {
    try {
      const res = await fetch(`/api/operator/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, remarks }),
      })

      const data = await res.json()

      if (data.success) {
        // Refresh the applications list
        fetchApplications()
      } else {
        alert('Failed to update status: ' + data.message)
      }
    } catch (error) {
      alert('Error updating status: ' + error.message)
    }
  }

  const getDaysOld = (date) => {
    return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24))
  }

  const getPriorityLevel = (daysOld, status) => {
    if (status === 'submitted' && daysOld > 2) return { level: 'high', color: 'text-red-600', label: 'Urgent' }
    if (status === 'submitted' && daysOld > 1) return { level: 'medium', color: 'text-yellow-600', label: 'Medium' }
    return { level: 'normal', color: 'text-green-600', label: 'Normal' }
  }

  return (
    <DashboardLayout requiredRole="operator">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
            <p className="mt-1 text-sm text-gray-600">
              Review and verify customer documents for loan applications
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchApplications}
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
                <p className="text-blue-100">Pending Review</p>
                <p className="text-3xl font-bold">{stats.submitted || 0}</p>
              </div>
              <div className="text-blue-200">📋</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Under Review</p>
                <p className="text-3xl font-bold">{stats.under_verification || 0}</p>
              </div>
              <div className="text-yellow-200">🔍</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Verified Today</p>
                <p className="text-3xl font-bold">{stats.verified_today || 0}</p>
              </div>
              <div className="text-green-200">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Processed</p>
                <p className="text-3xl font-bold">{stats.total_processed || 0}</p>
              </div>
              <div className="text-purple-200">📊</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Applications</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="submitted">Pending Review</option>
                <option value="under_verification">Under Verification</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="disbursed">Disbursed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="all">All Priority</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="normal">Normal Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Items per page</label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: 'submitted', priority: 'all', page: 1, limit: 20 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Applications ({pagination.total || 0})
            </h3>
            <div className="text-sm text-gray-500">
              Page {pagination.page || 1} of {pagination.totalPages || 1}
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading applications...</p>
            </div>
          ) : applications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {applications.map((app) => {
                const daysOld = getDaysOld(app.created_at)
                const priority = getPriorityLevel(daysOld, app.status)
                
                return (
                  <div key={app.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      {/* Application Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {app.application_number}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(app.status)}`}>
                            {app.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`text-xs font-medium ${priority.color}`}>
                            {priority.label}
                          </span>
                          {daysOld > 0 && (
                            <span className="text-xs text-gray-500">
                              {daysOld} day{daysOld > 1 ? 's' : ''} old
                            </span>
                          )}
                        </div>

                        {/* Customer & Loan Details */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Customer:</span> {app.customer_first_name} {app.customer_last_name}
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {app.customer_phone}
                          </div>
                          <div>
                            <span className="font-medium">Loan Category:</span> {app.loan_category_name}
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span> {formatCurrency(app.requested_amount)}
                          </div>
                          <div>
                            <span className="font-medium">Connector:</span> {app.connector_first_name} {app.connector_last_name}
                          </div>
                          <div>
                            <span className="font-medium">Applied:</span> {formatDate(app.created_at)}
                          </div>
                        </div>

                        {/* Documents Status */}
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 bg-gray-50 p-4 rounded-md mb-4">
                          <div className="flex justify-between">
                            <span className="text-xs font-medium text-gray-500">Total Documents:</span>
                            <span className="text-xs font-semibold text-gray-900">{app.document_count || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs font-medium text-gray-500">Verified:</span>
                            <span className="text-xs font-semibold text-green-600">{app.verified_documents || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs font-medium text-gray-500">Pending:</span>
                            <span className="text-xs font-semibold text-yellow-600">{app.pending_documents || 0}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {app.document_count > 0 && (
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Verification Progress</span>
                              <span>{Math.round(((app.verified_documents || 0) / app.document_count) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((app.verified_documents || 0) / app.document_count) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Special Notes */}
                        {app.special_instructions && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm text-yellow-800">
                              <span className="font-medium">Special Instructions:</span> {app.special_instructions}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 ml-6">
                        <div className="flex flex-col space-y-2">
                          <Link
                            href={`/operator/applications/${app.id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Review Documents
                          </Link>

                          {app.status === 'submitted' && (
                            <button
                              onClick={() => handleStatusUpdate(app.id, 'under_verification', 'Started document review')}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Start Review
                            </button>
                          )}

                          {app.status === 'under_verification' && app.pending_documents === 0 && (
                            <button
                              onClick={() => handleStatusUpdate(app.id, 'verified', 'All documents verified')}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              Mark Verified
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300 text-4xl">
                📋
              </div>
              <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
              <p className="text-gray-500">No applications match your current filters.</p>
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
