import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  // Create a response that we can modify
  const res = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  // Create the supabase client with the response
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Get the session - this will also refresh expired sessions
  const { data: { session } } = await supabase.auth.getSession()
  
  // Protected routes that require authentication
  const protectedPaths = ['/', '/admin']
  const authPaths = ['/auth/login', '/auth/signup', '/auth/verify']
  
  const path = request.nextUrl.pathname
  const isProtectedPath = protectedPaths.some(p => path === p || path.startsWith(p + '/'))
  const isAuthPath = authPaths.some(p => path === p || path.startsWith(p + '/'))
  
  // Debug logging
  console.log('Middleware - Path:', path, 'Session exists:', !!session, 'Protected:', isProtectedPath, 'Auth path:', isAuthPath)
  
  // If user is not authenticated and trying to access protected route
  if (!session && isProtectedPath) {
    console.log('Middleware - Redirecting to login (no session)')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // If user is authenticated and trying to access auth pages (except verify)
  if (session && isAuthPath && !path.includes('/verify')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // For admin routes specifically, check if user has admin access
  if (path.startsWith('/admin') && session) {
    try {
      // Get user data to check access level
      const { data: userData, error } = await supabase
        .from('users')
        .select('access_level')
        .eq('id', session.user.id)
        .single()
      
      // If there's an error or no user data, or user is not admin, redirect to home
      if (error || !userData || userData.access_level !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      // If there's any error checking user data, redirect to home
      console.error('Middleware error checking user access:', error)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
