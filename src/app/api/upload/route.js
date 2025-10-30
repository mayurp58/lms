import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { executeQuery } from '@/lib/db/mysql'

export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.formData()
    const file = data.get('file')
    const loanApplicationId = data.get('loanApplicationId')
    const customerId = data.get('customerId')
    const documentTypeId = data.get('documentTypeId')

    if (!file || !loanApplicationId || !documentTypeId) {
      return NextResponse.json(
        { success: false, message: 'File, loan application ID, and document type are required' },
        { status: 400 }
      )
    }

    // Verify loan application access
    if (userRole === 'connector') {
      const connectorResult = await executeQuery(
        'SELECT id FROM connectors WHERE user_id = ?',
        [userId]
      )
      
      if (connectorResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Connector not found' },
          { status: 404 }
        )
      }

      const applicationCheck = await executeQuery(
        'SELECT id FROM loan_applications WHERE id = ? AND connector_id = ?',
        [loanApplicationId, connectorResult[0].id]
      )

      if (applicationCheck.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Loan application not found or access denied' },
          { status: 403 }
        )
      }
    }

    // Get document type info
    const docTypeResult = await executeQuery(
      'SELECT name, max_file_size_mb, allowed_formats FROM document_types WHERE id = ?',
      [documentTypeId]
    )

    if (docTypeResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid document type' },
        { status: 400 }
      )
    }

    const docType = docTypeResult[0]
    const maxSizeMB = docType.max_file_size_mb
    const allowedFormats = docType.allowed_formats.split(',')

    // Validate file size
    const fileSizeKB = Math.round(file.size / 1024)
    const fileSizeMB = Math.round(file.size / (1024 * 1024))

    if (fileSizeMB > maxSizeMB) {
      return NextResponse.json(
        { success: false, message: `File size exceeds ${maxSizeMB}MB limit` },
        { status: 400 }
      )
    }

    // Validate file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!allowedFormats.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, message: `Invalid file format. Allowed: ${allowedFormats.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${loanApplicationId}_${documentTypeId}_${timestamp}_${sanitizedOriginalName}`
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents')
    
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's ok
    }
    
    const filePath = join(uploadDir, filename)
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)

    // Save to database
    const result = await executeQuery(
      `INSERT INTO customer_documents 
       (loan_application_id, customer_id, document_type_id, file_name, file_path, file_size_kb, verification_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [loanApplicationId, customerId, documentTypeId, file.name, `/uploads/documents/${filename}`, fileSizeKB, 'pending']
    )

    // Log activity
    await executeQuery(
      'INSERT INTO system_logs (user_id, action, entity_type, entity_id, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [
        userId,
        'DOCUMENT_UPLOADED',
        'document',
        result.insertId,
        JSON.stringify({ loan_application_id: loanApplicationId, document_type: docType.name, filename }),
        request.headers.get('x-forwarded-for') || 'unknown'
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        documentId: result.insertId,
        fileName: file.name,
        filePath: `/uploads/documents/${filename}`,
        fileSize: fileSizeKB
      }
    })

  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to upload document: ' + error.message },
      { status: 500 }
    )
  }
}
