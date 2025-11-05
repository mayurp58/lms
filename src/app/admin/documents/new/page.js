'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'

export default function CreateDocumentsPage() {

  const router = useRouter();
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_required: false,
  })

 

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const res = await fetch(`/api/admin/documents/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/admin/documents')
      } else {
        setErrors(data.errors || {})
        throw new Error(data.message)
      }
    } catch (err) {
      console.error('Error updating document:', err)
    }
  }

  const handleCancel = () => {
    router.push('/admin/documents')
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    const newValue = type === 'radio' ? value === 'true' : value
    setFormData((prev) => ({ ...prev, [name]: newValue }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Document</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update information for {document.name}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                {/* Document Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Document Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter document name"
                    className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter description"
                    rows={3}
                    className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Is Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Is Required *
                  </label>
                  <div className="mt-2 flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_required"
                        value="true"
                        checked={formData.is_required === true}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_required"
                        value="false"
                        checked={formData.is_required === false}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  {errors.is_required && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.is_required}
                    </p>
                  )}
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
                  {loading ? 'Saving...' : 'Update Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
