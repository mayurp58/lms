'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function BanksListContent()
{
    const [banks,setBanks] = useState([]);
    const [bankToDelete, setBankToDelete] = useState(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const [filters, setFilters] = useState({
        status: '1'
    })

    const searchParams = useSearchParams()

    useEffect(() => {
        fetchBanks()
      }, [filters])


    const fetchBanks = async () => {
        setLoading(true)
        try {
          const params = new URLSearchParams()
          Object.keys(filters).forEach(key => {
            if (filters[key]) params.append(key, filters[key])
          })
    
          const res = await fetch(`/api/admin/banks?${params}`)
          const data = await res.json()
    
          if (data.success) {
            setBanks(data.data)
          } else {
            console.error('Failed to fetch applications:', data.message)
          }
        } catch (error) {
          console.error('Error fetching applications:', error)
        }
        setLoading(false)
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
          ...prev,
          [key]: value,
        }))
    }

    const handleDeleteBank = async () => {
        if (!bankToDelete) return
    
        try {
          const res = await fetch(`/api/admin/banks/${bankToDelete.id}`, {
            method: 'DELETE'
          })
          
          const data = await res.json()
          if (data.success) {
            fetchBanks() // Refresh the list
            setDeleteModalOpen(false)
            setBankToDelete(null)
          } else {
            alert('Failed to delete bank: ' + data.message)
          }
        } catch (error) {
          alert('Error deleting bank: ' + error.message)
        }
    }

    async function activateBank(id)
    {

        if (!id) return
        try {
            const res = await fetch(`/api/admin/banks/${id}`, {
              method: 'POST'
            })
            
            const data = await res.json()
            if (data.success) {
                fetchBanks()
            } else {
              alert('Failed to activate bank: ' + data.message)
            }
          } catch (error) {
            console.error(error)
            alert('Error activating bank: ' + error.message)
          }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                    Manage all banks and finance companies here
                    </p>
                </div>
                <Link
                    href="/admin/banks/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Bank
                </Link>
            </div>
            {/* Status Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                {[
                    { key: '1', label: 'Active Banks', color: 'blue' },
                    { key: '0', label: 'Disabled', color: 'gray' }
                ].map((tab) => (
                    <button
                    key={tab.key}
                    onClick={() => handleFilterChange('status', tab.key)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        filters.status === tab.key
                        ? `border-${tab.color}-500 text-${tab.color}-600`
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    >
                    {tab.label}
                    </button>
                ))}
                </nav>
            </div>

            {/* Banks List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {filters.status === '1' ? 'Active Banks' : 'Inactive Banks'} ({banks.length || 0})
                </h3>
                
                {loading ? (
                    <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading banks...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                                Bank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                                Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                                Actions
                            </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {banks.map((bnk) => {
                            
                            
                            return (
                                <tr key={bnk.id} className="hover:bg-gray-50">
                                    <td className="px-6 text-gray-900 py-4 whitespace-nowrap">
                                        {bnk.name}
                                    </td>
                                    <td className="px-6 text-gray-900 py-4 whitespace-nowrap">
                                        {bnk.code}
                                    </td>
                                    <td className="px-6 text-gray-900 py-4 whitespace-nowrap">
                                        {bnk.is_active=="1" ? <div className="flex space-x-2">
                                           
                                            <Link
                                            href={`/admin/banks/${bnk.id}/edit`}
                                            className="text-indigo-600 hover:text-indigo-900"
                                            >
                                            Edit
                                            </Link>
                                            <button
                                            onClick={() => {
                                                setBankToDelete(bnk)
                                                setDeleteModalOpen(true)
                                            }}
                                            className="text-red-600 hover:text-red-900"
                                            >
                                            Delete
                                            </button>
                                        </div> : <div className="flex space-x-2">
                                           
                                           <button
                                           onClick={() => 
                                               activateBank(bnk.id)
                                           }
                                           className="text-red-600 hover:text-red-900"
                                           >
                                           Activate
                                           </button>
                                       </div>}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                        </table>
                    </div>
                    {banks.length === 0 && (
                        <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No banks found</h3>
                       
                        </div>
                    )}
                    </div>
                )}
                </div>

            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete Bank</h3>
                    <div className="mt-2 px-7 py-3">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete <strong>{bankToDelete?.name}</strong>? 
                        This action will deactivate the bank.
                      </p>
                    </div>
                    <div className="items-center px-4 py-3">
                      <button
                        onClick={handleDeleteBank}
                        className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                      >
                        Delete Bank
                      </button>
                      <button
                        onClick={() => {
                          setDeleteModalOpen(false)
                          setBankToDelete(null)
                        }}
                        className="mt-3 px-4 py-2 bg-white text-gray-500 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        
    )
}
export default function banksList()
{
    return (
        <DashboardLayout requiredRole="super_admin">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }>
            <BanksListContent />
          </Suspense>
        </DashboardLayout>
      )
}