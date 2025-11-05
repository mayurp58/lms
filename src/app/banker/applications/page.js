'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

function ApplicationsListContent() {
  const [applications, setApplications] = useState([])
  const [bankerInfo, setBankerInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'verified',
    search: ''
  })
  const [pagination, setPagination] = useState({})
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get status from URL params
    const urlStatus = searchParams.get('status')
    if (urlStatus) {
      setFilters(prev => ({ ...prev, status: urlStatus }))
    }
  }, [searchParams])

  useEffect(() => {
    fetchApplications()
  }, [filters])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key])
      })

      const res = await fetch(`/api/banker/applications?${params}`)
      const data = await res.json()

      if (data.success) {
        setApplications(data.data.applications)
        setBankerInfo(data.data.bankerInfo)
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
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }))
  }

  const getApplicationPriority = (app) => {
    
    const daysSinceCreated = Math.floor((new Date() - new Date(app.created_at)) / (1000 * 60 * 60 * 24))
    if (daysSinceCreated > 7) return 'high'
    if (daysSinceCreated > 3) return 'medium'
    return 'low'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Applications</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review and approve loan applications within your limit of {bankerInfo && formatCurrency(bankerInfo.maxApprovalLimit)}
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'verified', label: 'Pending Review', color: 'blue' },
            { key: 'approved', label: 'Approved', color: 'green' },
            { key: 'rejected', label: 'Rejected', color: 'red' },
            { key: 'disbursed', label: 'Disbursed', color: 'purple' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange('status', tab.key)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                filters.status === tab.key
                  ? `border-${tab.color}-500 text-${tab.color}-600`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Application number or customer name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Per Page</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchApplications}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Applications ({pagination.total || 0})
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading applications...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const priority = getApplicationPriority(app)
                const isCompletelyVerified = app.verified_documents === app.required_documents && app.required_documents > 0
                
                return (
                  <div key={app.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      {/* Application Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {app.application_number}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(app.status)}`}>
                            {app.status.replace('_', ' ')}
                          </span>
                          {filters.status === 'verified' && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(priority)}`}>
                              {priority} priority
                            </span>
                          )}
                        </div>
                        
                        {/* Customer & Loan Info */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-gray-600 mb-3">
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
                            <span className="font-medium">Employment:</span> {app.employment_type?.replace('_', ' ')}
                          </div>
                          <div>
                            <span className="font-medium">Monthly Income:</span> {formatCurrency(app.monthly_income)}
                          </div>
                          <div>
                            <span className="font-medium">Existing Loans:</span> {formatCurrency(app.existing_loans_amount || 0)}
                          </div>
                        </div>

                        {/* Amount & Documents */}
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700">Requested:</span>
                            <span className="ml-2 text-lg font-bold text-blue-600">
                              {formatCurrency(app.requested_amount)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700">Documents:</span>
                            <span className={`ml-2 text-sm ${isCompletelyVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                              {app.verified_documents || 0} verified
                              {isCompletelyVerified && (
                                <svg className="inline ml-1 h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </span>
                          </div>
                          <div className="text-gray-500">
                            Applied {formatDate(app.created_at)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 ml-6">
                        <Link
                          href={`/banker/applications/${app.id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          {filters.status === 'verified' ? 'Review & Decide' : 'View Details'}
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}

              {applications.length === 0 && (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No applications with status "{filters.status}" within your approval limit.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
  )
}

export default function BankerApplicationsPage() {
  return (
    <DashboardLayout requiredRole="banker">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <ApplicationsListContent />
      </Suspense>
    </DashboardLayout>
  )
}
