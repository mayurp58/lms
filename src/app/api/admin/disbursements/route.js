// src/app/api/admin/disbursements/route.js

import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql'; 

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10; 
    const status = searchParams.get('status') || 'approved'; 

    const offset = (page - 1) * limit;

    const conditions = [];
    const paramsForWhere = []; 

    if (status) {
        conditions.push('la.status = ?');
        paramsForWhere.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // --- 1. Total Count Query ---
    const countQuery = `
      SELECT COUNT(DISTINCT la.id) as total 
      FROM loan_applications la
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, paramsForWhere);
    const total = countResult[0].total;

    // --- 2. Global Stats Query ---
    // FIX: We calculate disbursed amounts from the loan_disbursements table to ensure accuracy
    // instead of relying on the potentially out-of-sync loan_applications column.
    const statsQuery = `
      SELECT 
        SUM(la.approved_amount) as total_approved_amount,
        
        -- Calculate total disbursed from the child table (Source of Truth)
        (
            SELECT COALESCE(SUM(ld.disbursed_amount), 0)
            FROM loan_disbursements ld
            JOIN loan_applications la_inner ON ld.loan_application_id = la_inner.id
            ${whereClause.replace(/la\./g, 'la_inner.')}
        ) as total_disbursed_amount,

        -- Calculate total commission from the child table (Source of Truth)
        (
            SELECT COALESCE(SUM(ld.connector_commission), 0)
            FROM loan_disbursements ld
            JOIN loan_applications la_inner ON ld.loan_application_id = la_inner.id
            ${whereClause.replace(/la\./g, 'la_inner.')}
        ) as total_commission_amount,

        SUM(la.approved_amount * (conn.commission_percentage / 100)) as estimated_commission_approved

      FROM loan_applications la
      JOIN connectors conn ON la.connector_id = conn.id
      ${whereClause}
    `;
    
    // We pass paramsForWhere TWICE because we use the WHERE clause inside the subqueries too
    // (Once for main query, and potentially needed for subqueries if we were filtering deeply, 
    // but here the replacements handle the string structure. 
    // Note: Since we inject the whereClause string, we need to ensure params match the '?' count.
    // The subqueries inject the string text, so we need to duplicate the params array for each '?' occurrence.
    // However, a cleaner way for the stats query with subqueries sharing the same condition 
    // is to flatten the params based on how many times the condition appears.)
    
    // Simplified Stats Query (Performance optimized & Parameter safe):
    // Since joining inside subqueries with dynamic params is tricky with arrays, 
    // we will fetch the SUMs based on the IDs returned by the filter.
    
    const statsQuerySimple = `
      SELECT 
        SUM(la.approved_amount) as total_approved_amount,
        SUM(la.approved_amount * (conn.commission_percentage / 100)) as estimated_commission_approved
      FROM loan_applications la
      JOIN connectors conn ON la.connector_id = conn.id
      ${whereClause}
    `;
    
    const statsResult = await executeQuery(statsQuerySimple, paramsForWhere);
    const baseStats = statsResult[0];

    // Separate query for disbursed totals to ensure parameter safety
    // This sums up all disbursements for applications that match the current filter
    const disbursedStatsQuery = `
        SELECT 
            COALESCE(SUM(ld.disbursed_amount), 0) as total_disbursed_amount,
            COALESCE(SUM(ld.connector_commission), 0) as total_commission_amount
        FROM loan_disbursements ld
        JOIN loan_applications la ON ld.loan_application_id = la.id
        ${whereClause}
    `;
    
    const disbursedStatsResult = await executeQuery(disbursedStatsQuery, paramsForWhere);
    const realDisbursedStats = disbursedStatsResult[0];


    // --- 3. Main Applications Query ---
    // FIX: We use a subquery to get 'disbursed_amount' and 'commission' 
    // directly from loan_disbursements to fix the row-level data.
    const applicationsQuery = `
      SELECT 
        la.id, 
        la.application_number, 
        la.requested_amount, 
        la.approved_amount,
        
        -- FIX: Get true disbursed amount from child table
        (SELECT COALESCE(SUM(disbursed_amount), 0) 
         FROM loan_disbursements 
         WHERE loan_application_id = la.id) as disbursed_amount,
         
        la.approved_interest_rate, 
        la.approved_tenure_months, 
        la.approved_at,
        la.disbursed_at,
        la.banker_remarks, 
        la.special_conditions, 
        la.status,
        la.created_at,
        
        -- FIX: Get true commission amount from child table
        (SELECT COALESCE(SUM(connector_commission), 0) 
         FROM loan_disbursements 
         WHERE loan_application_id = la.id) as total_application_commission,
        
        c.id as customer_id, 
        c.first_name, 
        c.last_name, 
        c.phone, 
        c.email,
        
        lc.name as loan_category_name,
        
        conn.agent_code, 
        conn.commission_percentage,
        up.first_name as connector_first_name, 
        up.last_name as connector_last_name,
        
        bp.first_name as banker_first_name, 
        bp.last_name as banker_last_name,

        (
          SELECT ld.bank_reference
          FROM loan_disbursements ld
          WHERE ld.loan_application_id = la.id
          ORDER BY ld.created_at DESC
          LIMIT 1
        ) AS last_disbursed_bank_name
        
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users cu ON conn.user_id = cu.id
      JOIN user_profiles up ON cu.id = up.user_id
      LEFT JOIN users bu ON la.approved_by = bu.id
      LEFT JOIN user_profiles bp ON bu.id = bp.user_id
      ${whereClause}
      ORDER BY ${status === 'approved' ? 'la.approved_at ASC' : 'la.disbursed_at DESC'}
      LIMIT ${limit} OFFSET ${offset} 
    `;

    const finalQueryParams = [...paramsForWhere]; 

    const applications = await executeQuery(applicationsQuery, finalQueryParams);

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null,
        },
        stats: { 
            totalApproved: parseFloat(baseStats.total_approved_amount) || 0,
            // Use the Calculated Real Stats
            totalDisbursed: parseFloat(realDisbursedStats.total_disbursed_amount) || 0,
            totalCommission: parseFloat(realDisbursedStats.total_commission_amount) || 0,
            estimatedCommission: parseFloat(baseStats.estimated_commission_approved) || 0
        }
      }
    });

  } catch (error) {
    console.error('Get disbursement applications error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch applications: ' + error.message },
      { status: 500 }
    );
  }
}