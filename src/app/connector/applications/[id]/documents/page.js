'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DocumentUploadForm from '@/components/forms/DocumentUploadForm'
import DocumentsList from '@/components/tables/DocumentsList'
import Link from 'next/link'
import ApplicationDocumentUploadForm from '@/components/forms/ApplicationDocumentUploadForm'

export default function ApplicationDocumentsPage({ params }) {
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const getApplication = async () => {
      const { id } = await params
      fetchApplication(id)
    }
    getApplication()
  }, [params])

  const fetchApplication = async (id) => {
    try {
      const res = await fetch(`/api/loan-applications/${id}`)
      const data = await res.json()

      if (data.success) {
        setApplication(data.data)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Failed to fetch application details')
    }
    setLoading(false)
  }

  const handleUploadComplete = (uploadedDoc) => {
    console.log('Document uploaded:', uploadedDoc)
    // Refresh the documents list
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="connector">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !application) {
    return (
      <DashboardLayout requiredRole="connector">
        <div className="text-center">
          <p className="text-red-600">{error || 'Application not found'}</p>
          <Link href="/connector/applications" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Applications
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="connector">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Documents</h1>
            <p className="mt-1 text-sm text-gray-600">
              Upload and manage documents for application #{application.application_number}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/connector/applications/${application.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Application
            </Link>
          </div>
        </div>

        {/* Application Info Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {application.first_name} {application.last_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {application.loan_category_name} • ₹{application.requested_amount?.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Upload New Document
            </h3>
            <ApplicationDocumentUploadForm 
              loanApplicationId={application.id}
              customerId={application.customer_id}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        </div>

        {/* Documents List */}
        <div key={refreshKey}>
          <DocumentsList loanApplicationId={application.id} />
        </div>
      </div>
    </DashboardLayout>
  )
}
