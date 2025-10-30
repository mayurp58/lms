import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'
import { verifyToken } from '@/lib/auth/jwt'

export async function GET(request) {
  try {
    // First try to get user info from headers set by proxy
    let userId = request.headers.get('x-user-id')
    let userRole = request.headers.get('x-user-role')
    let userEmail = request.headers.get('x-user-email')

    console.log('🔍 /api/auth/me - Headers:', { userId, userRole, userEmail })

    // If no headers, try to decode token directly
    if (!userId) {
      console.log('🔄 No headers found, trying to decode token directly...')
      
      const token = request.cookies.get('auth-token')?.value
      
      if (!token) {
        return NextResponse.json(
          { success: false, message: 'No authentication token found' },
          { status: 401 }
        )
      }

      try {
        const decoded = verifyToken(token)
        userId = decoded.userId
        userRole = decoded.role
        userEmail = decoded.email
        
        console.log('✅ Token decoded directly:', { userId, userRole, userEmail })
      } catch (tokenError) {
        console.error('❌ Token verification failed:', tokenError.message)
        return NextResponse.json(
          { success: false, message: 'Invalid authentication token' },
          { status: 401 }
        )
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unable to identify user' },
        { status: 401 }
      )
    }

    // Get complete user info from database - using correct column names
    const userResult = await executeQuery(`
      SELECT 
        u.id, u.email, u.role, u.status, u.created_at,
        up.first_name, up.last_name, up.phone, up.address, up.city, up.state, up.pincode
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?
    `, [userId])

    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const user = userResult[0]

    // Get role-specific additional info
    let additionalInfo = {}
    
    switch (user.role) {
      case 'connector':
        const connectorResult = await executeQuery(
          'SELECT agent_code, commission_percentage, total_approved_cases FROM connectors WHERE user_id = ?',
          [userId]
        )
        if (connectorResult.length > 0) {
          additionalInfo = connectorResult[0]
        }
        break
        
      case 'banker':
        const bankerResult = await executeQuery(
          'SELECT employee_id, designation, department, max_approval_limit FROM bankers WHERE user_id = ?',
          [userId]
        )
        if (bankerResult.length > 0) {
          additionalInfo = bankerResult[0]
        }
        break
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status, // Using 'status' instead of 'is_active'
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        created_at: user.created_at,
        ...additionalInfo
      }
    })

  } catch (error) {
    console.error('❌ /api/auth/me error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
