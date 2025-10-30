'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import UserForm from '@/components/forms/UserForm'

export default function NewUserPage() {
  const [banks, setBanks] = useState([])
  const router = useRouter()

  useEffect(() => {
    fetchBanks()
  }, [])

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/admin/banks')
      const data = await res.json()
      if (data.success) {
        setBanks(data.data)
      }
    } catch (error) {
      console.error('Error fetching banks:', error)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/admin/users')
      } else {
        throw { errors: data.errors, message: data.message }
      }
    } catch (error) {
      throw error
    }
  }

  const handleCancel = () => {
    router.push('/admin/users')
  }

  return (
    <DashboardLayout requiredRole="super_admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new user account for the banking system
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <UserForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              banks={banks}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
