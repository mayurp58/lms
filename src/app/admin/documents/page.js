'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function DocumentListContent() {
    const [documents, setDocuments] = useState([]);
    const [documentsToDelete, setDocumentsToDelete] = useState(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const [filters, setFilters] = useState({
        status: '1'
    })

    const searchParams = useSearchParams()

    useEffect(() => {
        fetchDocuments()
    }, [filters])


    const fetchDocuments = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key])
            })

            const res = await fetch(`/api/admin/documents?${params}`)
            const data = await res.json()

            if (data.success) {
                setDocuments(data.data)
            } else {
                console.error('Failed to fetch documents:', data.message)
            }
        } catch (error) {
            console.error('Error fetching documents:', error)
        }
        setLoading(false)
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
        }))
    }

    const handleDeleteDocument = async () => {
        if (!documentsToDelete) return

        try {
            const res = await fetch(`/api/admin/documents/${documentsToDelete.id}`, {
                method: 'DELETE'
            })

            const data = await res.json()
            if (data.success) {
                fetchDocuments() // Refresh the list
                setDeleteModalOpen(false)
                setDocumentsToDelete(null)
            } else {
                alert('Failed to delete document: ' + data.message)
            }
        } catch (error) {
            alert('Error deleting document: ' + error.message)
        }
    }



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Documents List</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        List Of Documents Required
                    </p>
                </div>
                <Link
                    href="/admin/documents/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Document
                </Link>
            </div>


            {/* Documents List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Documents List ({documents.length || 0})
                    </h3>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                                                Document
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                                                Is Required
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                                                Is PDD
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {documents.map((doc) => {


                                            return (
                                                <tr key={doc.id} className="hover:bg-gray-50">
                                                    <td className="px-6 text-gray-900 py-4 whitespace-nowrap">
                                                        {doc.name}
                                                    </td>
                                                    <td className="px-6 text-gray-900 py-4 whitespace-nowrap">
                                                        {doc.description}
                                                    </td>
                                                    <td className="px-6 text-gray-900 py-4 whitespace-nowrap">
                                                        {doc.is_required == "1" ? "Yes" : "No"}
                                                    </td>
                                                    <td className="px-6 text-gray-900 py-4 whitespace-nowrap">
                                                        {doc.is_pdd ? "Yes" : "No"}
                                                    </td>
                                                    <td className="px-6 text-gray-900 py-4 whitespace-nowrap">
                                                        <div className="flex space-x-2">

                                                            <Link
                                                                href={`/admin/documents/${doc.id}/edit`}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <button
                                                                onClick={() => {
                                                                    setDocumentsToDelete(doc)
                                                                    setDeleteModalOpen(true)
                                                                }}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {documents.length === 0 && (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>

                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {deleteModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete Document Type</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete <strong>{documentsToDelete?.name}</strong>?
                                    This action will delete this document type.
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    onClick={handleDeleteDocument}
                                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                                >
                                    Delete Document Type
                                </button>
                                <button
                                    onClick={() => {
                                        setDeleteModalOpen(false)
                                        setDocumentsToDelete(null)
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
export default function DocumentsList() {
    return (
        <DashboardLayout requiredRole="super_admin">
            <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            }>
                <DocumentListContent />
            </Suspense>
        </DashboardLayout>
    )
}