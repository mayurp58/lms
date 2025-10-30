import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function POST(request) {
  try {
    const body = await request.json()
    const { trigger, entity_id, entity_type } = body

    console.log('🔄 Workflow triggered:', { trigger, entity_id, entity_type })

    switch (trigger) {
      case 'document_verified':
        await handleDocumentVerified(entity_id)
        break
      case 'application_approved':
        await handleApplicationApproved(entity_id)
        break
      case 'application_rejected':
        await handleApplicationRejected(entity_id)
        break
      default:
        return NextResponse.json(
          { success: false, message: 'Unknown workflow trigger' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow processed successfully'
    })

  } catch (error) {
    console.error('❌ Workflow error:', error)
    return NextResponse.json(
      { success: false, message: 'Workflow failed: ' + error.message },
      { status: 500 }
    )
  }
}

// Handle when a document is verified - check if all required docs are verified
async function handleDocumentVerified(documentId) {
  try {
    // Get the loan application for this document
    const docResult = await executeQuery(
      'SELECT loan_application_id FROM customer_documents WHERE id = ?',
      [documentId]
    )

    if (docResult.length === 0) return

    const loanApplicationId = docResult[0].loan_application_id

    // Check if all required documents are verified
    const docStatusResult = await executeQuery(`
      SELECT 
        COUNT(CASE WHEN dt.is_required = 1 THEN 1 END) as required_count,
        COUNT(CASE WHEN dt.is_required = 1 AND cd.verification_status = 'verified' THEN 1 END) as verified_required_count,
        COUNT(CASE WHEN cd.verification_status = 'verified' THEN 1 END) as total_verified,
        la.status as current_status
      FROM customer_documents cd
      JOIN document_types dt ON cd.document_type_id = dt.id
      JOIN loan_applications la ON cd.loan_application_id = la.id
      WHERE cd.loan_application_id = ?
      GROUP BY la.id, la.status
    `, [loanApplicationId])

    if (docStatusResult.length === 0) return

    const docStatus = docStatusResult[0]

    console.log('📄 Document verification status:', {
      loanApplicationId,
      required_count: docStatus.required_count,
      verified_required_count: docStatus.verified_required_count,
      current_status: docStatus.current_status
    })

    // If all required documents are verified, move to banker queue
    if (docStatus.required_count > 0 && 
        docStatus.verified_required_count === docStatus.required_count && 
        docStatus.current_status === 'under_verification') {
      
      await executeQuery(
        'UPDATE loan_applications SET status = ? WHERE id = ?',
        ['verified', loanApplicationId]
      )

      // Log the status change
      await executeQuery(
        'INSERT INTO system_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          null, // System action
          'AUTO_STATUS_UPDATE',
          'loan_application',
          loanApplicationId,
          JSON.stringify({ old_status: 'under_verification' }),
          JSON.stringify({ new_status: 'verified', reason: 'all_required_documents_verified' }),
          'system'
        ]
      )

      console.log('✅ Application moved to banker queue:', loanApplicationId)
    }

  } catch (error) {
    console.error('❌ Error in handleDocumentVerified:', error)
  }
}

// Handle when application is approved
async function handleApplicationApproved(applicationId) {
  try {
    const appResult = await executeQuery(
      'SELECT * FROM loan_applications WHERE id = ?',
      [applicationId]
    )

    if (appResult.length === 0) return

    const application = appResult[0]

    // Update connector statistics
    await executeQuery(`
      UPDATE connectors 
      SET total_approved_cases = total_approved_cases + 1,
          total_commission_pending = total_commission_pending + (? * commission_percentage / 100)
      WHERE id = ?
    `, [application.approved_amount, application.connector_id])

    console.log('✅ Updated connector statistics for approval:', application.connector_id)

  } catch (error) {
    console.error('❌ Error in handleApplicationApproved:', error)
  }
}

// Handle when application is rejected
async function handleApplicationRejected(applicationId) {
  try {
    // Could add any rejection-specific logic here
    console.log('📋 Application rejected workflow processed:', applicationId)
  } catch (error) {
    console.error('❌ Error in handleApplicationRejected:', error)
  }
}
