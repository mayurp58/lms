'use client'

import { useState, useEffect } from 'react'

export default function SimpleDocumentUploadForm({ loanApplicationId, customerId, onUploadComplete }) {
  const [documentTypes, setDocumentTypes] = useState([])
  const [selectedDocType, setSelectedDocType] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocumentTypes()
  }, [])

  const fetchDocumentTypes = async () => {
    try {
      const res = await fetch('/api/document-types')
      const data = await res.json()
      
      if (data.success) {
        setDocumentTypes(data.data)
      } else {
        setError('Failed to load document types: ' + data.message)
      }
    } catch (error) {
      console.error('Error fetching document types:', error)
      setError('Failed to load document types')
    }
    setLoading(false)
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      setError('Please select both file and document type')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('loanApplicationId', loanApplicationId)
      formData.append('customerId', customerId)
      formData.append('documentTypeId', selectedDocType)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setSelectedFile(null)
        setSelectedDocType('')
        // Reset file input
        const fileInput = document.getElementById('file-upload')
        if (fileInput) fileInput.value = ''
        
        if (onUploadComplete) {
          onUploadComplete(data.data)
        }
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Upload failed: ' + error.message)
    }

    setUploading(false)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const selectedDocTypeInfo = documentTypes.find(dt => dt.id.toString() === selectedDocType)

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading document types...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type *
        </label>
        <select
          value={selectedDocType}
          onChange={(e) => setSelectedDocType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        >
          <option value="">Select document type</option>
          {documentTypes.map((docType) => (
            <option key={docType.id} value={docType.id}>
              {docType.name} {docType.is_required ? '(Required)' : '(Optional)'}
            </option>
          ))}
        </select>
        
        {selectedDocTypeInfo && (
          <p className="mt-2 text-sm text-gray-600">
            {selectedDocTypeInfo.description} 
            <br />
            <span className="text-xs">
              Max size: {selectedDocTypeInfo.max_file_size_mb}MB | 
              Formats: {selectedDocTypeInfo.allowed_formats}
            </span>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select File *
        </label>
        <input
          style={{ position: 'relative', zIndex: 50 }}
          id="file-upload"
          type="file"
          onChange={handleFileInput}
          accept=".pdf,.jpg,.jpeg,.png"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        {selectedFile && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null)
                  const fileInput = document.getElementById('file-upload')
                  if (fileInput) fileInput.value = ''
                }}
                className="text-red-600 hover:text-red-800"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || !selectedDocType || uploading}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>
    </div>
  )
}
