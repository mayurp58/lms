'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function AdminApplicationDetailPage({ params }) {
  const renderedParams = React.use(params);
  const [applicationData, setApplicationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('details')
  const router = useRouter()

  useEffect(() => {
    fetchApplication(renderedParams.id)
  }, [renderedParams.id])

  const fetchApplication = async (id) => {
    try {
      const res = await fetch(`/api/admin/applications/${id}`)
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
          <Link href="/admin/applications" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Applications
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const { application, documents = [], commission, logs = [] } = applicationData

  const monthlyEMI = application.approved_amount && application.approved_interest_rate && application.approved_tenure_months
    ? calculateEMI(application.approved_amount, application.approved_interest_rate, application.approved_tenure_months)
    : 0

  const totalInterest = monthlyEMI && application.approved_tenure_months
    ? (monthlyEMI * application.approved_tenure_months) - application.approved_amount
    : 0

  const commissionAmount = application.approved_amount && application.commission_percentage
    ? calculateCommission(application.approved_amount, application.commission_percentage)
    : 0

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
            <p className="mt-1 text-sm text-gray-600">
              Viewing details for {application.application_number}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/admin/applications"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Applications
            </Link>
            {application.status === 'approved' && (
              <Link
                href={`/admin/disbursements/${application.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                💰 Process Disbursement
              </Link>
            )}
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-md p-4 ${
          application.status === 'approved' ? 'bg-green-50 border border-green-200' :
          application.status === 'disbursed' ? 'bg-purple-50 border border-purple-200' :
          application.status === 'rejected' ? 'bg-red-50 border border-red-200' :
          application.status === 'verified' ? 'bg-blue-50 border border-blue-200' :
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
                {application.approved_at && (
                  <p className="text-sm text-gray-700">
                    Approved on {formatDate(application.approved_at)}
                  </p>
                )}
                {application.disbursed_at && (
                  <p className="text-sm text-gray-700">
                    Disbursed on {formatDate(application.disbursed_at)}
                  </p>
                )}
              </div>
            </div>
          </div>
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
                    
                    {application.approved_amount && (
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                        <span className="text-sm font-medium text-green-700">Approved Amount</span>
                        <span className="text-xl font-bold text-green-900">
                          {formatCurrency(application.approved_amount)}
                        </span>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Loan Category:</span>
                        <span className="text-gray-900">{application.loan_category_name}</span>
                      </div>
                      {application.approved_interest_rate && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Interest Rate:</span>
                          <span className="text-gray-900">{application.approved_interest_rate}%</span>
                        </div>
                      )}
                      {application.approved_tenure_months && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Tenure:</span>
                          <span className="text-gray-900">{application.approved_tenure_months} months</span>
                        </div>
                      )}
                      {monthlyEMI > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-500">Monthly EMI:</span>
                            <span className="text-green-600 font-semibold">{formatCurrency(monthlyEMI)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-500">Total Interest:</span>
                            <span className="text-red-600 font-semibold">{formatCurrency(totalInterest)}</span>
                          </div>
                        </>
                      )}
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

              {/* Connector & Commission */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Connector & Commission</h3>
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
                          <span className="text-sm font-medium text-purple-700">Commission</span>
                          <p className="text-xs text-purple-600">{application.commission_percentage}%</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-purple-900">
                            {formatCurrency(commissionAmount)}
                          </span>
                        </div>
                      </div>
                    )}

                    {commission && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        Commission Status: 
                        <span className={`ml-1 font-medium ${commission.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {commission.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Details */}
            {(application.banker_first_name || application.banker_remarks || application.special_conditions) && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Details</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {application.banker_first_name && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Approved By</span>
                        <p className="text-sm text-gray-900">
                          {application.banker_first_name} {application.banker_last_name}
                        </p>
                        <p className="text-xs text-gray-500">{application.banker_designation}</p>
                      </div>
                    )}
                    {application.approved_at && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Approval Date</span>
                        <p className="text-sm text-gray-900">{formatDate(application.approved_at)}</p>
                      </div>
                    )}
                    {application.banker_remarks && (
                      <div className="sm:col-span-2">
                        <span className="text-sm font-medium text-gray-500">Banker Remarks</span>
                        <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded mt-1">
                          {application.banker_remarks}
                        </p>
                      </div>
                    )}
                    {application.special_conditions && (
                      <div className="sm:col-span-2">
                        <span className="text-sm font-medium text-gray-500">Special Conditions</span>
                        <p className="text-sm text-gray-900 bg-yellow-50 p-3 rounded mt-1">
                          {application.special_conditions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Disbursement Details */}
            {application.status === 'disbursed' && application.disbursement_details && (
              <div className="bg-green-50 border border-green-200 rounded-lg">
                <div className="p-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-green-800">
                        Loan Successfully Disbursed
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        {(() => {
                          try {
                            const details = JSON.parse(application.disbursement_details)
                            return (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p><span className="font-medium">Amount:</span> {formatCurrency(application.disbursed_amount)}</p>
                                  <p><span className="font-medium">Bank:</span> {details.bank_name}</p>
                                  <p><span className="font-medium">Account:</span> {details.account_number}</p>
                                </div>
                                <div>
                                  <p><span className="font-medium">IFSC:</span> {details.ifsc_code}</p>
                                  <p><span className="font-medium">Reference:</span> {details.transaction_reference}</p>
                                  <p><span className="font-medium">Date:</span> {formatDate(application.disbursed_at)}</p>
                                </div>
                                {details.remarks && (
                                  <div className="col-span-2">
                                    <p><span className="font-medium">Remarks:</span> {details.remarks}</p>
                                  </div>
                                )}
                              </div>
                            )
                          } catch (error) {
                            return (
                              <p>Disbursement completed on {formatDate(application.disbursed_at)}</p>
                            )
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
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
                        <h4 className="text-sm font-medium text-gray-900">{doc.document_name || `Document ${index + 1}`}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(doc.verification_status || 'pending')}`}>
                          {doc.verification_status || 'Pending'}
                        </span>
                      </div>
                      {doc.file_path && (
                        <a 
                          href={doc.file_path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Document
                        </a>
                      )}
                      {doc.verified_by_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          Verified by: {doc.verified_by_name} {doc.verified_by_last_name}
                        </p>
                      )}
                      {doc.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">
                          Reason: {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No documents uploaded for this application
                </div>
              )}
            </div>
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
