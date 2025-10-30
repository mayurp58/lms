'use client'

import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CustomerForm from '@/components/forms/CustomerForm'

export default function NewCustomerPage() {
  const router = useRouter()

  const handleSubmit = async (formData) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/connector/customers')
      } else {
        throw { errors: data.errors, message: data.message }
      }
    } catch (error) {
      throw error
    }
  }

  const handleCancel = () => {
    router.push('/connector/customers')
  }

  return (
    <DashboardLayout requiredRole="connector">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
          <p className="mt-1 text-sm text-gray-600">
            Enter customer details to add them to your customer base
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <CustomerForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
