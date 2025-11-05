import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request, { params }) {
    try {
      const { id } = await params
      
      const banks = await executeQuery(
        'SELECT id, name, code FROM banks WHERE id = ?',
        [id]
      )
  
      return NextResponse.json({
        success: true,
        data: banks[0]
      })
  
    } catch (error) {
      console.error('Get banks error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch banks' },
        { status: 500 }
      )
    }
}

export async function POST(request, { params }) {
    try {
        const { id } = await params
        console.log(id)
        await executeQuery(
            'UPDATE banks SET is_active = ? WHERE id = ?',
            ['1', id]
        )

        return NextResponse.json({
            success: true,
            message: 'Bank updated successfully'
        })
    }
    catch (error) {
        console.error('Update bank error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to update bank' },
          { status: 500 }
        )
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params
        const body = await request.json()
        const {
            name,
            code
          } = body

          await executeQuery(
            'UPDATE banks SET name = ?, code = ? WHERE id = ?',
            [name, code, id]
          )

        return NextResponse.json({
            success: true,
            message: 'Bank updated successfully'
        })
    }
    catch (error) {
        console.error('Update bank error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to update bank' },
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
        'UPDATE banks SET is_active = ? WHERE id = ?',
        ['0', id]
      )
  
      // Log activity
      await executeQuery(
        'INSERT INTO system_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [
          request.headers.get('x-user-id'),
          'BANK_DELETED',
          'bank',
          id,
          request.headers.get('x-forwarded-for') || 'unknown'
        ]
      )
  
      return NextResponse.json({
        success: true,
        message: 'Bank deleted successfully'
      })
  
    } catch (error) {
      console.error('Delete bank error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to delete bank' },
        { status: 500 }
      )
    }
  }