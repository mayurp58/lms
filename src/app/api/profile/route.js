import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

// GET - Fetch user profile
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user details
    const userQuery = `
      SELECT id, email, role, status, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `
    const userResult = await executeQuery(userQuery, [userId])
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const user = userResult[0]

    // Get user profile
    const profileQuery = `
      SELECT * FROM user_profiles WHERE user_id = ?
    `
    const profileResult = await executeQuery(profileQuery, [userId])
    const profile = profileResult[0] || {}

    return NextResponse.json({
      success: true,
      data: {
        user,
        profile
      }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch profile: ' + error.message },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { profile } = await request.json()

    // Check if profile exists
    const existingProfileQuery = 'SELECT id FROM user_profiles WHERE user_id = ?'
    const existingProfile = await executeQuery(existingProfileQuery, [userId])

    if (existingProfile.length === 0) {
      // Create new profile
      const createQuery = `
        INSERT INTO user_profiles (
          user_id, first_name, last_name, phone, address, city, state, pincode, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `
      
      await executeQuery(createQuery, [
        userId,
        profile.first_name,
        profile.last_name,
        profile.email,
        profile.phone,
        profile.bio,
        profile.address,
        profile.city,
        profile.state,
        profile.pincode
      ])
    } else {
      // Update existing profile
      const updateQuery = `
        UPDATE user_profiles SET 
          first_name = ?, last_name = ?, phone = ?,
          address = ?, city = ?, state = ?, pincode = ?, updated_at = NOW()
        WHERE user_id = ?
      `
      
      await executeQuery(updateQuery, [
        profile.first_name,
        profile.last_name,
        profile.phone,
        profile.address,
        profile.city,
        profile.state,
        profile.pincode,
        userId
      ])
    }

    

    // Log the activity
    const logQuery = `
      INSERT INTO system_logs (
        user_id, action, entity_type, entity_id, 
        new_values, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `

    await executeQuery(logQuery, [
      userId,
      'PROFILE_UPDATE',
      'user_profile',
      userId,
      JSON.stringify(profile),
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update profile: ' + error.message },
      { status: 500 }
    )
  }
}
