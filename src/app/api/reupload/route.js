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
    const documentId = data.get('existingDocumentId')

    if (!file || !loanApplicationId || !customerId || !documentId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 🔐 Verify access if user is connector
    if (userRole === 'connector') {
      const connector = await executeQuery(
        'SELECT id FROM connectors WHERE user_id = ?',
        [userId]
      )

      if (connector.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Connector not found' },
          { status: 404 }
        )
      }

      const hasAccess = await executeQuery(
        'SELECT id FROM loan_applications WHERE id = ? AND connector_id = ?',
        [loanApplicationId, connector[0].id]
      )

      if (hasAccess.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Access denied for this loan application' },
          { status: 403 }
        )
      }
    }

    // 📄 Verify document exists
    const existingDocs = await executeQuery(
      `SELECT id, document_type_id, file_name, file_path 
       FROM customer_documents 
       WHERE id = ? AND loan_application_id = ? AND customer_id = ?`,
      [documentId, loanApplicationId, customerId]
    )

    console.log(documentId, loanApplicationId, customerId)

    if (existingDocs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    const existingDoc = existingDocs[0]
    const documentTypeId = existingDoc.document_type_id

    // 📋 Fetch document type for validation
    const [docType] = await executeQuery(
      'SELECT name, max_file_size_mb, allowed_formats FROM document_types WHERE id = ?',
      [documentTypeId]
    )

    if (!docType) {
      return NextResponse.json(
        { success: false, message: 'Invalid document type' },
        { status: 400 }
      )
    }

    const maxSizeMB = docType.max_file_size_mb
    const allowedFormats = docType.allowed_formats.split(',').map(f => f.trim().toLowerCase())

    // ✅ Validate file
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const fileSizeKB = Math.round(file.size / 1024)
    const fileSizeMB = file.size / (1024 * 1024)

    if (fileSizeMB > maxSizeMB) {
      return NextResponse.json(
        { success: false, message: `File size exceeds ${maxSizeMB}MB limit` },
        { status: 400 }
      )
    }

    if (!allowedFormats.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, message: `Invalid file format. Allowed: ${allowedFormats.join(', ')}` },
        { status: 400 }
      )
    }

    // 🧾 Generate file name and save
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${loanApplicationId}_${documentTypeId}_${timestamp}_${sanitizedName}`

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents')
    await mkdir(uploadDir, { recursive: true })

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, fileBuffer)

    // 🗂️ Update existing document record
    await executeQuery(
      `UPDATE customer_documents 
       SET file_name = ?, file_path = ?, file_size_kb = ?, 
           verification_status = 'pending', rejection_reason = NULL, uploaded_at = NOW()
       WHERE id = ?`,
      [file.name, `/uploads/documents/${filename}`, fileSizeKB, documentId]
    )

    // 🟩 Update loan application status
    await executeQuery(
      `UPDATE loan_applications 
       SET status = 'submitted', updated_at = NOW()
       WHERE id = ?`,
      [loanApplicationId]
    )

    // 🧾 Log system event
    await executeQuery(
      `INSERT INTO system_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
       VALUES (?, 'DOCUMENT_REUPLOADED', 'document', ?, ?, ?)`,
      [
        userId,
        documentId,
        JSON.stringify({
          document_id: documentId,
          document_type: docType.name,
          filename,
        }),
        request.headers.get('x-forwarded-for') || 'unknown',
      ]
    )

    // ✅ Success
    return NextResponse.json({
      success: true,
      message: 'Document re-uploaded successfully and loan application resubmitted',
      data: {
        documentId,
        fileName: file.name,
        filePath: `/uploads/documents/${filename}`,
        fileSizeKB,
      },
    })

  } catch (error) {
    console.error('❌ Reupload error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to re-upload document: ' + error.message },
      { status: 500 }
    )
  }
}
