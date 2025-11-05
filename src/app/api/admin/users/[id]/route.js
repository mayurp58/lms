import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'
import { hashPassword } from '@/lib/auth/jwt'

// GET - Get single user
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const userQuery = `
      SELECT 
        u.id, u.email, u.role, u.status, u.created_at,
        up.first_name, up.last_name, up.phone, up.address, up.city, up.state, up.pincode,
        c.agent_code, c.city as connector_city, c.area as connector_area, c.commission_percentage,
        b.bank_id, b.employee_id, b.designation, b.department, b.max_approval_limit,bnk.name as bank_name, b.branch, b.branch_code
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN connectors c ON u.id = c.user_id
      LEFT JOIN bankers b ON u.id = b.user_id
      LEFT JOIN banks bnk ON bnk.id = b.bank_id
      WHERE u.id = ?
    `

    const users = await executeQuery(userQuery, [id])

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: users[0]
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT - Update user
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const {
      first_name,
      last_name,
      phone,
      address,
      city,
      state,
      pincode,
      status,
      password, // Optional
      // Role specific fields
      commission_percentage,
      max_approval_limit,
      branch,
      branch_code,
      employee_id,
      designation,
      department
    } = body

    // Update user profile
    await executeQuery(
      'UPDATE user_profiles SET first_name = ?, last_name = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ? WHERE user_id = ?',
      [first_name, last_name, phone, address, city, state, pincode, id]
    )

    // Update user status if provided
    if (status) {
      await executeQuery(
        'UPDATE users SET status = ? WHERE id = ?',
        [status, id]
      )
    }

    // Update password if provided
    if (password && password.trim() !== '') {
      const password_hash = await hashPassword(password)
      await executeQuery(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [password_hash, id]
      )
    }

    // Update role-specific data
    if (commission_percentage !== undefined) {
      await executeQuery(
        'UPDATE connectors SET commission_percentage = ? WHERE user_id = ?',
        [commission_percentage, id]
      )
    }

    if (max_approval_limit !== undefined) {
      await executeQuery(
        'UPDATE bankers SET max_approval_limit = ?, branch=?, branch_code=?,employee_id=?, designation=?, department=?  WHERE user_id = ?',
        [ 
          max_approval_limit,
          branch,
          branch_code,
          employee_id,
          designation,
          department, 
          id
        ]
      )
    }

    // Log activity
    await executeQuery(
      'INSERT INTO system_logs (user_id, action, entity_type, entity_id, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [
        request.headers.get('x-user-id'),
        'USER_UPDATED',
        'user',
        id,
        JSON.stringify(body),
        request.headers.get('x-forwarded-for') || 'unknown'
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user (soft delete by changing status)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    // Soft delete by updating status
    await executeQuery(
      'UPDATE users SET status = ? WHERE id = ?',
      ['inactive', id]
    )

    // Log activity
    await executeQuery(
      'INSERT INTO system_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [
        request.headers.get('x-user-id'),
        'USER_DELETED',
        'user',
        id,
        request.headers.get('x-forwarded-for') || 'unknown'
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
