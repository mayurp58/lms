'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function OperatorCustomerDetailPage({ params }) {
  const renderedParams = React.use(params)
  const [customer, setCustomer] = useState(null)
  const [applications, setApplications] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    fetchCustomerDetails(renderedParams.id)
  }, [renderedParams.id])

  const fetchCustomerDetails = async (customerId) => {
    try {
      const res = await fetch(`/api/operator/customers/${customerId}`)
      const data = await res.json()

      if (data.success) {
        setCustomer(data.data.customer)
        setApplications(data.data.applications)
        setDocuments(data.data.documents)
      } else {
        setError(data.message)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Failed to fetch customer details')
    }
    setLoading(false)
  }

  const handleContactCustomer = (type, value) => {
    switch (type) {
      case 'phone':
        window.open(`tel:${value}`, '_blank')
        break
      case 'email':
        window.open(`mailto:${value}`, '_blank')
        break
      case 'sms':
        window.open(`sms:${value}`, '_blank')
        break
    }
  }

  const getApplicationStatusCount = (status) => {
    return applications.filter(app => app.status === status).length
  }

  const getTotalLoanAmount = () => {
    return applications.reduce((total, app) => {
      return total + (parseFloat(app.disbursed_amount) || parseFloat(app.approved_amount) || 0)
    }, 0)
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="operator">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !customer) {
    return (
      <DashboardLayout requiredRole="operator">
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-red-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Unable to load customer</h3>
          <p className="text-gray-600 mt-1">{error || 'Customer not found'}</p>
          <Link href="/operator/customers" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Customers
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="operator">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Customer since {formatDate(customer.created_at)}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/operator/customers"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Customers
            </Link>
            <button
              onClick={() => handleContactCustomer('phone', customer.phone)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              📞 Call Customer
            </button>
          </div>
        </div>

        {/* Customer Profile Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
                </span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {customer.first_name} {customer.last_name}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    <button
                      onClick={() => handleContactCustomer('phone', customer.phone)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {customer.phone}
                    </button>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {customer.email ? (
                      <button
                        onClick={() => handleContactCustomer('email', customer.email)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {customer.email}
                      </button>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {customer.address}, {customer.city}, {customer.state} - {customer.pincode}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer ID</h3>
                  <p className="text-lg font-mono text-gray-900">#{customer.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handleContactCustomer('phone', customer.phone)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              📞 Call
            </button>
            <button
              onClick={() => handleContactCustomer('sms', customer.phone)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              💬 SMS
            </button>
            {customer.email && (
              <button
                onClick={() => handleContactCustomer('email', customer.email)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                ✉️ Email
              </button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600">📋</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                  <dd className="text-lg font-medium text-gray-900">{applications.length}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {getApplicationStatusCount('approved') + getApplicationStatusCount('disbursed')}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Loan Value</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(getTotalLoanAmount())}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border-l-4 border-yellow-500 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600">📄</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Documents</dt>
                  <dd className="text-lg font-medium text-gray-900">{documents.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Identity Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Identity Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Aadhar Number</h4>
                <p className="text-lg font-mono text-gray-900">
                  {customer.aadhar_number ? (
                    `${customer.aadhar_number.slice(0, 4)} ${customer.aadhar_number.slice(4, 8)} ${customer.aadhar_number.slice(8)}`
                  ) : (
                    <span className="text-gray-400">Not provided</span>
                  )}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">PAN Number</h4>
                <p className="text-lg font-mono text-gray-900">
                  {customer.pan_number || <span className="text-gray-400">Not provided</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'applications', 'documents', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'applications' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Loan Applications</h3>
            </div>
            <div className="p-6">
              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-blue-600">
                              {app.application_number}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(app.status)}`}>
                              {app.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Category:</span> {app.loan_category_name}
                            </div>
                            <div>
                              <span className="font-medium">Requested:</span> {formatCurrency(app.requested_amount)}
                            </div>
                            <div>
                              <span className="font-medium">Applied:</span> {formatDate(app.created_at)}
                            </div>
                          </div>

                          {app.approved_amount && (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm text-gray-600 mb-3">
                              <div>
                                <span className="font-medium">Approved:</span> 
                                <span className="text-green-600 font-semibold"> {formatCurrency(app.approved_amount)}</span>
                              </div>
                              <div>
                                <span className="font-medium">Interest:</span> {app.approved_interest_rate}%
                              </div>
                              <div>
                                <span className="font-medium">Tenure:</span> {app.approved_tenure_months} months
                              </div>
                            </div>
                          )}

                          {app.disbursed_amount && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded">
                              <span className="text-sm font-medium text-green-800">
                                Disbursed: {formatCurrency(app.disbursed_amount)} on {formatDate(app.disbursed_at)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0 ml-4">
                          <Link
                            href={`/operator/applications/${app.id}`}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No loan applications found for this customer
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Customer Documents</h3>
            </div>
            <div className="p-6">
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {documents.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {doc.document_name || `Document ${index + 1}`}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(doc.verification_status || 'pending')}`}>
                          {doc.verification_status || 'Pending'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Application: {doc.application_number}
                      </p>
                      
                      {doc.file_path && (
                        <a 
                          href={doc.file_path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          📄 View Document
                        </a>
                      )}
                      
                      {doc.verified_by_name && (
                        <p className="text-xs text-gray-500 mt-2">
                          Verified by: {doc.verified_by_name} {doc.verified_by_last_name}
                        </p>
                      )}
                      
                      {doc.rejection_reason && (
                        <p className="text-xs text-red-600 mt-2">
                          Reason: {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No documents uploaded by this customer
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {applications.slice(0, 5).map((app, index) => (
                      <li key={app.id}>
                        <div className="relative pb-8">
                          {index !== applications.slice(0, 5).length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                <span className="text-white text-xs">📋</span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  Applied for <span className="font-medium text-gray-900">{app.loan_category_name}</span>
                                </p>
                                <p className="text-xs text-gray-400">
                                  Application: {app.application_number}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDate(app.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Customer Summary */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Customer Summary</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Application Status Breakdown</h4>
                    <div className="space-y-2">
                      {['submitted', 'under_verification', 'verified', 'approved', 'rejected', 'disbursed'].map(status => {
                        const count = getApplicationStatusCount(status)
                        return count > 0 && (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                            <span className="text-sm font-medium text-gray-900">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Account Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Customer Since</span>
                        <span className="text-sm font-medium text-gray-900">{formatDate(customer.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Updated</span>
                        <span className="text-sm font-medium text-gray-900">{formatDate(customer.updated_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Applications</span>
                        <span className="text-sm font-medium text-gray-900">{applications.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="text-sm font-medium text-gray-900">
                          {applications.length > 0 
                            ? Math.round(((getApplicationStatusCount('approved') + getApplicationStatusCount('disbursed')) / applications.length) * 100)
                            : 0
                          }%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Activity Log</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                Activity log feature coming soon
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
