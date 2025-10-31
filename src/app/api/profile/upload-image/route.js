import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('profile_image')

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `profile-${userId}-${timestamp}.${extension}`

    // Save file to public/uploads directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles')
    const filepath = join(uploadsDir, filename)

    // Create directory if it doesn't exist
    const fs = require('fs')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    await writeFile(filepath, buffer)

    const imageUrl = `/uploads/profiles/${filename}`

    // Update profile with image URL
    const updateQuery = `
      UPDATE user_profiles 
      SET profile_image = ?, updated_at = NOW() 
      WHERE user_id = ?
    `
    
    await executeQuery(updateQuery, [imageUrl, userId])

    // If profile doesn't exist, create it
    const profileExists = await executeQuery('SELECT id FROM user_profiles WHERE user_id = ?', [userId])
    if (profileExists.length === 0) {
      const createQuery = `
        INSERT INTO user_profiles (user_id, profile_image, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
      `
      await executeQuery(createQuery, [userId, imageUrl])
    }

    return NextResponse.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        image_url: imageUrl
      }
    })

  } catch (error) {
    console.error('Upload image error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to upload image: ' + error.message },
      { status: 500 }
    )
  }
}
