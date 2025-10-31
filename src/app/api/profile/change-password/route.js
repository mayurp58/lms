import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { current_password, new_password } = await request.json()

    if (!current_password || !new_password) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Get current user password
    const userQuery = 'SELECT password_hash FROM users WHERE id = ?'
    const userResult = await executeQuery(userQuery, [userId])
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const user = userResult[0]

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(new_password, user.password_hash)
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, message: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10)

    // Update password
    const updateQuery = 'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?'
    console.log(updateQuery)
    await executeQuery(updateQuery, [hashedPassword, userId])

    // Log the activity
    const logQuery = `
      INSERT INTO system_logs (
        user_id, action, entity_type, entity_id, 
        new_values, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `

    await executeQuery(logQuery, [
      userId,
      'PASSWORD_CHANGE',
      'user',
      userId,
      JSON.stringify({ action: 'password_changed' }),
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to change password: ' + error.message },
      { status: 500 }
    )
  }
}
