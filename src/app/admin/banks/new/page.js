'use client'

import React,{ useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'

export default function EditBanksPage({ params }) {
  const renderedParams = React.use(params)
  const id = renderedParams.id
  const [bank, setBank] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });

  

  const handleSubmit = async (e) => {
    e.preventDefault() // prevent the default page reload
  
    try {
      const res = await fetch(`/api/admin/banks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
  
      const data = await res.json()
  
      if (data.success) {
        router.push(`/admin/banks`)
      } else {
        setErrors(data.errors || {})
        throw new Error(data.message)
      }
    } catch (error) {
      console.error(error)
    }
  }
  

  const handleCancel = () => {
    router.push(`/admin/banks`)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when bank starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
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


  return (
    <DashboardLayout requiredRole="super_admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Bank</h1>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {errors.general}
                    </div>
                )}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder='Bank Name'
                            className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Code *</label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                            placeholder='First Code'
                            className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        />
                        {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                    </div>
                </div>
                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                    Cancel
                    </button>
                    <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {loading ? 'Saving...' : 'Create Bank'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
