import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'
export async function GET(request,{params}) {
    try {
      const userId = request.headers.get('x-user-id')
      const userRole = request.headers.get('x-user-role')
      const { bankId } = await params
  
      if (!userId || userRole !== 'operator') {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        )
      }
  
      // Get all active banks
      const citiesQuery = `SELECT DISTINCT city FROM bankers WHERE bank_id = ? ORDER BY city ASC`
  
      const cities = await executeQuery(citiesQuery,[bankId])
      const formattedCities = cities.map(row => ({ name: row.city }));

      return NextResponse.json({
        success: true,
        data: formattedCities
      })
  
    } catch (error) {
      console.error('Get banks error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch banks: ' + error.message },
        { status: 500 }
      )
    }
  }