'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import CustomerApplicationsList from '@/components/tables/CustomerApplicationsList'

export default function ViewCustomerPage({ params }) {
  const renderedParams = React.use(params)
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const customer_id = renderedParams.id;
  useEffect(() => {
    if (customer_id) {
      fetchCustomer()
    }
  }, [customer_id])

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${customer_id}`)
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
            <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
            <p className="mt-1 text-sm text-gray-600">
              Complete information about {customer.first_name} {customer.last_name}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/connector/customers"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Back to Customers
            </Link>
            <Link
              href={`/connector/customers/${customer.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Customer
            </Link>
            <Link
              href={`/connector/applications/new?customer=${customer.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Apply for Loan
            </Link>
            
          </div>
        </div>

        {/* Customer Info Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Basic Information */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Personal Information
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{customer.first_name} {customer.last_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{customer.email || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{customer.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {customer.date_of_birth ? formatDate(customer.date_of_birth) : 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {customer.gender ? customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1) : 'Not specified'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Marital Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {customer.marital_status ? customer.marital_status.charAt(0).toUpperCase() + customer.marital_status.slice(1) : 'Not specified'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div>{customer.address}</div>
                      <div>{customer.city}, {customer.state} - {customer.pincode}</div>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Identity Information */}
            <div className="bg-white shadow rounded-lg mt-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Identity Information
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Aadhar Number</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">
                      XXXX XXXX {customer.aadhar_number?.slice(-4)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">PAN Number</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">
                      {customer.pan_number?.slice(0, 3)}XXXXXX{customer.pan_number?.slice(-1)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Customer Summary */}
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="mx-auto h-20 w-20 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-700">
                      {customer.first_name?.[0]}{customer.last_name?.[0]}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {customer.first_name} {customer.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">Customer ID: {customer.id}</p>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                </div>

                <div className="mt-6 border-t pt-6">
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Added by</dt>
                      <dd className="text-sm text-gray-900">
                        {customer.connector_first_name} {customer.connector_last_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Agent Code</dt>
                      <dd className="text-sm text-gray-900 font-mono">{customer.agent_code}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Added On</dt>
                      <dd className="text-sm text-gray-900">{formatDate(customer.created_at)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Applications - Placeholder for future implementation */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Loan Applications
            </h3>
            <CustomerApplicationsList customerId={customer.id} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
