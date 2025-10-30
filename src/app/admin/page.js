'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils'
import Link from 'next/link'

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30days')

  useEffect(() => {
    fetchDashboardData()
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      const data = await res.json()

      if (data.success) {
        setDashboardData(data.data)
      } else {
        console.error('Failed to fetch dashboard data:', data.message)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
    setLoading(false)
  }

  const getActionLabel = (action) => {
    const labels = {
      'USER_CREATED': 'User Created',
      'APPLICATION_SUBMITTED': 'Application Submitted',
      'DOCUMENT_UPLOADED': 'Document Uploaded',
      'DOCUMENT_VERIFIED': 'Document Verified',
      'APPLICATION_APPROVED': 'Application Approved',
      'APPLICATION_REJECTED': 'Application Rejected',
      'LOAN_DISBURSED': 'Loan Disbursed',
      'COMMISSION_PAID': 'Commission Paid',
      'AUTO_STATUS_UPDATE': 'Auto Status Update'
    }
    return labels[action] || action
  }

  const getActivityIcon = (action) => {
    const icons = {
      'USER_CREATED': '👤',
      'APPLICATION_SUBMITTED': '📝',
      'DOCUMENT_UPLOADED': '📄',
      'DOCUMENT_VERIFIED': '✅',
      'APPLICATION_APPROVED': '✅',
      'APPLICATION_REJECTED': '❌',
      'LOAN_DISBURSED': '💰',
      'COMMISSION_PAID': '💳',
      'AUTO_STATUS_UPDATE': '🔄'
    }
    return icons[action] || '📋'
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!dashboardData) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="text-center py-8">
          <p className="text-gray-500">Unable to load dashboard data</p>
        </div>
      </DashboardLayout>
    )
  }

  const {
    systemStats,
    financialStats,
    commissionStats,
    documentStats,
    recentActivities,
    topConnectors,
    categoryStats,
    bankerStats
  } = dashboardData

  // Calculate key metrics
  const approvalRate = systemStats.total_applications > 0 
    ? ((systemStats.approved_applications / systemStats.total_applications) * 100).toFixed(1)
    : 0

  const disbursalRate = systemStats.approved_applications > 0
    ? ((systemStats.disbursed_applications / systemStats.approved_applications) * 100).toFixed(1)
    : 0

  const totalPendingValue = (systemStats.approved_applications - systemStats.disbursed_applications) * 
    (financialStats.average_loan_amount || 0)

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Complete overview of the loan management system
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-blue-500">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{systemStats.total_applications || 0}</div>
                      <div className="ml-2 text-sm text-blue-600">{approvalRate}% approved</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-green-500">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Disbursed</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(financialStats.total_disbursed_amount || 0)}
                      </div>
                      <div className="ml-2 text-sm text-green-600">{disbursalRate}% of approved</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-purple-500">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {(systemStats.total_connectors + systemStats.total_operators + systemStats.total_bankers) || 0}
                      </div>
                      <div className="ml-2 text-sm text-purple-600">{systemStats.total_customers || 0} customers</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-yellow-500">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Commission</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(commissionStats.pending_commission || 0)}
                      </div>
                      <div className="ml-2 text-sm text-yellow-600">{commissionStats.pending_commission_count || 0} records</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Status Flow */}
        <div className="bg-white shadow-lg rounded-xl">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Application Pipeline</h3>
            <p className="mt-1 text-sm text-gray-500">Current status distribution of all applications</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{systemStats.submitted_applications || 0}</div>
                <div className="text-sm text-blue-700 font-medium">Submitted</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{systemStats.under_verification || 0}</div>
                <div className="text-sm text-yellow-700 font-medium">Under Review</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{systemStats.verified_applications || 0}</div>
                <div className="text-sm text-indigo-700 font-medium">Verified</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{systemStats.approved_applications || 0}</div>
                <div className="text-sm text-green-700 font-medium">Approved</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{systemStats.rejected_applications || 0}</div>
                <div className="text-sm text-red-700 font-medium">Rejected</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{systemStats.disbursed_applications || 0}</div>
                <div className="text-sm text-emerald-700 font-medium">Disbursed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{systemStats.approved_applications - systemStats.disbursed_applications}</div>
                <div className="text-sm text-purple-700 font-medium">Pending Disbursal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <div className="bg-white shadow-lg rounded-xl">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  href="/admin/users"
                  className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-5a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Manage Users
                </Link>
                <Link
                  href="/admin/applications"
                  className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View Applications
                </Link>
                <Link
                  href="/admin/disbursements"
                  className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Loan Disbursements
                </Link>
                <Link
                  href="/admin/commissions"
                  className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Commission Payments
                </Link>
              </div>
            </div>
          </div>

          {/* Document Status */}
          <div className="bg-white shadow-lg rounded-xl">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Document Status</h3>
              <p className="mt-1 text-sm text-gray-500">Document verification progress</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Documents</span>
                  <span className="text-2xl font-bold text-gray-900">{documentStats.total_documents || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-600">Pending Verification</span>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-yellow-600 mr-2">{documentStats.pending_documents || 0}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: documentStats.total_documents > 0 
                            ? `${(documentStats.pending_documents / documentStats.total_documents) * 100}%` 
                            : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600">Verified</span>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-green-600 mr-2">{documentStats.verified_documents || 0}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: documentStats.total_documents > 0 
                            ? `${(documentStats.verified_documents / documentStats.total_documents) * 100}%` 
                            : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-600">Rejected</span>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-red-600 mr-2">{documentStats.rejected_documents || 0}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: documentStats.total_documents > 0 
                            ? `${(documentStats.rejected_documents / documentStats.total_documents) * 100}%` 
                            : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers and Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Connectors */}
          <div className="bg-white shadow-lg rounded-xl">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Top Performing Connectors</h3>
              <p className="mt-1 text-sm text-gray-500">Based on total disbursed amount</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topConnectors.slice(0, 5).map((connector, index) => (
                  <div key={connector.agent_code} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {connector.first_name} {connector.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{connector.agent_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(connector.total_disbursed)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {connector.disbursed_count} loans
                      </p>
                    </div>
                  </div>
                ))}
                {topConnectors.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No connector data available yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white shadow-lg rounded-xl">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent System Activity</h3>
              <p className="mt-1 text-sm text-gray-500">Latest actions across the platform</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentActivities.slice(0, 8).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{getActionLabel(activity.action)}</span>
                        {activity.first_name && (
                          <span className="text-gray-500"> by {activity.first_name} {activity.last_name}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loan Categories Performance */}
        <div className="bg-white shadow-lg rounded-xl">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Loan Categories Performance</h3>
            <p className="mt-1 text-sm text-gray-500">Applications and approval rates by loan category</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approval Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Disbursed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryStats.map((category) => (
                    <tr key={category.category_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.category_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.applications_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.approved_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className={`font-semibold ${
                            category.approval_rate >= 70 ? 'text-green-600' :
                            category.approval_rate >= 40 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {category.approval_rate || 0}%
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full ${
                                category.approval_rate >= 70 ? 'bg-green-600' :
                                category.approval_rate >= 40 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${category.approval_rate || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(category.total_disbursed || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(category.avg_loan_amount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categoryStats.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No loan category data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
