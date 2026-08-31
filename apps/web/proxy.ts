import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibxuzodulxhrfzlbebuu.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_qBXoIxt8cNONTkNO9m3ycw_SfDbPznY'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Public routes stay accessible without an account.
  const isPublic = pathname === '/login' || pathname === '/apply' || pathname.startsWith('/apply/')
  const isProtected = !isPublic && (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/students') ||
    pathname.startsWith('/classes') ||
    pathname.startsWith('/grades') ||
    pathname.startsWith('/averages') ||
    pathname.startsWith('/bulletins') ||
    pathname.startsWith('/bulletin-templates') ||
    pathname.startsWith('/onboarding')
  )

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/students/:path*',
    '/classes/:path*',
    '/grades/:path*',
    '/averages/:path*',
    '/bulletins/:path*',
    '/bulletin-templates/:path*',
    '/onboarding/:path*',
    '/login',
    '/apply/:path*',
  ],
}
