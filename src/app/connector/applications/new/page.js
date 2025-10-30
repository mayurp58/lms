'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoanApplicationForm from '@/components/forms/LoanApplicationForm'
import Link from 'next/link'

function NewApplicationContent() {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const customerId = searchParams.get('customer')

  useEffect(() => {
    if (customerId) {
      fetchCustomer(customerId)
    } else {
      setLoading(false)
      setError('No customer selected')
    }
  }, [customerId])

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

  const handleSubmit = async (formData) => {
    try {
      const res = await fetch('/api/loan-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        router.push(`/connector/applications/${data.data.applicationId}`)
      } else {
        throw { errors: data.errors, message: data.message }
      }
    } catch (error) {
      throw error
    }
  }

  const handleCancel = () => {
    if (customer) {
      router.push(`/connector/customers/${customer.id}`)
    } else {
      router.push('/connector/customers')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="text-center">
        <p className="text-red-600">{error || 'Customer not found'}</p>
        <Link href="/connector/customers" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          ← Back to Customers
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Loan Application</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new loan application for {customer.first_name} {customer.last_name}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <LoanApplicationForm
            customer={customer}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}

export default function NewApplicationPage() {
  return (
    <DashboardLayout requiredRole="connector">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <NewApplicationContent />
      </Suspense>
    </DashboardLayout>
  )
}
