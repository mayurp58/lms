import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'
import { comparePassword, generateToken, generateRefreshToken } from '@/lib/auth/jwt'
import { validateLoginData } from '@/lib/validations'

export async function POST(request) {
  try {
    const body = await request.json()
    const { isValid, errors } = validateLoginData(body)

    if (!isValid) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }

    const { email, password } = body

    // Find user with profile information
    const userQuery = `
      SELECT 
        u.id, u.email, u.password_hash, u.role, u.status,
        up.first_name, up.last_name, up.phone
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.email = ?
    `
    
    const users = await executeQuery(userQuery, [email])

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = users[0]

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Account is suspended or inactive' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    }

    const accessToken = generateToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // Log login activity
    await executeQuery(
      'INSERT INTO system_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'USER_LOGIN', request.headers.get('x-forwarded-for') || 'unknown']
    )

    // Prepare user data (exclude sensitive information)
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone
    }

    // Create response with httpOnly cookies
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userData,
      role: user.role
    })

    // Set secure cookies
    response.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
