'use client'

import { useState, useEffect } from 'react'

export default function DocumentUploadForm({ customerId, onUploadComplete }) {
  const [documentTypes, setDocumentTypes] = useState([])
  const [selectedDocType, setSelectedDocType] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(true)

  //console.log('📤 DocumentUploadForm initialized with customerId:', customerId)

  useEffect(() => {
    fetchDocumentTypes()
  }, [])

  const fetchDocumentTypes = async () => {
    try {
      //console.log('📋 Fetching document types...')
      const res = await fetch('/api/document-types')
      const data = await res.json()
      //console.log('📋 Document types response:', data)
      
      if (data.success) {
        setDocumentTypes(data.data)
        //console.log('📋 Document types loaded:', data.data.length)
      } else {
        setError('Failed to load document types: ' + data.message)
      }
    } catch (error) {
      console.error('Error fetching document types:', error)
      setError('Failed to load document types')
    }
    setLoading(false)
  }

  const handleFileSelect = (file) => {
    //console.log('📁 File selected:', { name: file.name, size: file.size, type: file.type })
    setSelectedFile(file)
    setError('')
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      setError('Please select both file and document type')
      return
    }

    /*console.log('🚀 Starting upload:', {
      customerId,
      documentTypeId: selectedDocType,
      fileName: selectedFile.name,
      fileSize: selectedFile.size
    })*/

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('customerId', customerId)
      formData.append('documentTypeId', selectedDocType)

      //console.log('📤 Sending upload request...')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      //console.log('📤 Upload response status:', res.status)

      const data = await res.json()
      //console.log('📤 Upload response data:', data)

      if (data.success) {
        //console.log('✅ Upload successful:', data.data)
        setSelectedFile(null)
        setSelectedDocType('')
        if (onUploadComplete) {
          onUploadComplete(data.data)
        }
      } else {
        console.error('❌ Upload failed:', data.message)
        setError(data.message)
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
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
          Upload File *
        </label>
        
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.jpg,.jpeg,.png"
          />
          
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>
                {' '}or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG up to {selectedDocTypeInfo?.max_file_size_mb || 10}MB
              </p>
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
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
