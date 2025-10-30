'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CustomerForm from '@/components/forms/CustomerForm'
import Link from 'next/link'
import react from '@heroicons/react'

export default function EditCustomerPage({ params }) {
  const renderedParams = React.use(params);
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (renderedParams.id) {
      fetchCustomer()
    }
  }, [renderedParams.id])

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${renderedParams.id}`)
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

  const handleSubmit = async (formData) => {
    try {
      const res = await fetch(`/api/customers/${renderedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        router.push(`/connector/customers/${renderedParams.id}`)
      } else {
        throw { errors: data.errors, message: data.message }
      }
    } catch (error) {
      throw error
    }
  }

  const handleCancel = () => {
    router.push(`/connector/customers/${renderedParams.id}`)
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update information for {customer.first_name} {customer.last_name}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <CustomerForm
              customer={customer}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
