'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default function DocumentVerificationPage({ params }) {
  const renderedParams = React.use(params);
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [remarks, setRemarks] = useState('')
  const router = useRouter()

  useEffect(() => {
    const getDocument = async () => {
      fetchDocument(renderedParams.id)
    }
    getDocument()
  }, [params])

  const fetchDocument = async (id) => {
    try {
      const res = await fetch(`/api/operator/documents/${renderedParams.id}`)
      const data = await res.json()
  
      if (data.success) {
        setDocument(data.data)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Failed to fetch document details')
    }
    setLoading(false)
  }

  const handleVerify = async (status) => {
    if (status === 'rejected' && !remarks.trim()) {
      alert('Please provide remarks for rejection')
      return
    }

    setVerifying(true)
    try {
      const res = await fetch(`/api/operator/documents/${document.id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          remarks: remarks.trim() || null
        }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/operator/documents?status=pending')
      } else {
        alert('Failed to update document: ' + data.message)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setVerifying(false)
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

  if (error || !document) {
    return (
      <DashboardLayout requiredRole="operator">
        <div className="text-center py-8">
          <p className="text-red-600">{error || 'Document not found'}</p>
          <Link href="/operator/documents" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Documents
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
            <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
            <p className="mt-1 text-sm text-gray-600">
              Review and verify {document.document_type_name}
            </p>
          </div>
          <Link
            href="/operator/documents"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Documents
          </Link>
        </div>

        {/* Document Details */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Column - Document Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Document Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                      {document.document_type_name}
                      {document.is_required && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.document_type_description}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">File Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.file_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">File Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {Math.round(document.file_size_kb / 1024 * 100) / 100} MB
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Uploaded On</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(document.uploaded_at)}</dd>
                  </div>
                </dl>
              </div>

              {/* Right Column - Application & Customer Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Application Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Customer</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {document.first_name} {document.last_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Application Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.application_number}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Loan Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.loan_category_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Requested Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">
                      {formatCurrency(document.requested_amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Connector</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {document.connector_first_name} {document.connector_last_name} ({document.agent_code})
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Document Preview */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Document Preview</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-4">{document.file_name}</p>
                  <a
                    href={document.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Open in New Tab
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Actions */}
        {document.verification_status === 'pending' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Action</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                    Remarks (Required for rejection, optional for approval)
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Add any comments or reasons for your decision..."
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleVerify('verified')}
                    disabled={verifying}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {verifying ? 'Verifying...' : 'Approve Document'}
                  </button>

                  <button
                    onClick={() => handleVerify('rejected')}
                    disabled={verifying}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {verifying ? 'Rejecting...' : 'Reject Document'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Already verified/rejected status */}
        {document.verification_status !== 'pending' && (
          <div className={`rounded-md p-4 ${
            document.verification_status === 'verified' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {document.verification_status === 'verified' ? (
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
                  document.verification_status === 'verified' 
                    ? 'text-green-800' 
                    : 'text-red-800'
                }`}>
                  Document has been {document.verification_status}
                </p>
                {document.operator_remarks && (
                  <p className={`mt-1 text-sm ${
                    document.verification_status === 'verified' 
                      ? 'text-green-700' 
                      : 'text-red-700'
                  }`}>
                    Remarks: {document.operator_remarks}
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
