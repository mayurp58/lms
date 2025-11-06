import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'
export async function GET(request,{params}) {
    try {
      const userId = request.headers.get('x-user-id')
      const userRole = request.headers.get('x-user-role')
      const { bankId, cityName } = await params
  
      if (!userId || userRole !== 'operator') {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        )
      }
  
      // Get all active banks
      const citiesQuery = `SELECT 
        b.id,
        b.branch as name,
        b.branch_code,
        CONCAT(b.branch, ', ', b.city, ', ', b.state, ' - ', b.pincode) as address,
        CONCAT(up.first_name, ' ', up.last_name) as banker_name,
        up.phone as contact_phone,
        b.user_id,
        u.email as contact_email,
        b.designation,
        b.department
      FROM bankers b
      JOIN users u ON b.user_id = u.id
      JOIN user_profiles up ON up.user_id = u.id
      WHERE b.bank_id = ? AND b.city = ?
      ORDER BY b.branch ASC`
  
      const branches = await executeQuery(citiesQuery,[bankId, cityName])

      const formattedBranches = branches.map(branch => ({
        id: branch.id,
        name: branch.name,
        address: branch.address,
        ifsc_code: branch.branch_code, // Using branch_code as IFSC for now
        contact_phone: branch.contact_phone,
        contact_email: branch.contact_email,
        banker_user_id:branch.user_id,
        banker_name: branch.banker_name,
        designation: branch.designation,
        department: branch.department
      }));

      return NextResponse.json({
        success: true,
        data: formattedBranches
      })
  
    } catch (error) {
      console.error('Get banks branches error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch banks branches: ' + error.message },
        { status: 500 }
      )
    }
  }