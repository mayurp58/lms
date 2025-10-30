'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

function DisbursementsListContent() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'disbursed'
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

      const res = await fetch(`/api/admin/disbursements?${params}`)
      const data = await res.json()

      if (data.success) {
        setApplications(data.data.applications)
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

  // FIXED: Safe calculation functions
  const calculateCommission = (amount, percentage) => {
    const safeAmount = parseFloat(amount) || 0
    const safePercentage = parseFloat(percentage) || 0
    return (safeAmount * safePercentage) / 100
  }

  const getDisplayAmount = (app, status) => {
    if (status === 'approved') {
      return parseFloat(app.approved_amount) || 0
    } else {
      return parseFloat(app.disbursed_amount) || parseFloat(app.approved_amount) || 0
    }
  }

  const getDaysSinceApproval = (approvedAt) => {
    if (!approvedAt) return 0
    return Math.floor((new Date() - new Date(approvedAt)) / (1000 * 60 * 60 * 24))
  }

  const getPriorityLevel = (daysWaiting) => {
    if (daysWaiting > 7) return { level: 'high', color: 'bg-red-100 text-red-800', label: 'Urgent' }
    if (daysWaiting > 3) return { level: 'medium', color: 'bg-yellow-100 text-yellow-800', label: 'Medium' }
    return { level: 'low', color: 'bg-green-100 text-green-800', label: 'Normal' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Disbursements</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage approved loan disbursements and fund transfers
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'approved', label: 'Ready for Disbursement', color: 'blue' },
            { key: 'disbursed', label: 'Disbursed', color: 'green' }
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

      {/* Statistics Cards - FIXED calculations */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-blue-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {filters.status === 'approved' ? 'Ready to Disburse' : 'Total Disbursed'}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {applications.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-green-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(applications.reduce((sum, app) => {
                      const amount = getDisplayAmount(app, filters.status)
                      return sum + amount
                    }, 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-purple-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Commission Payout</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(applications.reduce((sum, app) => {
                      const amount = getDisplayAmount(app, filters.status)
                      return sum + calculateCommission(amount, app.commission_percentage)
                    }, 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-yellow-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Wait Time</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {applications.length > 0 && filters.status === 'approved' ? 
                      Math.round(applications.reduce((sum, app) => 
                        sum + getDaysSinceApproval(app.approved_at), 0
                      ) / applications.length) : 0
                    } days
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            {filters.status === 'approved' ? 'Applications Ready for Disbursement' : 'Disbursed Loans'} ({pagination.total || 0})
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading applications...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const daysWaiting = getDaysSinceApproval(app.approved_at)
                const priority = getPriorityLevel(daysWaiting)
                const displayAmount = getDisplayAmount(app, filters.status)
                const commissionAmount = calculateCommission(displayAmount, app.commission_percentage)
                
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
                          {filters.status === 'approved' && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priority.color}`}>
                              {priority.label}
                            </span>
                          )}
                        </div>
                        
                        {/* Customer & Loan Details */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Customer:</span> {app.first_name} {app.last_name}
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {app.phone}
                          </div>
                          <div>
                            <span className="font-medium">Category:</span> {app.loan_category_name}
                          </div>
                          <div>
                            <span className="font-medium">Approved By:</span> {app.banker_first_name} {app.banker_last_name}
                          </div>
                          <div>
                            <span className="font-medium">Connector:</span> {app.connector_first_name} {app.connector_last_name} ({app.agent_code})
                          </div>
                          <div>
                            <span className="font-medium">Commission Rate:</span> {app.commission_percentage || 0}%
                          </div>
                        </div>

                        {/* Financial Details - FIXED */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 bg-gray-50 p-4 rounded-md">
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              {filters.status === 'approved' ? 'Approved Amount' : 'Disbursed Amount'}
                            </span>
                            <p className="text-lg font-bold text-blue-600">
                              {formatCurrency(displayAmount)}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Interest Rate</span>
                            <p className="text-lg font-semibold text-gray-900">{app.approved_interest_rate || 0}%</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Tenure</span>
                            <p className="text-lg font-semibold text-gray-900">{app.approved_tenure_months || 0} months</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Commission</span>
                            <p className="text-lg font-bold text-purple-600">
                              {formatCurrency(commissionAmount)}
                            </p>
                          </div>
                        </div>

                        {/* Additional Info - FIXED */}
                        <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                          {filters.status === 'approved' ? (
                            <>
                              <span>🕐 Approved {daysWaiting} days ago</span>
                              <span>📅 {app.approved_at ? formatDate(app.approved_at) : 'N/A'}</span>
                            </>
                          ) : (
                            <>
                              <span>💰 Disbursed on {app.disbursed_at ? formatDate(app.disbursed_at) : 'N/A'}</span>
                              {app.disbursement_details && (
                                <span>🏦 {(() => {
                                  try {
                                    return JSON.parse(app.disbursement_details).bank_name
                                  } catch {
                                    return 'N/A'
                                  }
                                })()}</span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Special Conditions */}
                        {app.special_conditions && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm text-yellow-800">
                              <span className="font-medium">Special Conditions:</span> {app.special_conditions}
                            </p>
                          </div>
                        )}

                        {/* Banker Remarks */}
                        {app.banker_remarks && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Banker Notes:</span> {app.banker_remarks}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 ml-6">
                        {filters.status === 'approved' ? (
                          <div className="flex flex-col space-y-2">
                            <Link
                              href={`/admin/disbursements/${app.id}`}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              Disburse Loan
                            </Link>
                            <Link
                              href={`/admin/applications/${app.id}`}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              View Details
                            </Link>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-2">
                            <div className="text-right">
                              <span className="text-xs text-gray-500">Disbursed Amount</span>
                              <p className="text-lg font-bold text-green-600">
                                {formatCurrency(displayAmount)}
                              </p>
                            </div>
                            <Link
                              href={`/admin/disbursements/${app.id}`}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              View Details
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {applications.length === 0 && (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filters.status === 'approved' 
                      ? 'No applications ready for disbursement at the moment.'
                      : 'No disbursed loans to display.'
                    }
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

export default function DisbursementsListPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <DisbursementsListContent />
      </Suspense>
    </DashboardLayout>
  )
}
