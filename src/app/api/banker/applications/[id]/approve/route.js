// Add this after the successful approval/rejection update:

// Trigger workflow
try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/system/workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger: action === 'approve' ? 'application_approved' : 'application_rejected',
        entity_id: id,
        entity_type: 'loan_application'
      })
    })
  } catch (workflowError) {
    console.error('⚠️ Workflow trigger failed:', workflowError)
    // Don't fail the main operation if workflow fails
  }
  