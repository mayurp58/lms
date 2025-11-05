'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getStatusColor, formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default  function ViewUserPage({ params }) {

  const renderedParams = React.use(params)
  
  const id = renderedParams.id
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (id) {
      fetchUser()
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

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'super_admin': 'Super Admin',
      'connector': 'Connector',
      'operator': 'Operator',
      'banker': 'Banker'
    }
    return roleNames[role] || role
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            <p className="mt-1 text-sm text-gray-600">
              Complete information about {user.first_name} {user.last_name}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/admin/users"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Back to Users
            </Link>
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit User
            </Link>
          </div>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Basic Information */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Basic Information
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.first_name} {user.last_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.phone || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="mt-1 text-sm text-gray-900">{getRoleDisplayName(user.role)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(user.created_at)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.address ? (
                        <div>
                          <div>{user.address}</div>
                          <div>{user.city}, {user.state} - {user.pincode}</div>
                        </div>
                      ) : (
                        'Not provided'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Profile Summary */}
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="mx-auto h-20 w-20 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-700">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{getRoleDisplayName(user.role)}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role-specific Information */}
        {user.role === 'connector' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Connector Information
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Agent Code</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{user.agent_code || 'Not assigned'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Working City</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.connector_city || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Working Area</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.connector_area || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Commission Rate</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.commission_percentage}%</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cases Submitted</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.total_cases_submitted || 0}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Commission Earned</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatCurrency(user.total_commission_earned || 0)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {user.role === 'banker' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Banker Information
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bank</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.bank_name || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bank Branch</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.branch || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bank Branch Code</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.branch_code || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employee ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.employee_id || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Designation</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.designation || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.department || 'Not specified'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Max Approval Limit</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.max_approval_limit ? formatCurrency(user.max_approval_limit) : 'Not set'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
