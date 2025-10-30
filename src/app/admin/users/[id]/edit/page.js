'use client'

import React,{ useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import UserForm from '@/components/forms/UserForm'

export default function EditUserPage({ params }) {
  const renderedParams = React.use(params)
  const id = renderedParams.id
  const [user, setUser] = useState(null)
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (id) {
      fetchUser()
      fetchBanks()
    }
  }, [id])

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`)
      const data = await res.json()

      if (data.success) {
        setUser(data.data)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Failed to fetch user details')
    }
    setLoading(false)
  }

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
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        router.push(`/admin/users/${id}`)
      } else {
        throw { errors: data.errors, message: data.message }
      }
    } catch (error) {
      throw error
    }
  }

  const handleCancel = () => {
    router.push(`/admin/users/${id}`)
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="super_admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !user) {
    return (
      <DashboardLayout requiredRole="super_admin">
        <div className="text-center">
          <p className="text-red-600">{error || 'User not found'}</p>
          <Link href="/admin/users" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Users
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="super_admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update information for {user.first_name} {user.last_name}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <UserForm
              user={user}
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
