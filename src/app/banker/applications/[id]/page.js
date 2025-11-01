'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function BankerApplicationDetailPage({ params }) {
  const renderedParams = React.use(params)
  const [applicationData, setApplicationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  
  // Offer states
  const [offerData, setOfferData] = useState({
    offered_amount: '',
    interest_rate: '',
    tenure_months: '',
    processing_fee: '0',
    terms_conditions: '',
    special_features: '',
    remarks: ''
  })
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [offerErrors, setOfferErrors] = useState({})

  useEffect(() => {
    fetchApplication()
  }, [renderedParams.id])

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/banker/applications/${renderedParams.id}`)
      const data = await res.json()

      if (data.success) {
        setApplicationData(data.data)
        
        // If banker already has an offer, populate the form
        if (data.data.my_offer) {
          const offer = data.data.my_offer
          setOfferData({
            offered_amount: offer.offered_amount.toString(),
            interest_rate: offer.interest_rate.toString(),
            tenure_months: offer.tenure_months.toString(),
            processing_fee: offer.processing_fee?.toString() || '0',
            terms_conditions: offer.terms_conditions || '',
            special_features: offer.special_features || '',
            remarks: offer.remarks || ''
          })
        } else {
          // Set default values based on application
          setOfferData(prev => ({
            ...prev,
            offered_amount: data.data.application.requested_amount.toString()
          }))
        }
      } else {
        setError(data.message)
      }
    } catch (error) {
      console.error('Error fetching application:', error)
      setError('Failed to fetch application details')
    }
    setLoading(false)
  }

  const handleOfferChange = (field, value) => {
    setOfferData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (offerErrors[field]) {
      setOfferErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateOffer = () => {
    const errors = {}

    if (!offerData.offered_amount || parseFloat(offerData.offered_amount) <= 0) {
      errors.offered_amount = 'Valid offer amount is required'
    }

    if (!offerData.interest_rate || parseFloat(offerData.interest_rate) <= 0 || parseFloat(offerData.interest_rate) > 50) {
      errors.interest_rate = 'Interest rate must be between 0.1% and 50%'
    }

    if (!offerData.tenure_months || parseInt(offerData.tenure_months) <= 0 || parseInt(offerData.tenure_months) > 360) {
      errors.tenure_months = 'Tenure must be between 1 and 360 months'
    }

    if (parseFloat(offerData.processing_fee) < 0) {
      errors.processing_fee = 'Processing fee cannot be negative'
    }

    setOfferErrors(errors)
    return Object.keys(errors).length === 0
  }

  const calculateEMI = () => {
    const amount = parseFloat(offerData.offered_amount)
    const rate = parseFloat(offerData.interest_rate)
    const tenure = parseInt(offerData.tenure_months)

    if (!amount || !rate || !tenure) return 0

    const monthlyRate = rate / (12 * 100)
    return Math.round((amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                      (Math.pow(1 + monthlyRate, tenure) - 1))
  }

  const handleSubmitOffer = async () => {
    if (!validateOffer()) {
      return
    }

    setSubmittingOffer(true)
    try {
      const endpoint = `/api/banker/applications/${renderedParams.id}/offer`
      const method = applicationData.my_offer ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offered_amount: parseFloat(offerData.offered_amount),
          interest_rate: parseFloat(offerData.interest_rate),
          tenure_months: parseInt(offerData.tenure_months),
          processing_fee: parseFloat(offerData.processing_fee),
          terms_conditions: offerData.terms_conditions,
          special_features: offerData.special_features,
          remarks: offerData.remarks
        })
      })

      const data = await res.json()

      if (data.success) {
        alert(`Loan offer ${applicationData.my_offer ? 'updated' : 'submitted'} successfully!`)
        fetchApplication() // Refresh data
      } else {
        alert('Error: ' + data.message)
      }
    } catch (error) {
      alert('Error submitting offer: ' + error.message)
    }
    setSubmittingOffer(false)
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="banker">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !applicationData) {
    return (
      <DashboardLayout requiredRole="banker">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900">Unable to load application</h3>
          <p className="text-gray-600 mt-1">{error || 'Application not found'}</p>
          <Link href="/banker/applications" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Applications
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const { application, documents = [], my_offer, competing_offers = [] } = applicationData
  const monthlyEMI = calculateEMI()
  const totalPayable = monthlyEMI * parseInt(offerData.tenure_months || 0)
  const totalInterest = totalPayable - parseFloat(offerData.offered_amount || 0)

  return (
    <DashboardLayout requiredRole="banker">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loan Application Review</h1>
            <p className="mt-1 text-sm text-gray-600">
              {application.application_number} - {application.customer_first_name} {application.customer_last_name}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/banker/applications" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              ← Back to Applications
            </Link>
          </div>
        </div>

        {/* Status Banner */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                {application.status.replace('_', ' ').toUpperCase()}
              </span>
              
              {my_offer && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  my_offer.status === 'selected' ? 'bg-green-100 text-green-800' :
                  my_offer.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {my_offer.status === 'selected' && '✅ My Offer Selected'}
                  {my_offer.status === 'active' && '💰 My Offer Submitted'}
                  {my_offer.status === 'rejected' && '❌ My Offer Rejected'}
                </span>
              )}

              <div>
                <p className="font-semibold">{formatCurrency(application.requested_amount)} requested</p>
                <p className="text-sm text-gray-600">{application.loan_category_name}</p>
              </div>
            </div>

            {competing_offers.length > 0 && (
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                {competing_offers.length + (my_offer ? 1 : 0)} Total Offers
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: '📋' },
              { key: 'documents', label: 'Documents', icon: '📄', badge: documents.length },
              { key: 'offer', label: 'My Offer', icon: '💰' },
              { key: 'competition', label: 'Competition', icon: '🏆', badge: competing_offers.length }
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
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Received Date</dt>
                    <dd className="text-sm text-gray-900">{formatDate(application.sent_at)}</dd>
                  </div>
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
                    <dd className="text-sm text-gray-900">{application.customer_phone}</dd>
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
                        {doc.file_path ? (
                          <div className="text-center">
                            <a 
                              href={doc.file_path} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                              📄 View Document
                            </a>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500">No file available</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white shadow rounded-lg">
                  <div className="w-24 h-24 mx-auto mb-4 text-gray-300 text-6xl">📄</div>
                  <h3 className="text-lg font-medium text-gray-900">No Documents</h3>
                  <p className="text-gray-500 mt-1">No documents available for this application.</p>
                </div>
              )}
            </div>
          )}

          {/* MY OFFER TAB - THE MAIN FEATURE */}
          {activeTab === 'offer' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {my_offer ? 'Update My Loan Offer' : 'Submit Loan Offer'}
                  </h3>
                  {my_offer && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      my_offer.status === 'selected' ? 'bg-green-100 text-green-800' :
                      my_offer.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {my_offer.status === 'selected' && '✅ Selected'}
                      {my_offer.status === 'active' && '💰 Active'}
                      {my_offer.status === 'rejected' && '❌ Rejected'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Offer Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Offered Amount *</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                          type="number"
                          value={offerData.offered_amount}
                          onChange={(e) => handleOfferChange('offered_amount', e.target.value)}
                          className={`block w-full pl-7 pr-12 border text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            offerErrors.offered_amount ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="0.00"
                          disabled={my_offer?.status === 'selected'}
                        />
                      </div>
                      {offerErrors.offered_amount && (
                        <p className="mt-1 text-sm text-red-600">{offerErrors.offered_amount}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interest Rate (% per annum) *</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          step="0.1"
                          value={offerData.interest_rate}
                          onChange={(e) => handleOfferChange('interest_rate', e.target.value)}
                          className={`block w-full pr-12 border text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            offerErrors.interest_rate ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="0.0"
                          disabled={my_offer?.status === 'selected'}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                      </div>
                      {offerErrors.interest_rate && (
                        <p className="mt-1 text-sm text-red-600">{offerErrors.interest_rate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tenure (months) *</label>
                      <input
                        type="number"
                        value={offerData.tenure_months}
                        onChange={(e) => handleOfferChange('tenure_months', e.target.value)}
                        className={`mt-1 block w-full text-gray-900 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          offerErrors.tenure_months ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="12"
                        disabled={my_offer?.status === 'selected'}
                      />
                      {offerErrors.tenure_months && (
                        <p className="mt-1 text-sm text-red-600">{offerErrors.tenure_months}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Processing Fee</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                          type="number"
                          value={offerData.processing_fee}
                          onChange={(e) => handleOfferChange('processing_fee', e.target.value)}
                          className={`block w-full pl-7 text-gray-900 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            offerErrors.processing_fee ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="0.00"
                          disabled={my_offer?.status === 'selected'}
                        />
                      </div>
                      {offerErrors.processing_fee && (
                        <p className="mt-1 text-sm text-red-600">{offerErrors.processing_fee}</p>
                      )}
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Loan Calculations</h4>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-700">Monthly EMI</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatCurrency(monthlyEMI)}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-700">Total Interest</div>
                      <div className="text-xl font-bold text-green-900">
                        {formatCurrency(totalInterest)}
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-purple-700">Total Payable</div>
                      <div className="text-xl font-bold text-purple-900">
                        {formatCurrency(totalPayable)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Special Features</label>
                    <textarea
                      value={offerData.special_features}
                      onChange={(e) => handleOfferChange('special_features', e.target.value)}
                      rows={2}
                      className="mt-1 block w-full text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Any special features or benefits..."
                      disabled={my_offer?.status === 'selected'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
                    <textarea
                      value={offerData.terms_conditions}
                      onChange={(e) => handleOfferChange('terms_conditions', e.target.value)}
                      rows={3}
                      className="mt-1 block w-full text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Terms and conditions for this offer..."
                      disabled={my_offer?.status === 'selected'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Remarks</label>
                    <textarea
                      value={offerData.remarks}
                      onChange={(e) => handleOfferChange('remarks', e.target.value)}
                      rows={2}
                      className="mt-1 block w-full text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional remarks or notes..."
                      disabled={my_offer?.status === 'selected'}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                {my_offer?.status !== 'selected' && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleSubmitOffer}
                      disabled={submittingOffer}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submittingOffer ? 'Submitting...' : my_offer ? 'Update Offer' : 'Submit Offer'}
                    </button>
                  </div>
                )}

                {my_offer?.status === 'selected' && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">🎉 Offer Selected!</h3>
                        <p className="mt-1 text-sm text-green-700">
                          Congratulations! Your offer has been selected by the operator. The loan is now approved with your terms.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Competition Tab */}
          {activeTab === 'competition' && (
            <div className="space-y-6">
              {competing_offers.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Competing Offers ({competing_offers.length})</h2>
                  
                  {competing_offers.map(offer => (
                    <div key={offer.id} className={`bg-white shadow rounded-lg border-2 ${
                      offer.status === 'selected' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}>
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <span className="text-orange-600 font-bold">🏦</span>
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold">{offer.bank_name}</h3>
                                <p className="text-sm text-gray-600">Competitor Bank</p>
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
                                  {formatCurrency(offer.monthly_emi)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="ml-6">
                            {offer.status === 'selected' ? (
                              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-md font-medium">
                                ✅ Selected
                              </span>
                            ) : (
                              <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-md font-medium">
                                🏆 Competing
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white shadow rounded-lg">
                  <div className="w-24 h-24 mx-auto mb-4 text-gray-300 text-6xl">🏆</div>
                  <h3 className="text-lg font-medium text-gray-900">No Competition</h3>
                  <p className="text-gray-500 mt-1">
                    You're the only bank that has been assigned this application so far.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
