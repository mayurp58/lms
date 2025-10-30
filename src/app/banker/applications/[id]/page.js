'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function ApplicationReviewPage({ params }) {
  const [applicationData, setApplicationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const [showRejectionForm, setShowRejectionForm] = useState(false)
  const router = useRouter()

  const [approvalForm, setApprovalForm] = useState({
    approved_amount: '',
    interest_rate: '',
    tenure_months: '',
    banker_remarks: '',
    conditions: ''
  })

  const [rejectionForm, setRejectionForm] = useState({
    banker_remarks: ''
  })

  useEffect(() => {
    const getApplication = async () => {
      const { id } = await params
      fetchApplication(id)
    }
    getApplication()
  }, [params])

  const fetchApplication = async (id) => {
    try {
      const res = await fetch(`/api/banker/applications/${id}`)
      const data = await res.json()

      if (data.success) {
        setApplicationData(data.data)
        // Set default approval values
        setApprovalForm({
          approved_amount: data.data.application.requested_amount?.toString() || '',
          interest_rate: data.data.application.interest_rate_min?.toString() || '',
          tenure_months: '12',
          banker_remarks: '',
          conditions: ''
        })
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Failed to fetch application details')
    }
    setLoading(false)
  }

  const handleApprove = async () => {
    if (!approvalForm.approved_amount || !approvalForm.interest_rate || !approvalForm.tenure_months) {
      alert('Please fill in all required fields for approval')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`/api/banker/applications/${applicationData.application.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          ...approvalForm
        }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/banker/applications?status=approved')
      } else {
        alert('Failed to approve application: ' + data.message)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setProcessing(false)
  }

  const handleReject = async () => {
    if (!rejectionForm.banker_remarks.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`/api/banker/applications/${applicationData.application.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          banker_remarks: rejectionForm.banker_remarks
        }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/banker/applications?status=rejected')
      } else {
        alert('Failed to reject application: ' + data.message)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setProcessing(false)
  }

  const calculateMonthlyEMI = (amount, rate, tenure) => {
    if (!amount || !rate || !tenure) return 0
    const monthlyRate = rate / (12 * 100)
    const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1)
    return Math.round(emi)
  }

  const calculateDebtToIncomeRatio = () => {
    if (!applicationData?.application) return 0
    const { monthly_income, existing_loans_amount } = applicationData.application
    const emi = calculateMonthlyEMI(
      parseFloat(approvalForm.approved_amount) || 0,
      parseFloat(approvalForm.interest_rate) || 0,
      parseInt(approvalForm.tenure_months) || 0
    )
    const totalMonthlyDebt = (existing_loans_amount || 0) / 12 + emi
    return monthly_income > 0 ? ((totalMonthlyDebt / monthly_income) * 100).toFixed(1) : 0
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
          <p className="text-red-600">{error || 'Application not found'}</p>
          <Link href="/banker/applications" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Applications
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const { application, documents, bankerInfo } = applicationData
  const verifiedDocuments = documents.filter(doc => doc.verification_status === 'verified')
  const requiredDocuments = documents.filter(doc => doc.is_required)
  const allRequiredVerified = requiredDocuments.every(doc => doc.verification_status === 'verified')

  return (
    <DashboardLayout requiredRole="banker">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Review</h1>
            <p className="mt-1 text-sm text-gray-600">
              {application.application_number} • {application.first_name} {application.last_name}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/banker/applications"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Applications
            </Link>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-md p-4 ${
          application.status === 'verified' ? 'bg-blue-50 border border-blue-200' :
          application.status === 'approved' ? 'bg-green-50 border border-green-200' :
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
                  Application submitted on {formatDate(application.created_at)}
                </p>
                {application.approved_at && (
                  <p className="text-sm text-gray-700">
                    Decision made on {formatDate(application.approved_at)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Your Approval Limit</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(bankerInfo.maxApprovalLimit)}</p>
            </div>
          </div>
        </div>

        {/* Application Overview Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Loan Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Request</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Requested Amount</span>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(application.requested_amount)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Category</span>
                  <p className="text-sm text-gray-900">{application.loan_category_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Purpose</span>
                  <p className="text-sm text-gray-900">{application.purpose}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Interest Rate Range</span>
                  <p className="text-sm text-gray-900">{application.interest_rate_min}% - {application.interest_rate_max}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Profile */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Profile</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Monthly Income</span>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(application.monthly_income)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Employment</span>
                  <p className="text-sm text-gray-900">{application.employment_type?.replace('_', ' ')}</p>
                </div>
                {application.company_name && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Company</span>
                    <p className="text-sm text-gray-900">{application.company_name}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500">Work Experience</span>
                  <p className="text-sm text-gray-900">{application.work_experience_years || 0} years</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Existing Loans</span>
                  <p className="text-sm text-gray-900">{formatCurrency(application.existing_loans_amount || 0)}</p>
                </div>
                {application.cibil_score && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">CIBIL Score</span>
                    <p className={`text-sm font-semibold ${
                      application.cibil_score >= 750 ? 'text-green-600' :
                      application.cibil_score >= 650 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {application.cibil_score}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Status */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Document Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Documents</span>
                  <span className="text-sm font-semibold text-gray-900">{documents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Verified</span>
                  <span className="text-sm font-semibold text-green-600">{verifiedDocuments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Required</span>
                  <span className="text-sm font-semibold text-blue-600">{requiredDocuments.length}</span>
                </div>
                <div className="pt-2">
                  {allRequiredVerified ? (
                    <div className="flex items-center text-green-600">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium">All required documents verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium">Some documents pending verification</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{application.first_name} {application.last_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{application.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{application.email || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {application.date_of_birth ? formatDate(application.date_of_birth) : 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="mt-1 text-sm text-gray-900">{application.gender || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Marital Status</dt>
                <dd className="mt-1 text-sm text-gray-900">{application.marital_status || 'Not provided'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {application.address}, {application.city}, {application.state} - {application.pincode}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Connector</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {application.connector_first_name} {application.connector_last_name} ({application.agent_code})
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submitted Documents</h3>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className={`h-2 w-2 rounded-full ${
                      doc.verification_status === 'verified' ? 'bg-green-500' :
                      doc.verification_status === 'rejected' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 flex items-center">
                        {doc.document_type_name}
                        {doc.is_required && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{doc.file_name}</p>
                      {doc.operator_remarks && (
                        <p className="text-xs text-red-600 mt-1">{doc.operator_remarks}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(doc.verification_status)}`}>
                      {doc.verification_status}
                    </span>
                    <a
                      href={doc.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decision Section */}
        {application.status === 'verified' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Make Decision</h3>
              
              {!allRequiredVerified && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Warning: Not all required documents have been verified. Please ensure all required documents are verified before making a decision.
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowApprovalForm(true)
                    setShowRejectionForm(false)
                  }}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Approve Loan
                </button>

                <button
                  onClick={() => {
                    setShowRejectionForm(true)
                    setShowApprovalForm(false)
                  }}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject Application
                </button>
              </div>

              {/* Approval Form */}
              {showApprovalForm && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Loan Approval Details</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Approved Amount (₹) *</label>
                      <input
                        type="number"
                        value={approvalForm.approved_amount}
                        onChange={(e) => setApprovalForm(prev => ({ ...prev, approved_amount: e.target.value }))}
                        min="1"
                        max={Math.min(application.requested_amount, bankerInfo.maxApprovalLimit)}
                        placeholder="Enter approved amount"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interest Rate (%) *</label>
                      <input
                        type="number"
                        value={approvalForm.interest_rate}
                        onChange={(e) => setApprovalForm(prev => ({ ...prev, interest_rate: e.target.value }))}
                        min={application.interest_rate_min}
                        max={application.interest_rate_max}
                        step="0.1"
                        placeholder="Enter interest rate"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tenure (Months) *</label>
                      <select
                        value={approvalForm.tenure_months}
                        onChange={(e) => setApprovalForm(prev => ({ ...prev, tenure_months: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="">Select tenure</option>
                        {[6, 12, 18, 24, 36, 48, 60, 72, 84, 96, 120].filter(months => months <= application.max_tenure_months).map(months => (
                          <option key={months} value={months}>{months} months</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Monthly EMI</label>
                      <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                        <span className="text-lg font-semibold text-blue-600">
                          {formatCurrency(calculateMonthlyEMI(
                            parseFloat(approvalForm.approved_amount) || 0,
                            parseFloat(approvalForm.interest_rate) || 0,
                            parseInt(approvalForm.tenure_months) || 0
                          ))}
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Banker Remarks</label>
                      <textarea
                        value={approvalForm.banker_remarks}
                        onChange={(e) => setApprovalForm(prev => ({ ...prev, banker_remarks: e.target.value }))}
                        rows={3}
                        placeholder="Add any comments or observations..."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Special Conditions (Optional)</label>
                      <textarea
                        value={approvalForm.conditions}
                        onChange={(e) => setApprovalForm(prev => ({ ...prev, conditions: e.target.value }))}
                        rows={2}
                        placeholder="Any special terms or conditions..."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Loan Analysis */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-md">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">Loan Analysis</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Debt-to-Income Ratio:</span>
                        <span className={`ml-2 font-semibold ${
                          parseFloat(calculateDebtToIncomeRatio()) > 50 ? 'text-red-600' :
                          parseFloat(calculateDebtToIncomeRatio()) > 40 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {calculateDebtToIncomeRatio()}%
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">Total Interest:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {formatCurrency((calculateMonthlyEMI(
                            parseFloat(approvalForm.approved_amount) || 0,
                            parseFloat(approvalForm.interest_rate) || 0,
                            parseInt(approvalForm.tenure_months) || 0
                          ) * parseInt(approvalForm.tenure_months || 0)) - (parseFloat(approvalForm.approved_amount) || 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-4">
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Confirm Approval'}
                    </button>
                    <button
                      onClick={() => setShowApprovalForm(false)}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Rejection Form */}
              {showRejectionForm && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Rejection Details</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason for Rejection *</label>
                    <textarea
                      value={rejectionForm.banker_remarks}
                      onChange={(e) => setRejectionForm(prev => ({ ...prev, banker_remarks: e.target.value }))}
                      rows={4}
                      required
                      placeholder="Please provide a detailed reason for rejecting this application..."
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>

                  <div className="mt-6 flex space-x-4">
                    <button
                      onClick={handleReject}
                      disabled={processing}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Confirm Rejection'}
                    </button>
                    <button
                      onClick={() => setRejectionForm({ banker_remarks: '' })}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Already Decided */}
        {(application.status === 'approved' || application.status === 'rejected') && (
          <div className={`rounded-md p-4 ${
            application.status === 'approved' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {application.status === 'approved' ? (
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  application.status === 'approved' 
                    ? 'text-green-800' 
                    : 'text-red-800'
                }`}>
                  Application has been {application.status}
                  {application.approved_at && ` on ${formatDate(application.approved_at)}`}
                </p>
                {application.approved_amount && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>Approved Amount: {formatCurrency(application.approved_amount)}</p>
                    <p>Interest Rate: {application.approved_interest_rate}% per annum</p>
                    <p>Tenure: {application.approved_tenure_months} months</p>
                  </div>
                )}
                {application.banker_remarks && (
                  <p className={`mt-1 text-sm ${
                    application.status === 'approved' 
                      ? 'text-green-700' 
                      : 'text-red-700'
                  }`}>
                    Remarks: {application.banker_remarks}
                  </p>
                )}
                {application.special_conditions && (
                  <p className="mt-1 text-sm text-green-700">
                    Special Conditions: {application.special_conditions}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
