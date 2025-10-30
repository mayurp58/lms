'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DocumentUploadForm from '@/components/forms/DocumentUploadForm'
import DocumentsList from '@/components/tables/DocumentsList'
import Link from 'next/link'

export default function CustomerDocumentsPage({ params }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const getCustomer = async () => {
      const { id } = await params
      fetchCustomer(id)
    }
    getCustomer()
  }, [params])

  const fetchCustomer = async (id) => {
    try {
      const res = await fetch(`/api/customers/${id}`)
      const data = await res.json()

      if (data.success) {
        setCustomer(data.data)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Failed to fetch customer details')
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

  if (error || !customer) {
    return (
      <DashboardLayout requiredRole="connector">
        <div className="text-center">
          <p className="text-red-600">{error || 'Customer not found'}</p>
          <Link href="/connector/customers" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Customers
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
            <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage documents for {customer.first_name} {customer.last_name}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/connector/customers/${customer.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Back to Customer
            </Link>
            <Link
              href={`/connector/applications/new?customer=${customer.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Create Loan Application
            </Link>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-gray-700">
                  {customer.first_name?.[0]}{customer.last_name?.[0]}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {customer.first_name} {customer.last_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {customer.phone} • {customer.city}, {customer.state}
                </p>
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
            <DocumentUploadForm 
              customerId={customer.id} 
              onUploadComplete={handleUploadComplete}
            />
          </div>
        </div>

        {/* Documents List */}
        <div key={refreshKey}>
          <DocumentsList customerId={customer.id} />
        </div>
      </div>
    </DashboardLayout>
  )
}
