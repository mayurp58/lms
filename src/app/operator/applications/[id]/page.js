'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function OperatorApplicationPage({ params }) {
  const renderedParams = React.use(params)
  const [applicationData, setApplicationData] = useState(null)
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  
  // Document verification states
  const [updating, setUpdating] = useState(false)
  const [verificationNotes, setVerificationNotes] = useState('')
  const [documentRemarks, setDocumentRemarks] = useState('')
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)
  
  // Bank marketplace states
  const [showBankModal, setShowBankModal] = useState(false)
  const [selectedBanks, setSelectedBanks] = useState([])
  const [distributing, setDistributing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [renderedParams.id])

  const fetchData = async () => {
    try {
      // Fetch application details
      const appRes = await fetch(`/api/operator/applications/${renderedParams.id}`)
      const appData = await appRes.json()
      
      if (appData.success) {
        setApplicationData(appData.data)
      } else {
        setError(appData.message)
      }

      // Fetch available banks
      const banksRes = await fetch('/api/operator/banks')
      const banksData = await banksRes.json()
      
      if (banksData.success) {
        setBanks(banksData.data)
      } else {
        console.error('Banks API error:', banksData.message)
        // Add some test banks if API fails
        setBanks([
          { id: 1, name: 'State Bank of India', code: 'SBI' },
          { id: 2, name: 'HDFC Bank', code: 'HDFC' },
          { id: 3, name: 'ICICI Bank', code: 'ICICI' },
          { id: 4, name: 'Axis Bank', code: 'AXIS' },
          { id: 5, name: 'Kotak Mahindra Bank', code: 'KOTAK' }
        ])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch application details')
    }
    setLoading(false)
  }

  const handleStatusUpdate = async (newStatus, remarks = '') => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/operator/applications/${renderedParams.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus, 
          remarks: remarks || verificationNotes 
        }),
      })

      const data = await res.json()
      if (data.success) {
        fetchData()
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          verification_status: status,
          rejection_reason: reason
        }),
      })

      const data = await res.json()
      if (data.success) {
        fetchData()
        setDocumentRemarks('')
        setSelectedDocumentId(null)
      } else {
        alert('Failed to update document: ' + data.message)
      }
    } catch (error) {
      alert('Error updating document: ' + error.message)
    }
  }

  const handleSendToBanks = async () => {
    if (selectedBanks.length === 0) {
      alert('Please select at least one bank')
      return
    }

    setDistributing(true)
    try {
      const res = await fetch(`/api/operator/applications/${renderedParams.id}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_ids: selectedBanks,
          response_due_hours: 48
        })
      })

      const data = await res.json()
      
      if (data.success) {
        alert(`Application sent to ${selectedBanks.length} banks successfully!`)
        setShowBankModal(false)
        setSelectedBanks([])
        fetchData()
      } else {
        alert('Error: ' + data.message)
      }
    } catch (error) {
      alert('Error sending to banks: ' + error.message)
    }
    setDistributing(false)
  }

  const handleSelectOffer = async (offerId) => {
    if (!confirm('Are you sure you want to select this offer? This will approve the loan.')) {
      return
    }

    try {
      const res = await fetch(`/api/operator/applications/${renderedParams.id}/select-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId })
      })

      const data = await res.json()
      
      if (data.success) {
        alert('Offer selected and loan approved!')
        fetchData()
      } else {
        alert('Error: ' + data.message)
      }
    } catch (error) {
      alert('Error selecting offer')
    }
  }

  const calculateEMI = (amount, rate, tenure) => {
    const monthlyRate = rate / (12 * 100)
    return Math.round((amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                      (Math.pow(1 + monthlyRate, tenure) - 1))
  }

  const getDocumentVerificationStatus = () => {
    if (!applicationData?.documents) return { verified: 0, pending: 0, rejected: 0, total: 0 }
    
    const verified = applicationData.documents.filter(doc => doc.verification_status === 'verified').length
    const pending = applicationData.documents.filter(doc => !doc.verification_status || doc.verification_status === 'pending').length
    const rejected = applicationData.documents.filter(doc => doc.verification_status === 'rejected').length
    const total = applicationData.documents.length
    
    return { verified, pending, rejected, total }
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
          <h3 className="text-lg font-medium text-gray-900">Unable to load application</h3>
          <p className="text-gray-600 mt-1">{error || 'Application not found'}</p>
          <Link href="/operator/applications" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Applications
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const { application, documents = [], offers = [] } = applicationData
  const docStatus = getDocumentVerificationStatus()

  return (
    <DashboardLayout requiredRole="operator">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              {application.application_number} - {application.customer_first_name} {application.customer_last_name}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/operator/applications" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              ← Back
            </Link>
            <Link href={`/operator/customers/${application.customer_id}`} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              👤 View Customer
            </Link>
          </div>
        </div>

        {/* Status Banner */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex justify-between items-center space-x-4">
              <div>
                <p className="font-semibold text-black">{formatCurrency(application.requested_amount)} requested</p>
                <p className="text-sm text-gray-600">{application.loan_category_name}</p>
              </div>
              <div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                {application.status.replace('_', ' ').toUpperCase()}
              </span>
              
              {/* Marketplace Status */}
              {application.marketplace_status && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  application.marketplace_status === 'not_distributed' ? 'bg-gray-100 text-gray-800' :
                  application.marketplace_status === 'distributed' ? 'bg-blue-100 text-blue-800' :
                  application.marketplace_status === 'offers_received' ? 'bg-yellow-100 text-yellow-800' :
                  application.marketplace_status === 'offer_selected' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {application.marketplace_status === 'not_distributed' && '📋 Ready for Banks'}
                  {application.marketplace_status === 'distributed' && '🏦 Sent to Banks'}
                  {application.marketplace_status === 'offers_received' && '💰 Offers Available'}
                  {application.marketplace_status === 'offer_selected' && '✅ Offer Selected'}
                </span>
              )}
              </div>
              
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2">
              {application.status === 'submitted' && (
                <button
                  onClick={() => handleStatusUpdate('under_verification')}
                  disabled={updating}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Start Review'}
                </button>
              )}
              
              {application.status === 'under_verification' && canMarkAsVerified() && (
                <button
                  onClick={() => handleStatusUpdate('verified')}
                  disabled={updating}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : '✅ Mark Verified'}
                </button>
              )}

              {offers.length > 0 && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {offers.length} Offers
                </span>
              )}
            </div>
          </div>

          {/* Document Progress */}
          {documents.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Document Progress</span>
                <span className="text-sm text-gray-600">{docStatus.verified}/{docStatus.total} verified</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${docStatus.total > 0 ? (docStatus.verified / docStatus.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs - ADDED BANKS TAB */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: '📋' },
              { key: 'documents', label: 'Documents', icon: '📄', badge: documents.length },
              { key: 'banks', label: 'Banks', icon: '🏦', badge: banks.length },
              { key: 'offers', label: 'Bank Offers', icon: '💰', badge: offers.length },
              { key: 'history', label: 'History', icon: '🕐' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="capitalize">{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Application Details */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Application Details</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Application Number</dt>
                    <dd className="text-sm text-gray-900 font-mono">{application.application_number}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Loan Category</dt>
                    <dd className="text-sm text-gray-900">{application.loan_category_name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Requested Amount</dt>
                    <dd className="text-sm font-semibold text-blue-600">{formatCurrency(application.requested_amount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Applied Date</dt>
                    <dd className="text-sm text-gray-900">{formatDate(application.created_at)}</dd>
                  </div>
                  {application.approved_amount && (
                    <div className="flex justify-between border-t pt-2">
                      <dt className="text-sm font-medium text-gray-500">Approved Amount</dt>
                      <dd className="text-sm font-semibold text-green-600">{formatCurrency(application.approved_amount)}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Customer Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{application.customer_first_name} {application.customer_last_name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">
                      <a href={`tel:${application.customer_phone}`} className="text-blue-600 hover:text-blue-800">
                        {application.customer_phone}
                      </a>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{application.customer_email || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Address</dt>
                    <dd className="text-sm text-gray-900">
                      {application.customer_address}, {application.customer_city}, {application.customer_state} - {application.customer_pincode}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {documents.length > 0 ? (
                <div className="grid gap-6">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-white shadow rounded-lg border border-gray-200">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 text-lg">📄</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">
                                {doc.document_name || `Document ${doc.id}`}
                              </h4>
                              <p className="text-sm text-gray-500">Uploaded {formatDate(doc.created_at)}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(doc.verification_status || 'pending')}`}>
                            {doc.verification_status === 'verified' ? '✅ Verified' : 
                             doc.verification_status === 'rejected' ? '❌ Rejected' : 
                             '⏳ Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          {/* Document Preview */}
                          <div>
                            {doc.file_path ? (
                              <div className="text-center">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                  <div className="h-12 w-12 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                                    <span className="text-gray-600 text-xl">📄</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">Document File</p>
                                  <a 
                                    href={doc.file_path} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                                  >
                                    📄 View Document
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <p className="text-sm text-gray-500">No file uploaded</p>
                              </div>
                            )}
                          </div>

                          {/* Verification Actions */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Verification</h5>
                            
                            {doc.verification_status !== 'verified' && doc.verification_status !== 'rejected' ? (
                              <div className="space-y-4">
                                <textarea
                                  value={selectedDocumentId === doc.id ? documentRemarks : ''}
                                  onChange={(e) => {
                                    setSelectedDocumentId(doc.id)
                                    setDocumentRemarks(e.target.value)
                                  }}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="Add remarks (required for rejection)..."
                                />
                                
                                <div className="flex space-x-3">
                                  <button
                                    onClick={() => handleDocumentVerification(doc.id, 'verified', documentRemarks)}
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                                  >
                                    ✅ Verify
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (!documentRemarks.trim()) {
                                        alert('Please provide a reason for rejection')
                                        return
                                      }
                                      handleDocumentVerification(doc.id, 'rejected', documentRemarks)
                                    }}
                                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                                  >
                                    ❌ Reject
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={`p-4 rounded-md ${
                                doc.verification_status === 'verified' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                              }`}>
                                <p className={`text-sm font-medium ${
                                  doc.verification_status === 'verified' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  Document {doc.verification_status}
                                </p>
                                {doc.verified_by_name && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    By: {doc.verified_by_name} {doc.verified_by_last_name}
                                  </p>
                                )}
                                {doc.rejection_reason && (
                                  <p className="text-sm text-red-700 mt-1">
                                    <span className="font-medium">Reason:</span> {doc.rejection_reason}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white shadow rounded-lg">
                  <div className="w-24 h-24 mx-auto mb-4 text-gray-300 text-6xl">📄</div>
                  <h3 className="text-lg font-medium text-gray-900">No Documents</h3>
                  <p className="text-gray-500 mt-1">No documents uploaded for this application yet.</p>
                </div>
              )}
            </div>
          )}

          {/* BANKS TAB - NEW */}
          {/* ENHANCED BANKS TAB - Shows Assigned Banks */}
{activeTab === 'banks' && (
  <div className="space-y-6">
    {/* Assigned Banks Section */}
    {applicationData.distributions && applicationData.distributions.length > 0 && (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Banks Assigned to This Application</h3>
            <span className="text-sm text-gray-600">
              {applicationData.distributions.length} bank(s) assigned
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {applicationData.distributions.map((distribution) => (
              <div 
                key={distribution.id} 
                className="border-2 rounded-lg p-4 hover:shadow-md transition-shadow bg-blue-50 border-blue-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">🏦</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {distribution.bank_name}
                      </h4>
                      <p className="text-sm text-gray-600">Code: {distribution.bank_code}</p>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    distribution.status === 'offer_received' ? 'bg-green-100 text-green-800' :
                    distribution.status === 'viewed' ? 'bg-yellow-100 text-yellow-800' :
                    distribution.status === 'declined' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {distribution.status === 'sent' && '📤 Sent'}
                    {distribution.status === 'viewed' && '👀 Viewed'}
                    {distribution.status === 'offer_received' && '💰 Offer Received'}
                    {distribution.status === 'declined' && '❌ Declined'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sent:</span>
                    <span className="text-gray-900">{formatDate(distribution.sent_at)}</span>
                  </div>
                  
                  {distribution.viewed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Viewed:</span>
                      <span className="text-gray-900">{formatDate(distribution.viewed_at)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Due:</span>
                    <span className={`font-medium ${
                      new Date(distribution.response_due_date) < new Date() 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                    }`}>
                      {formatDate(distribution.response_due_date)}
                    </span>
                  </div>

                  {distribution.banker_name && (
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-gray-600">Banker:</span>
                      <span className="text-gray-900">{distribution.banker_name}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons for each bank */}
                <div className="mt-4 pt-3 border-t">
                  <div className="flex space-x-2">
                    {distribution.status === 'offer_received' && (
                      <button
                        onClick={() => setActiveTab('offers')}
                        className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        View Offer
                      </button>
                    )}
                    
                    {distribution.status === 'sent' && (
                      <span className="flex-1 bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm text-center">
                        Awaiting Response
                      </span>
                    )}

                    {new Date(distribution.response_due_date) < new Date() && distribution.status === 'sent' && (
                      <span className="flex-1 bg-red-100 text-red-600 px-3 py-1 rounded text-sm text-center">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-sm text-blue-700">Total Sent</div>
              <div className="text-xl font-bold text-blue-900">
                {applicationData.distributions.length}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-sm text-yellow-700">Viewed</div>
              <div className="text-xl font-bold text-yellow-900">
                {applicationData.distributions.filter(d => d.status === 'viewed').length}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-sm text-green-700">Offers Received</div>
              <div className="text-xl font-bold text-green-900">
                {applicationData.distributions.filter(d => d.status === 'offer_received').length}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-sm text-red-700">Overdue</div>
              <div className="text-xl font-bold text-red-900">
                {applicationData.distributions.filter(d => 
                  new Date(d.response_due_date) < new Date() && d.status === 'sent'
                ).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Available Banks Section */}
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {applicationData.distributions && applicationData.distributions.length > 0 
              ? 'Send to Additional Banks' 
              : 'Assign Application to Banks'
            }
          </h3>
          <div className="flex space-x-3">
            {/* <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              application.marketplace_status === 'distributed' ? 'bg-blue-100 text-blue-800' :
              application.marketplace_status === 'offers_received' ? 'bg-yellow-100 text-yellow-800' :
              application.marketplace_status === 'offer_selected' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {application.marketplace_status === 'distributed' && '🏦 Distributed'}
              {application.marketplace_status === 'offers_received' && '💰 Offers Received'}
              {application.marketplace_status === 'offer_selected' && '✅ Offer Selected'}
              {(!application.marketplace_status || application.marketplace_status === 'not_distributed') && '📋 Not Distributed'}
            </span> */}

            <button
              onClick={() => setShowBankModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              🏦 Send to Banks
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banks.filter(bank => 
            !applicationData.distributions || 
            !applicationData.distributions.find(d => d.bank_id === bank.id)
          ).map((bank) => (
            <div key={bank.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{bank.name}</h4>
                  <p className="text-sm text-gray-600">Code: {bank.code}</p>
                  {bank.contact_email && (
                    <p className="text-xs text-gray-500">{bank.contact_email}</p>
                  )}
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">🏦</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm text-gray-600">
                  Status: <span className="font-medium text-green-600">Available</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show message if all banks are already assigned */}
        {banks.length > 0 && applicationData.distributions && 
         banks.every(bank => applicationData.distributions.find(d => d.bank_id === bank.id)) && (
          <div className="text-center py-8">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300 text-6xl">✅</div>
            <h3 className="text-lg font-medium text-gray-900">All Banks Assigned</h3>
            <p className="text-gray-500 mt-1">
              This application has been sent to all available banks.
            </p>
          </div>
        )}

        {banks.length === 0 && (
          <div className="text-center py-8">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300 text-6xl">🏦</div>
            <h3 className="text-lg font-medium text-gray-900">No Banks Available</h3>
            <p className="text-gray-500 mt-1">No banks configured in the system.</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}


          {/* Bank Selection Modal - MOVED OUTSIDE TAB CONTENT */}
          {/* Enhanced Bank Selection Modal */}
{showBankModal && (
  <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 text-black">Select Banks to Send Application</h3>
      
      {/* Show already assigned banks */}
      {applicationData.distributions && applicationData.distributions.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Already Assigned:</h4>
          <div className="text-sm text-blue-700">
            {applicationData.distributions.map(d => d.bank_name).join(', ')}
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {banks.filter(bank => 
          !applicationData.distributions || 
          !applicationData.distributions.find(d => d.bank_id === bank.id)
        ).map(bank => (
          <label key={bank.id} className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedBanks.includes(bank.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedBanks([...selectedBanks, bank.id])
                } else {
                  setSelectedBanks(selectedBanks.filter(id => id !== bank.id))
                }
              }}
              className="rounded"
            />
            <span className="text-sm text-black">{bank.name}</span>
          </label>
        ))}
      </div>

      {banks.filter(bank => 
        !applicationData.distributions || 
        !applicationData.distributions.find(d => d.bank_id === bank.id)
      ).length === 0 && (
        <div className="text-center py-4 text-gray-500">
          All available banks have already been assigned to this application.
        </div>
      )}

      <div className="flex space-x-3 mt-6">
        <button
          onClick={handleSendToBanks}
          disabled={distributing || selectedBanks.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {distributing ? 'Sending...' : `Send to ${selectedBanks.length} Banks`}
        </button>
        <button
          onClick={() => {
            setShowBankModal(false)
            setSelectedBanks([])
          }}
          className="border border-gray-300 px-4 py-2 text-black rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}


          {/* Bank Offers Tab */}
          {activeTab === 'offers' && (
            <div className="space-y-6">
              {offers.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Bank Offers ({offers.length})</h2>
                  
                  {offers.map(offer => (
                    <div key={offer.id} className={`bg-white shadow rounded-lg border-2 ${
                      offer.id === application.selected_offer_id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}>
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-bold">🏦</span>
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold">{offer.bank_name}</h3>
                                <p className="text-sm text-gray-600">
                                  By {offer.banker_first_name} {offer.banker_last_name}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                              <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <div className="text-sm text-blue-700">Amount</div>
                                <div className="text-xl font-bold text-blue-900">
                                  {formatCurrency(offer.offered_amount)}
                                </div>
                              </div>
                              <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-sm text-green-700">Interest</div>
                                <div className="text-xl font-bold text-green-900">
                                  {offer.interest_rate}%
                                </div>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <div className="text-sm text-purple-700">Tenure</div>
                                <div className="text-xl font-bold text-purple-900">
                                  {offer.tenure_months}m
                                </div>
                              </div>
                              <div className="bg-orange-50 rounded-lg p-4 text-center">
                                <div className="text-sm text-orange-700">EMI</div>
                                <div className="text-xl font-bold text-orange-900">
                                  {formatCurrency(calculateEMI(offer.offered_amount, offer.interest_rate, offer.tenure_months))}
                                </div>
                              </div>
                            </div>

                            {offer.remarks && (
                              <div className="mt-4 p-3 bg-gray-50 rounded">
                                <p className="text-sm"><strong>Remarks:</strong> {offer.remarks}</p>
                              </div>
                            )}
                          </div>

                          <div className="ml-6">
                            {offer.id === application.selected_offer_id ? (
                              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-md font-medium">
                                ✅ Selected
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectOffer(offer.id)}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                              >
                                Select Offer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white shadow rounded-lg">
                  <div className="w-24 h-24 mx-auto mb-4 text-gray-300 text-6xl">💰</div>
                  <h3 className="text-lg font-medium text-gray-900">No Offers Yet</h3>
                  <p className="text-gray-500 mt-1">
                    {application.marketplace_status === 'not_distributed' 
                      ? 'Send this application to banks to receive offers.'
                      : application.marketplace_status === 'distributed'
                      ? 'Waiting for banks to submit their offers.'
                      : 'No offers received yet.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('banks')}
                    className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    Go to Banks Tab
                  </button>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Application History</h3>
              <div className="text-center py-8 text-gray-500">
                History tracking coming soon...
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
