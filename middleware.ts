import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { SECURITY_CONFIG, SecurityUtils } from '@/lib/security'

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, isAuth: boolean = false): boolean {
  const now = Date.now();
  const { RATE_LIMIT } = SECURITY_CONFIG;
  
  const window = isAuth ? RATE_LIMIT.AUTH.WINDOW_MS : RATE_LIMIT.GENERAL.WINDOW_MS;
  const maxRequests = isAuth ? RATE_LIMIT.AUTH.MAX_ATTEMPTS : RATE_LIMIT.GENERAL.MAX_REQUESTS;
  
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + window });
    return false;
  }
  
  if (record.count >= maxRequests) {
    return true;
  }
  
  record.count++;
  return false;
}

export async function middleware(request: NextRequest) {
  // Get client IP from headers (NextRequest doesn't have .ip property)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/auth');
  
  // Apply stricter rate limiting for authentication routes
  if (isAuthRoute && isRateLimited(ip, true)) {
    return new NextResponse('Too many authentication attempts. Please try again later.', {
      status: 429,
      headers: {
        'Retry-After': '300', // 5 minutes
        'Content-Type': 'text/plain',
      },
    });
  }
  
  // Apply general rate limiting for all routes
  if (isRateLimited(ip, false)) {
    return new NextResponse('Too many requests. Please try again later.', {
      status: 429,
      headers: {
        'Retry-After': '900', // 15 minutes
        'Content-Type': 'text/plain',
      },
    });
  }

  // Add security headers
  const response = await updateSession(request);
  
  // Add security headers from configuration
  Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  
  // Add Content Security Policy using the utility function
  response.headers.set('Content-Security-Policy', SecurityUtils.generateCSP());

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|register|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}