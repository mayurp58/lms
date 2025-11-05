'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DocumentsList from '@/components/tables/DocumentsList'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function ViewApplicationPage({ params }) {
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
            <h1 className="text-2xl font-bold text-gray-900">Loan Application Details</h1>
            <p className="mt-1 text-sm text-gray-600">
              Application #{application.application_number}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/connector/applications"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Applications
            </Link>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-md p-4 ${
          application.status === 'approved' ? 'bg-green-50 border border-green-200' :
          application.status === 'rejected' ? 'bg-red-50 border border-red-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
              {application.status.replace('_', ' ').toUpperCase()}
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-700">
                Application submitted on {formatDate(application.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Application Details Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Customer Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Customer Information
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {application.first_name} {application.last_name}
                  </dd>
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
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {application.address}<br />
                    {application.city}, {application.state} - {application.pincode}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Loan Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Loan Details
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Loan Category</dt>
                  <dd className="mt-1 text-sm text-gray-900">{application.loan_category_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Requested Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-semibold">
                    {formatCurrency(application.requested_amount)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Purpose</dt>
                  <dd className="mt-1 text-sm text-gray-900">{application.purpose}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Monthly Income</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatCurrency(application.monthly_income)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {application.employment_type?.replace('_', ' ')}
                  </dd>
                </div>
                {application.company_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.company_name}</dd>
                  </div>
                )}
                {application.work_experience_years && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Work Experience</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.work_experience_years} years</dd>
                  </div>
                )}
                {application.existing_loans_amount > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Existing Loans</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatCurrency(application.existing_loans_amount)}
                    </dd>
                  </div>
                )}
                {application.cibil_score && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">CIBIL Score</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.cibil_score}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Application Documents
          </h3>
          <DocumentsList customerId={application.customer_id} loanApplicationId={application.id} />
        </div>

        {/* Action Buttons */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex space-x-4">
            <Link
              href={`/connector/applications/${application.id}/documents`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Documents
            </Link>
            <Link
              href={`/connector/customers/${application.customer_id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View Customer Profile
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
