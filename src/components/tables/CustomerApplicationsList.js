'use client'

import { useState, useEffect } from 'react'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default function CustomerApplicationsList({ customerId }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [customerId])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/applications`)
      const data = await res.json()

      if (data.success) {
        setApplications(data.data)
      } else {
        console.error('Failed to fetch applications:', data.message)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading applications...</p>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-6">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No loan applications</h3>
        <p className="mt-1 text-sm text-gray-500">Create a loan application to get started with document uploads.</p>
        <div className="mt-6">
          <Link
            href={`/connector/applications/new?customer=${customerId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Create Loan Application
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {applications.map((application) => (
        <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {application.application_number}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                  {application.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {formatCurrency(application.requested_amount)} • {application.loan_category_name}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Applied on {formatDate(application.created_at)}
              </div>
            </div>
            <div className="flex space-x-2">
              <Link
                href={`/connector/applications/${application.id}`}
                className="text-blue-600 hover:text-blue-900 text-sm"
              >
                View Details
              </Link>
              <Link
                href={`/connector/applications/${application.id}/documents`}
                className="text-green-600 hover:text-green-900 text-sm"
              >
                Manage Documents
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
