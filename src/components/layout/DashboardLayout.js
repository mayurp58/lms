'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children, requiredRole }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()

        if (data.success) {
          setUser(data.user)
          
          // Super admin can access everything
          if (requiredRole && data.user.role !== 'super_admin') {
            if (requiredRole === 'admin' && !['admin', 'super_admin'].includes(data.user.role)) {
              router.push('/unauthorized')
              return
            } else if (requiredRole !== 'admin' && data.user.role !== requiredRole) {
              router.push('/unauthorized')
              return
            }
          }
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Dashboard auth error:', error)
        router.push('/auth/login')
      }
      setLoading(false)
    }

    fetchUser()
  }, [requiredRole, router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/auth/login')
    }
  }

  // Navigation items based on user role
  const getNavItems = () => {
    if (!user) return []

    const items = []

    // Super Admin can see everything
    if (user.role === 'super_admin') {
      items.push(
        { name: 'Admin Dashboard', href: '/admin', icon: '🏢' },
        { name: 'User Management', href: '/admin/users', icon: '👥' },
        { name: 'Disbursements', href: '/admin/disbursements', icon: '💰' },
        { name: 'Commissions', href: '/admin/commissions', icon: '💳' },
        { name: 'Applications', href: '/admin/applications', icon: '📋' },
        { name: 'Reports', href: '/admin/reports', icon: '🔍' },
      )
    } else if (user.role === 'admin') {
      items.push(
        { name: 'Dashboard', href: '/admin', icon: '📊' },
        { name: 'User Management', href: '/admin/users', icon: '👥' },
        { name: 'Disbursements', href: '/admin/disbursements', icon: '💰' },
        { name: 'Commissions', href: '/admin/commissions', icon: '💳' },
        { name: 'Applications', href: '/admin/applications', icon: '📋' }
      )
    } else if (user.role === 'operator') {
      items.push(
        { name: 'Dashboard', href: '/operator', icon: '📊' },
        { name: 'Applications', href: '/operator/applications', icon: '📋' },
        { name: 'Documents', href: '/operator/documents', icon: '📄' },
        { name: 'Customers', href: '/operator/customers', icon: '👤' }
      )
    } else if (user.role === 'banker') {
      items.push(
        { name: 'Dashboard', href: '/banker', icon: '📊' },
        { name: 'Applications', href: '/banker/applications', icon: '📋' },
        { name: 'Reports', href: '/banker/reports', icon: '📈' }
      )
    } else if (user.role === 'connector') {
      items.push(
        { name: 'Dashboard', href: '/connector', icon: '📊' },
        { name: 'Customers', href: '/connector/customers', icon: '👤' },
        { name: 'Applications', href: '/connector/applications', icon: '📋' },
        { name: 'Commissions', href: '/connector/commissions', icon: '💳' }
      )
    }

    return items
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-gray-200 fixed w-full top-0 z-40">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LMS</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Loan Management System</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="hidden md:flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
              <div className="h-8 w-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                <p className="text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden md:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="h-full flex flex-col">
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Card at Bottom */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user.role?.replace('_', ' ')}
                </p>
                {user.agent_code && (
                  <p className="text-xs text-blue-600 font-mono">
                    {user.agent_code}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
