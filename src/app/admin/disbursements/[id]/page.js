'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function DisbursementDetailPage({ params }) {
  const renderedParams = React.use(params);
  const [applicationData, setApplicationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [showDisbursementForm, setShowDisbursementForm] = useState(false)
  const router = useRouter()

  // Initialize form state
  const [disbursementForm, setDisbursementForm] = useState({
    disbursement_amount: '',
    disbursement_date: new Date().toISOString().split('T')[0],
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    transaction_reference: '',
    disbursement_remarks: '',
    comission_amount: '', 
    status: 'disbursed'
  })

  useEffect(() => {
    const getApplication = async () => {
      fetchApplication(renderedParams.id)
    }
    getApplication()
  }, [renderedParams])

  const fetchApplication = async (id) => {
    try {
      const res = await fetch(`/api/admin/applications/${id}`)
      const data = await res.json()

      if (data.success) {
        setApplicationData(data.data)
        
        const app = data.data.application;
        // Calculate remaining amount for auto-fill
        const approved = parseFloat(app.approved_amount) || 0;
        const disbursedSoFar = parseFloat(app.disbursed_amount) || 0;
        const remaining = Math.max(0, approved - disbursedSoFar);

        // Auto-fill form with remaining amount
        setDisbursementForm(prev => ({
          ...prev,
          disbursement_amount: remaining > 0 ? remaining.toString() : '',
          status: remaining > 0 ? 'disbursed' : 'disbursed' 
        }))
        
        // If partially disbursed, likely want to disburse more, so show form
        if (app.status === 'partially_disbursed' && remaining > 0) {
            setShowDisbursementForm(true);
        }

      } else {
        setError(data.message)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Failed to fetch application details')
    }
    setLoading(false)
  }

  const handleDisburse = async () => {
    const app = applicationData.application;
    const approved = parseFloat(app.approved_amount) || 0;
    const disbursedSoFar = parseFloat(app.disbursed_amount) || 0;
    const remaining = approved - disbursedSoFar;
    const currentAmount = parseFloat(disbursementForm.disbursement_amount);

    // Validations
    if (!currentAmount || 
        !disbursementForm.bank_name || 
        !disbursementForm.account_number || 
        !disbursementForm.ifsc_code || 
        !disbursementForm.transaction_reference) {
      alert('Please fill in all required fields')
      return
    }

    if (currentAmount > remaining) {
        alert(`Disbursement amount (${formatCurrency(currentAmount)}) cannot exceed remaining balance (${formatCurrency(remaining)})`);
        return;
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    if (!ifscRegex.test(disbursementForm.ifsc_code)) {
      alert('Please enter a valid IFSC code (e.g., HDFC0000001)')
      return
    }

    if (disbursementForm.account_number.length < 8 || disbursementForm.account_number.length > 18) {
      alert('Account number should be between 8-18 digits')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/disbursements/${app.id}/disburse`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...disbursementForm,
            comission_amount: disbursementForm.comission_amount || null 
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert('Disbursement processed successfully!')
        router.push('/admin/disbursements?status=disbursed')
      } else {
        alert('Failed to disburse loan: ' + data.message)
      }
    } catch (error) {
      console.error('Disbursement error:', error)
      alert('Error: ' + error.message)
    }
    setProcessing(false)
  }

  const calculateEMI = (amount, rate, tenure) => {
    if (!amount || !rate || !tenure) return 0
    const monthlyRate = rate / (12 * 100)
    const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1)
    return Math.round(emi)
  }

  const calculateCommission = (amount, percentage) => {
    return (amount * percentage) / 100
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !applicationData) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-red-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Unable to load application</h3>
          <p className="text-gray-600 mt-1">{error || 'Application not found'}</p>
          <Link href="/admin/disbursements" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Disbursements
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const { application, disbursements = [] } = applicationData
  
  // Calculations
  const approvedAmount = parseFloat(application.approved_amount) || 0;
  const disbursedSoFar = parseFloat(application.disbursed_amount) || 0;
  const remainingAmount = Math.max(0, approvedAmount - disbursedSoFar);

  const monthlyEMI = calculateEMI(
    application.approved_amount,
    application.approved_interest_rate,
    application.approved_tenure_months
  )
  const totalInterest = (monthlyEMI * application.approved_tenure_months) - application.approved_amount
  
  // Dynamic commission based on what user types
  const currentInputAmount = parseFloat(disbursementForm.disbursement_amount) || 0;
  const calculatedCommission = calculateCommission(
    currentInputAmount,
    application.commission_percentage
  )

  // Determine button state
  const isFullyDisbursed = remainingAmount <= 0 && application.status === 'disbursed';
  const canDisburse = !isFullyDisbursed;

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loan Disbursement</h1>
            <p className="mt-1 text-sm text-gray-600">
              Process disbursement for {application.application_number}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/admin/disbursements"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Disbursements
            </Link>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-md p-4 ${
          application.status === 'approved' ? 'bg-green-50 border border-green-200' :
          application.status === 'disbursed' ? 'bg-green-50 border border-green-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                {application.status.replace('_', ' ').toUpperCase()}
              </span>
              <div className="ml-4">
                {application.status === 'approved' && (
                  <p className="text-sm text-gray-700">
                    Approved on {formatDate(application.approved_at)} • Ready for disbursement
                  </p>
                )}
                {application.status === 'partially_disbursed' && (
                  <p className="text-sm text-gray-700">
                    Partially Disbursed • Remaining: <strong>{formatCurrency(remainingAmount)}</strong>
                  </p>
                )}
                {application.status === 'disbursed' && (
                  <p className="text-sm text-gray-700">
                    Fully Disbursed on {formatDate(application.disbursed_at)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loan Summary Cards - Exact Layout from Previous Design */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Loan Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                  <span className="text-sm font-medium text-blue-700">Approved Amount</span>
                  <span className="text-xl font-bold text-blue-900">
                    {formatCurrency(application.approved_amount)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Interest Rate</span>
                    <p className="text-lg font-semibold text-gray-900">{application.approved_interest_rate}%</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Tenure</span>
                    <p className="text-lg font-semibold text-gray-900">{application.approved_tenure_months} months</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Monthly EMI</span>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(monthlyEMI)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Total Interest</span>
                    <p className="text-lg font-semibold text-red-600">{formatCurrency(totalInterest)}</p>
                  </div>
                </div>
                {/* Show remaining balance if partial */}
                {remainingAmount > 0 && (
                   <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
                      <span className="font-medium text-gray-500">Remaining Balance:</span>
                      <span className="text-yellow-600 font-bold">{formatCurrency(remainingAmount)}</span>
                   </div>
                )}
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
                  <p className="text-sm text-gray-900">{application.first_name} {application.last_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Phone</span>
                  <p className="text-sm text-gray-900">{application.phone}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <p className="text-sm text-gray-900">{application.email || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Address</span>
                  <p className="text-sm text-gray-900">
                    {application.address}, {application.city}, {application.state} - {application.pincode}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase">Aadhar</span>
                    <p className="text-sm text-gray-900">{application.aadhar_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase">PAN</span>
                    <p className="text-sm text-gray-900">{application.pan_number || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Commission Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Connector</span>
                  <p className="text-sm text-gray-900">
                    {application.connector_first_name} {application.connector_last_name}
                  </p>
                  <p className="text-xs text-gray-500">Agent Code: {application.agent_code}</p>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-md">
                  <div>
                    <span className="text-sm font-medium text-purple-700">Commission Rate</span>
                    <p className="text-lg font-bold text-purple-900">{application.commission_percentage}%</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-purple-700">Current Batch</span>
                    {/* Dynamic calc based on input */}
                    <p className="text-lg font-bold text-purple-900">
                      {formatCurrency(calculatedCommission)}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Commission is calculated on the disbursed amount for this specific transaction.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disbursement Form (Shown if allowed) */}
        {canDisburse && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Process Disbursement</h3>
                {!showDisbursementForm && (
                  <button
                    onClick={() => setShowDisbursementForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Start Disbursement Process
                  </button>
                )}
              </div>

              {showDisbursementForm && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Disbursement Notice
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Total Approved: <b>{formatCurrency(approvedAmount)}</b>. 
                          Already Disbursed: <b>{formatCurrency(disbursedSoFar)}</b>. 
                          You can disburse up to <b>{formatCurrency(remainingAmount)}</b> now.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Disbursement Amount (₹) *</label>
                      <input
                        type="number"
                        value={disbursementForm.disbursement_amount}
                        onChange={(e) => setDisbursementForm(prev => ({ ...prev, disbursement_amount: e.target.value }))}
                        max={remainingAmount}
                        placeholder="Enter disbursement amount"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Maximum: {formatCurrency(remainingAmount)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Disbursement Date *</label>
                      <input
                        type="date"
                        value={disbursementForm.disbursement_date}
                        onChange={(e) => setDisbursementForm(prev => ({ ...prev, disbursement_date: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Name *</label>
                      <input
                        type="text"
                        value={disbursementForm.bank_name}
                        onChange={(e) => setDisbursementForm(prev => ({ ...prev, bank_name: e.target.value }))}
                        placeholder="e.g., HDFC Bank"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Number *</label>
                      <input
                        type="text"
                        value={disbursementForm.account_number}
                        onChange={(e) => setDisbursementForm(prev => ({ ...prev, account_number: e.target.value }))}
                        placeholder="Customer's account number"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">IFSC Code *</label>
                      <input
                        type="text"
                        value={disbursementForm.ifsc_code}
                        onChange={(e) => setDisbursementForm(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                        placeholder="e.g., HDFC0000001"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transaction Reference *</label>
                      <input
                        type="text"
                        value={disbursementForm.transaction_reference}
                        onChange={(e) => setDisbursementForm(prev => ({ ...prev, transaction_reference: e.target.value }))}
                        placeholder="Transaction/UTR number"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Disbursement Remarks</label>
                      <textarea
                        value={disbursementForm.disbursement_remarks}
                        onChange={(e) => setDisbursementForm(prev => ({ ...prev, disbursement_remarks: e.target.value }))}
                        rows={3}
                        placeholder="Any additional notes about the disbursement..."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Custom Comission Amount</label>
                      <input
                        type="number"
                        value={disbursementForm.comission_amount ?? calculatedCommission}
                        onChange={(e) => setDisbursementForm(prev => ({ ...prev, comission_amount: e.target.value }))}
                        placeholder="Override calculated commission"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status *</label>
                      <select
                        value={disbursementForm.status}
                        onChange={(e) => setDisbursementForm(prev => ({ ...prev, status: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                      >
                        <option value="disbursed">Fully Disbursed (Final)</option>
                        <option value="partially_disbursed">Partially Disbursed (More to come)</option>
                      </select>
                    </div>
                  </div>

                  {/* Commission Summary Box - Same as previous */}
                  <div className="bg-purple-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-purple-900 mb-2">Commission Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-purple-700">Disbursement Amount:</span>
                        <p className="font-semibold text-purple-900">
                          {formatCurrency(parseFloat(disbursementForm.disbursement_amount) || 0)}
                        </p>
                      </div>
                      <div>
                        <span className="text-purple-700">Commission Rate:</span>
                        <p className="font-semibold text-purple-900">{application.commission_percentage}%</p>
                      </div>
                      <div>
                        <span className="text-purple-700">Commission Amount:</span>
                        <p className="font-semibold text-purple-900">
                          {formatCurrency(calculatedCommission)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleDisburse}
                      disabled={processing}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing Disbursement...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Complete Disbursement
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowDisbursementForm(false)}
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

        {/* Already Disbursed - History List */}
        {(application.status === 'disbursed' || application.status === 'partially_disbursed' || disbursements.length > 0) && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
             <div className="flex items-center mb-4">
                 <div className="flex-shrink-0 mr-3">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 </div>
                 <h3 className="text-sm font-medium text-green-800">Disbursement History</h3>
             </div>
            
             <div className="space-y-4 pl-8">
                 {disbursements.map((txn, idx) => (
                     <div key={txn.id} className="bg-white p-4 rounded border border-green-100 shadow-sm">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Amount</p>
                            <p className="font-bold text-gray-900">{formatCurrency(txn.disbursed_amount)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Date</p>
                            <p className="font-medium text-gray-900">{formatDate(txn.disbursement_date)}</p>
                          </div>
                          <div>
                             <p className="text-gray-500 text-xs">Bank & Ref</p>
                             <p className="text-gray-900">{txn.bank_reference} (Ref: {txn.reference_number})</p>
                          </div>
                          <div>
                             <p className="text-gray-500 text-xs">Commission</p>
                             <p className="text-purple-700 font-medium">{formatCurrency(txn.connector_commission)}</p>
                          </div>
                        </div>
                     </div>
                 ))}
                 {/* Total Summary Footer */}
                 <div className="pt-2 border-t border-green-200 flex justify-between text-sm">
                     <span className="text-green-800 font-medium">Total Disbursed:</span>
                     <span className="text-green-900 font-bold">{formatCurrency(disbursedSoFar)}</span>
                 </div>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}