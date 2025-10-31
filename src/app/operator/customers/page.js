'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function OperatorCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sort: 'created_desc',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    fetchCustomers()
  }, [filters])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key])
        }
      })
      params.append('page', filters.page.toString())
      params.append('limit', filters.limit.toString())

      const res = await fetch(`/api/operator/customers?${params}`)
      const data = await res.json()

      if (data.success) {
        setCustomers(data.data.customers)
        setStats(data.data.stats)
        setPagination(data.data.pagination)
      } else {
        console.error('Failed to fetch customers:', data.message)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
    setLoading(false)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }))
  }

  const getCustomerStatusColor = (hasActiveApplication, totalApplications) => {
    if (hasActiveApplication) return 'bg-blue-100 text-blue-800'
    if (totalApplications > 0) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getCustomerStatusLabel = (hasActiveApplication, totalApplications) => {
    if (hasActiveApplication) return 'Active Application'
    if (totalApplications > 0) return 'Previous Customer'
    return 'New Customer'
  }

  return (
    <DashboardLayout requiredRole="operator">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and manage customer information and loan history
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchCustomers}
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
                <p className="text-blue-100">Total Customers</p>
                <p className="text-3xl font-bold">{stats.total_customers || 0}</p>
              </div>
              <div className="text-blue-200">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Active Applications</p>
                <p className="text-3xl font-bold">{stats.active_applications || 0}</p>
              </div>
              <div className="text-green-200">📋</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">New This Month</p>
                <p className="text-3xl font-bold">{stats.new_this_month || 0}</p>
              </div>
              <div className="text-yellow-200">🆕</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Verified Customers</p>
                <p className="text-3xl font-bold">{stats.verified_customers || 0}</p>
              </div>
              <div className="text-purple-200">✅</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search & Filter</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Search Customers</label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name, phone, email, or application number..."
                  className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="all">All Customers</option>
                <option value="active">With Active Applications</option>
                <option value="previous">Previous Customers</option>
                <option value="new">New Customers</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="applications_desc">Most Applications</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Customers ({pagination.total || 0})
            </h3>
            <div className="text-sm text-gray-500">
              Page {pagination.page || 1} of {pagination.totalPages || 1}
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading customers...</p>
            </div>
          ) : customers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <div key={customer.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    {/* Customer Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {customer.first_name} {customer.last_name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCustomerStatusColor(customer.has_active_application, customer.total_applications)}`}>
                              {getCustomerStatusLabel(customer.has_active_application, customer.total_applications)}
                            </span>
                            {customer.is_verified && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact Details */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            <span>{customer.email}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{customer.city}, {customer.state} - {customer.pincode}</span>
                        </div>
                      </div>

                      {/* Application Summary */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 bg-gray-50 p-4 rounded-md mb-4">
                        <div className="text-center">
                          <span className="text-xs font-medium text-gray-500 uppercase block">Total Applications</span>
                          <span className="text-lg font-bold text-gray-900">{customer.total_applications || 0}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-medium text-gray-500 uppercase block">Approved</span>
                          <span className="text-lg font-bold text-green-600">{customer.approved_applications || 0}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-medium text-gray-500 uppercase block">Disbursed</span>
                          <span className="text-lg font-bold text-purple-600">{customer.disbursed_applications || 0}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-medium text-gray-500 uppercase block">Total Loan Value</span>
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(customer.total_loan_amount || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Latest Application */}
                      {customer.latest_application_number && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-sm font-medium text-blue-800">
                                Latest Application: {customer.latest_application_number}
                              </span>
                              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(customer.latest_application_status)}`}>
                                {customer.latest_application_status?.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-blue-900">
                                {formatCurrency(customer.latest_application_amount)}
                              </div>
                              <div className="text-xs text-blue-600">
                                {formatDate(customer.latest_application_date)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Customer Since */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Customer since {formatDate(customer.created_at)}</span>
                        {customer.last_login && (
                          <span>Last seen {formatDate(customer.last_login)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 ml-6">
                      <div className="flex flex-col space-y-2">
                        <Link
                          href={`/operator/customers/${customer.id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </Link>

                        {customer.has_active_application && (
                          <Link
                            href={`/operator/applications/${customer.latest_application_id}`}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Review Application
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            // Add contact customer functionality
                            window.open(`tel:${customer.phone}`, '_blank')
                          }}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Call
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300 text-4xl">
                👥
              </div>
              <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
              <p className="text-gray-500">No customers match your current search criteria.</p>
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
