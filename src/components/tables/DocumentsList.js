'use client'

import { useState, useEffect, useRef } from 'react'
import { formatDate, getStatusColor } from '@/lib/utils'

export default function DocumentsList({ customerId, loanApplicationId }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchDocuments()
  }, [customerId, loanApplicationId])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (customerId) params.append('customerId', customerId)
      if (loanApplicationId) params.append('loanApplicationId', loanApplicationId)
      const res = await fetch(`/api/documents?${params}`)
      const data = await res.json()
      if (data.success) setDocuments(data.data)
      else console.error('Failed to fetch documents:', data.message)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
    setLoading(false)
  }

  const handleDocumentUpload = (doc) => {
    setSelectedDoc(doc)
    setShowModal(true)
    setSelectedFile(null)
    setError('')
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedDoc) {
      setError('Please select a file to upload')
      return
    }

    setUploading(true)
    setError('')
    console.log(selectedDoc)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('loanApplicationId', loanApplicationId)
      formData.append('customerId', customerId)
      formData.append('documentTypeId', selectedDoc.document_type_id) // auto-use same doc type
      formData.append('existingDocumentId', selectedDoc.id) // optional if your API supports update

      const res = await fetch('/api/reupload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setShowModal(false)
        fetchDocuments()
      } else {
        setError(data.message || 'Upload failed')
      }
    } catch (err) {
      setError('Upload failed: ' + err.message)
    }

    setUploading(false)
  }

  const formatFileSize = (sizeKB) => {
    if (sizeKB < 1024) return `${sizeKB} KB`
    return `${(sizeKB / 1024).toFixed(1)} MB`
  }

  const getVerificationStatusIcon = (status) => {
    const icons = {
      pending: (
        <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      verified: (
        <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      rejected: (
        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    return icons[status] || icons.pending
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No documents uploaded</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Documents ({documents.length})
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remark</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{doc.file_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{doc.document_type_name}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center">
                            {getVerificationStatusIcon(doc.verification_status)}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.verification_status)}`}>
                              {doc.verification_status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-red-500">{doc.rejection_reason}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatFileSize(doc.file_size_kb)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(doc.uploaded_at)}</td>
                        <td className="px-6 py-4 text-sm">
                          {doc.verification_status === 'rejected' ? (
                            <button
                              onClick={() => { handleDocumentUpload(doc); setSelectedDoc(doc)}}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                              Re-upload
                            </button>
                          ) : (
                            <a href={doc.file_path} download={doc.file_name} className="text-blue-600 hover:text-blue-900">
                              Download
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for re-upload */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-medium text-gray-900">Re-upload {selectedDoc?.document_type_name}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm mb-3">
                {error}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="w-full text-sm text-gray-900 border border-gray-300 rounded-md p-2 mb-4"
            />

            {selectedFile && (
              <div className="p-3 bg-gray-50 rounded-md text-sm mb-3">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-gray-500 text-xs">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
