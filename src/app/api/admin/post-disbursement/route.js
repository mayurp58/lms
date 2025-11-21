import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'pending' 

    // We only include applications that are fully 'disbursed' (status='disbursed') and are Auto Loans (for RTO processing)
    let query = `
      SELECT 
        la.id, la.application_number, la.disbursed_amount, la.disbursed_at,
        la.loan_category_id, lc.name as category_name,
        c.first_name, c.last_name, c.phone, c.city,
        la.vehicle_reg_number,
        pdc.id as pd_id, pdc.status as pd_status, pdc.rc_status, pdc.remarks, pdc.rto_agent_id,
        ra.name as agent_name, ra.phone as agent_phone
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      LEFT JOIN post_disbursement_cases pdc ON la.id = pdc.loan_application_id
      LEFT JOIN rto_agents ra ON pdc.rto_agent_id = ra.id
      WHERE la.status = 'disbursed' AND la.loan_category_id IN (3, 6) -- Filter for Auto/Used Auto Loans
    `

    // Filter by case status
    if (filter === 'pending') {
        // Show cases that are either newly disbursed OR are in process but not completed
        query += ` AND (pdc.status IS NULL OR pdc.status != 'completed')`
    } else if (filter === 'completed') {
        query += ` AND pdc.status = 'completed'`
    }

    query += ` ORDER BY la.disbursed_at DESC`

    const cases = await executeQuery(query)
    return NextResponse.json({ success: true, data: cases })
  } catch (error) {
    console.error('Post Disbursement GET Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
    try {
        const body = await request.json()
        const { loan_application_id, rto_agent_id, status, rc_status, remarks } = body

        if (!loan_application_id) {
             return NextResponse.json({ success: false, message: "Missing application ID" }, { status: 400 })
        }

        // --- DYNAMIC PARAMETER CONSTRUCTION ---
        let setClauses = []
        let updateParams = []
        let insertFields = []
        let insertPlaceholders = []
        let insertValues = []
        
        const isAgentBeingAssigned = rto_agent_id && rto_agent_id !== 0 && rto_agent_id !== '0';
        let finalStatus = status;

        // If a status is provided, use it, otherwise keep the default logic.
        if (isAgentBeingAssigned && !status) {
             finalStatus = 'agent_assigned';
        }

        // 1. Determine SET clauses for UPDATE
        if (finalStatus) {
            setClauses.push('status = ?');
            updateParams.push(finalStatus);
        }
        
        if (rc_status) {
            setClauses.push('rc_status = ?');
            updateParams.push(rc_status);
        }
        if (remarks) {
            setClauses.push('remarks = ?');
            updateParams.push(remarks);
        }

        // Handle Agent Assignment/Update
        if (isAgentBeingAssigned) {
            setClauses.push('rto_agent_id = ?');
            updateParams.push(rto_agent_id);
            // Use NOW() directly in SET clause (non-parameterized)
            setClauses.push('assigned_at = NOW()'); 
        } else if (rto_agent_id === 0 || rto_agent_id === '0') {
             // Explicitly unassign agent
             setClauses.push('rto_agent_id = NULL');
        }

        // Handle completion
        if (finalStatus === 'completed') {
            setClauses.push('completed_at = NOW()');
        }
        
        setClauses.push('updated_at = NOW()');

        // Check if record exists
        const existing = await executeQuery(
            'SELECT id FROM post_disbursement_cases WHERE loan_application_id = ?', 
            [loan_application_id]
        )

        if (existing.length === 0) {
            // --- INSERT LOGIC ---
            
            // Core fields for INSERT
            insertFields.push('loan_application_id', 'status', 'rc_status', 'remarks');
            insertPlaceholders.push('?', '?', '?', '?');
            insertValues.push(loan_application_id, finalStatus || 'pending', rc_status || 'pending', remarks);
            
            // Agent/Assignment fields
            if (isAgentBeingAssigned) {
                insertFields.push('rto_agent_id', 'assigned_at');
                insertPlaceholders.push('?', 'NOW()'); // NOW() is raw SQL
                insertValues.push(rto_agent_id); 
            } else {
                 insertFields.push('assigned_at');
                 insertPlaceholders.push('NULL'); // NULL is raw SQL
            }

            // Remove string parameters from placeholders array for raw SQL
            const finalInsertQuery = `INSERT INTO post_disbursement_cases 
                (${insertFields.join(', ')}) 
                VALUES (${insertPlaceholders.join(', ')})`
                // Clean up any remaining parameterized NOW() or NULL by substituting them out:
                .replace(/\'NOW\(\)\'/g, 'NOW()') 
                .replace(/\'NULL\'/g, 'NULL');
            
            await executeQuery(finalInsertQuery, insertValues);

        } else {
            // --- UPDATE LOGIC ---
            const setStatement = setClauses.join(', ');
            updateParams.push(loan_application_id); // The WHERE condition
            
            // Clean up the set statement for raw SQL functions/keywords
            const finalUpdateQuery = `UPDATE post_disbursement_cases SET ${setStatement} WHERE loan_application_id = ?`
                .replace(/\'NOW\(\)\'/g, 'NOW()')
                .replace(/rto_agent_id = NULL/g, 'rto_agent_id = NULL');

            await executeQuery(finalUpdateQuery, updateParams);
        }

        return NextResponse.json({ success: true, message: "Post Disbursement Case Updated Successfully" })
    } catch (error) {
        console.error('Post Disbursement PUT Error:', error);
        return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: 500 })
    }
}