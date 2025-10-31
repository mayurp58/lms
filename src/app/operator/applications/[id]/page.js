'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function OperatorApplicationDetailPage({ params }) {
  const renderedParams = React.use(params)
  const [applicationData, setApplicationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('details')
  const [updating, setUpdating] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [verificationNotes, setVerificationNotes] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchApplication(renderedParams.id)
  }, [renderedParams.id])

  const fetchApplication = async (id) => {
    try {
      const res = await fetch(`/api/operator/applications/${id}`)
      const data = await res.json()

      if (data.success) {
        setApplicationData(data.data)
      } else {
        setError(data.message)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Failed to fetch application details')
    }
    setLoading(false)
  }

  const handleStatusUpdate = async (newStatus, remarks = '') => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/operator/applications/${renderedParams.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus, 
          remarks: remarks || verificationNotes 
        }),
      })

      const data = await res.json()

      if (data.success) {
        // Refresh the application data
        fetchApplication(renderedParams.id)
        setVerificationNotes('')
        alert('Application status updated successfully!')
      } else {
        alert('Failed to update status: ' + data.message)
      }
    } catch (error) {
      alert('Error updating status: ' + error.message)
    }
    setUpdating(false)
  }

  const handleDocumentVerification = async (documentId, status, reason = '') => {
    try {
      const res = await fetch(`/api/operator/documents/${documentId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          verification_status: status,
          rejection_reason: reason
        }),
      })

      const data = await res.json()

      if (data.success) {
        // Refresh the application data to show updated document status
        fetchApplication(renderedParams.id)
        alert(`Document ${status} successfully!`)
      } else {
        alert('Failed to update document: ' + data.message)
      }
    } catch (error) {
      alert('Error updating document: ' + error.message)
    }
  }

  const calculateEMI = (amount, rate, tenure) => {
    if (!amount || !rate || !tenure) return 0
    const monthlyRate = rate / (12 * 100)
    const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1)
    return Math.round(emi)
  }

  const getDocumentVerificationStatus = () => {
    if (!applicationData?.documents) return { verified: 0, pending: 0, rejected: 0 }
    
    const verified = applicationData.documents.filter(doc => doc.verification_status === 'verified').length
    const pending = applicationData.documents.filter(doc => !doc.verification_status || doc.verification_status === 'pending').length
    const rejected = applicationData.documents.filter(doc => doc.verification_status === 'rejected').length
    
    return { verified, pending, rejected }
  }

  const canMarkAsVerified = () => {
    const docStatus = getDocumentVerificationStatus()
    return docStatus.pending === 0 && docStatus.verified > 0
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

  if (error || !applicationData) {
    return (
      <DashboardLayout requiredRole="operator">
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-red-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Unable to load application</h3>
          <p className="text-gray-600 mt-1">{error || 'Application not found'}</p>
          <Link href="/operator/applications" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Applications
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const { application, documents = [], logs = [] } = applicationData
  const docStatus = getDocumentVerificationStatus()
  const monthlyEMI = application.approved_amount && application.approved_interest_rate && application.approved_tenure_months
    ? calculateEMI(application.approved_amount, application.approved_interest_rate, application.approved_tenure_months)
    : 0

  return (
    <DashboardLayout requiredRole="operator">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Review</h1>
            <p className="mt-1 text-sm text-gray-600">
              {application.application_number} - {application.customer_first_name} {application.customer_last_name}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/operator/applications"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Applications
            </Link>
            <Link
              href={`/operator/customers/${application.customer_id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              👤 View Customer
            </Link>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-md p-4 ${
          application.status === 'verified' ? 'bg-green-50 border border-green-200' :
          application.status === 'under_verification' ? 'bg-blue-50 border border-blue-200' :
          application.status === 'rejected' ? 'bg-red-50 border border-red-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                {application.status.replace('_', ' ').toUpperCase()}
              </span>
              <div className="ml-4">
                <p className="text-sm text-gray-700">
                  Applied on {formatDate(application.created_at)}
                </p>
                {application.updated_at && application.updated_at !== application.created_at && (
                  <p className="text-sm text-gray-700">
                    Last updated on {formatDate(application.updated_at)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex space-x-2">
              {application.status === 'submitted' && (
                <button
                  onClick={() => handleStatusUpdate('under_verification', 'Started document verification process')}
                  disabled={updating}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Start Review'}
                </button>
              )}
              
              {application.status === 'under_verification' && canMarkAsVerified() && (
                <button
                  onClick={() => handleStatusUpdate('verified', 'All documents verified and approved')}
                  disabled={updating}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Mark as Verified'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Document Verification Progress */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Document Verification Progress</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{docStatus.verified}</div>
              <div className="text-sm text-green-700">Verified</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{docStatus.pending}</div>
              <div className="text-sm text-yellow-700">Pending Review</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{docStatus.rejected}</div>
              <div className="text-sm text-red-700">Rejected</div>
            </div>
          </div>
          
          {documents.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Overall Progress</span>
                <span>{Math.round((docStatus.verified / documents.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(docStatus.verified / documents.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['details', 'documents', 'history'].map((tab) => (
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
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Application Overview */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Loan Details */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Details</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                      <span className="text-sm font-medium text-blue-700">Requested Amount</span>
                      <span className="text-xl font-bold text-blue-900">
                        {formatCurrency(application.requested_amount)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Loan Category:</span>
                        <span className="text-gray-900">{application.loan_category_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Application Number:</span>
                        <span className="text-gray-900 font-mono">{application.application_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Applied Date:</span>
                        <span className="text-gray-900">{formatDate(application.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name</span>
                      <p className="text-sm text-gray-900">{application.customer_first_name} {application.customer_last_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Phone</span>
                      <p className="text-sm text-gray-900">
                        <a href={`tel:${application.customer_phone}`} className="text-blue-600 hover:text-blue-800">
                          {application.customer_phone}
                        </a>
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Email</span>
                      <p className="text-sm text-gray-900">{application.customer_email || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Address</span>
                      <p className="text-sm text-gray-900">
                        {application.customer_address}, {application.customer_city}, {application.customer_state} - {application.customer_pincode}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Aadhar</span>
                        <p className="text-sm text-gray-900">{application.customer_aadhar_number || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">PAN</span>
                        <p className="text-sm text-gray-900">{application.customer_pan_number || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector Details */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Connector Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Connector</span>
                      <p className="text-sm text-gray-900">
                        {application.connector_first_name} {application.connector_last_name}
                      </p>
                      <p className="text-xs text-gray-500">Agent Code: {application.agent_code}</p>
                    </div>
                    
                    {application.commission_percentage && (
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-md">
                        <div>
                          <span className="text-sm font-medium text-purple-700">Commission Rate</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-purple-900">
                            {application.commission_percentage}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Notes Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Notes</h3>
                <div className="space-y-4">
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                    placeholder="Add your verification notes here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                      {application.status === 'under_verification' && (
                        <>
                          <button
                            onClick={() => {
                              if (!verificationNotes.trim()) {
                                alert('Please add verification notes before approving')
                                return
                              }
                              if (canMarkAsVerified()) {
                                handleStatusUpdate('verified', verificationNotes)
                              } else {
                                alert('Please verify all documents before marking as verified')
                              }
                            }}
                            disabled={updating}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            ✅ Approve Verification
                          </button>
                          
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide rejection reason:')
                              if (reason) {
                                handleStatusUpdate('rejected', `${verificationNotes}\n\nRejection Reason: ${reason}`)
                              }
                            }}
                            disabled={updating}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            ❌ Reject Application
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {doc.document_name || `Document ${doc.id}`}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(doc.verification_status || 'pending')}`}>
                          {doc.verification_status || 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="px-6 py-4">
                      {doc.file_path ? (
                        <div className="mb-4">
                          <a 
                            href={doc.file_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            📄 View Document
                          </a>
                        </div>
                      ) : (
                        <div className="mb-4 text-sm text-gray-500">
                          No file uploaded
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mb-4">
                        <p>Uploaded: {formatDate(doc.created_at)}</p>
                        {doc.verified_by_name && (
                          <p>Verified by: {doc.verified_by_name} {doc.verified_by_last_name}</p>
                        )}
                      </div>

                      {doc.verification_status !== 'verified' && doc.verification_status !== 'rejected' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDocumentVerification(doc.id, 'verified')}
                            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                          >
                            ✅ Verify
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason:')
                              if (reason) {
                                handleDocumentVerification(doc.id, 'rejected', reason)
                              }
                            }}
                            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}

                      {doc.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs text-red-800">
                            <span className="font-medium">Rejection reason:</span> {doc.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-300 text-4xl">
                  📄
                </div>
                <h3 className="text-lg font-medium text-gray-900">No Documents</h3>
                <p className="text-gray-500">No documents have been uploaded for this application yet.</p>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Application History</h3>
            </div>
            <div className="p-6">
              {logs.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {logs.map((log, logIdx) => (
                      <li key={logIdx}>
                        <div className="relative pb-8">
                          {logIdx !== logs.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                <span className="text-white text-xs">📝</span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  {log.action.replace('_', ' ').toLowerCase()} {log.first_name ? `by ${log.first_name} ${log.last_name}` : ''}
                                </p>
                                {log.new_values && (
                                  <div className="mt-1 text-xs text-gray-400">
                                    {(() => {
                                      try {
                                        const values = JSON.parse(log.new_values)
                                        return Object.keys(values).slice(0, 3).join(', ')
                                      } catch {
                                        return ''
                                      }
                                    })()}
                                  </div>
                                )}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDate(log.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No history records available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
