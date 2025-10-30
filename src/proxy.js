import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

const publicRoutes = [
  '/auth/login', 
  '/auth/register', 
  '/', 
  '/test', 
  '/create-admin', 
  '/unauthorized'
]

const apiPublicRoutes = [
  '/api/auth/login', 
  '/api/auth/register', 
  '/api/debug'
]

export default async function proxy(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  console.log('🔍 Proxy check:', { pathname, hasToken: !!token })

  // Allow public routes and static assets
  if (
    publicRoutes.includes(pathname) ||
    apiPublicRoutes.some(route => pathname.startsWith(route)) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/')
  ) {
    console.log('✅ Public route allowed:', pathname)
    return NextResponse.next()
  }

  // Redirect to login if no token for protected routes
  if (!token) {
    console.log('❌ No token, redirecting to login from:', pathname)
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If we have a token, verify it and set headers
  try {
    const decoded = verifyToken(token)
    
    console.log('✅ User authenticated:', { 
      userId: decoded.userId, 
      role: decoded.role, 
      email: decoded.email,
      pathname 
    })

    // Set headers for all authenticated requests
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decoded.userId.toString())
    requestHeaders.set('x-user-role', decoded.role)
    requestHeaders.set('x-user-email', decoded.email)

    // Simple role-based redirects (only for obvious mismatches)
    if (pathname.startsWith('/admin/') && !['admin', 'super_admin'].includes(decoded.role)) {
      console.log('❌ Admin access denied for role:', decoded.role)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (pathname.startsWith('/operator/') && decoded.role !== 'operator' && decoded.role !== 'super_admin') {
      console.log('❌ Operator access denied for role:', decoded.role)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (pathname.startsWith('/banker/') && decoded.role !== 'banker' && decoded.role !== 'super_admin') {
      console.log('❌ Banker access denied for role:', decoded.role)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (pathname.startsWith('/connector/') && decoded.role !== 'connector' && decoded.role !== 'super_admin') {
      console.log('❌ Connector access denied for role:', decoded.role)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

  } catch (error) {
    console.error('❌ Token verification failed:', error.message)
    // Clear invalid token and redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('auth-token')
    response.cookies.delete('refresh-token')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
