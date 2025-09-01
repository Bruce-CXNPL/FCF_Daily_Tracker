import { NextResponse } from 'next/server'

// Simple admin access endpoint
// In production, this should use proper authentication
export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    
    // Simple password check - in production use proper auth
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
    
    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true, isAdmin: true })
    }
    
    return NextResponse.json({ success: false, isAdmin: false }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
