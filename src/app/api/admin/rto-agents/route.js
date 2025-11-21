import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')

    let query = 'SELECT * FROM rto_agents WHERE is_active = 1'
    let params = []

    if (city) {
        query += ' AND city = ?'
        params.push(city)
    }
    
    query += ' ORDER BY name ASC'

    const agents = await executeQuery(query, params)
    return NextResponse.json({ success: true, data: agents })
  } catch (error) {
    console.error('RTO Agents GET Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, phone, city } = body

    if (!name || !phone || !city) {
        return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const result = await executeQuery(
        'INSERT INTO rto_agents (name, phone, city) VALUES (?, ?, ?)',
        [name, phone, city]
    )

    return NextResponse.json({ success: true, message: "Agent added successfully", id: result.insertId })
  } catch (error) {
    console.error('RTO Agents POST Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}