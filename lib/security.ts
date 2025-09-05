/**
 * Security Module
 * 
 * This module provides security utilities, configurations, and constants used throughout
 * the application to ensure data integrity, prevent common web vulnerabilities, and
 * implement security best practices.
 */

/**
 * Security configuration constants
 * 
 * Contains settings for rate limiting, input validation, password requirements,
 * Content Security Policy (CSP), and security headers.
 */
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    GENERAL: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 100,
    },
    AUTH: {
      WINDOW_MS: 5 * 60 * 1000, // 5 minutes
      MAX_ATTEMPTS: 5,
    },
  },
  
  // Input validation
  INPUT_LIMITS: {
    NAME: { MIN: 2, MAX: 100 },
    EMAIL: { MIN: 3, MAX: 254 },
    PASSWORD: { MIN: 8, MAX: 128 },
    QUESTION: { MIN: 3, MAX: 500 },
    OPTION: { MIN: 1, MAX: 200 },
    POLL_ID: { MIN: 1, MAX: 100 },
  },
  
  // Password requirements
  PASSWORD_REQUIREMENTS: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    ALLOWED_SPECIAL_CHARS: '@$!%*?&',
  },
  
  // Content Security Policy
  CSP: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    STYLE_SRC: ["'self'", "'unsafe-inline'"],
    IMG_SRC: ["'self'", "data:", "https:"],
    FONT_SRC: ["'self'"],
    CONNECT_SRC: ["'self'", "https://*.supabase.co"],
    FRAME_ANCESTORS: ["'none'"],
  },
  
  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
} as const;

/**
 * Dangerous content patterns for XSS prevention
 * 
 * Regular expressions that match potentially malicious content patterns
 * used to sanitize user inputs and prevent Cross-Site Scripting (XSS) attacks.
 */
export const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /vbscript:/gi,
  /data:/gi,
] as const;

/**
 * Security utility class
 * 
 * Provides methods for input sanitization, validation, and security checks
 * used throughout the application to prevent common web vulnerabilities.
 */
export class SecurityUtils {
  /**
   * Sanitize input to prevent XSS attacks
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    let sanitized = input.trim();
    
    // Remove dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    
    return sanitized;
  }
  
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    if (typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
  
  /**
   * Validate password strength
   */
  static isStrongPassword(password: string): boolean {
    if (typeof password !== 'string') return false;
    
    const { MIN_LENGTH, REQUIRE_UPPERCASE, REQUIRE_LOWERCASE, REQUIRE_NUMBER } = SECURITY_CONFIG.PASSWORD_REQUIREMENTS;
    
    if (password.length < MIN_LENGTH) return false;
    if (REQUIRE_UPPERCASE && !/(?=.*[A-Z])/.test(password)) return false;
    if (REQUIRE_LOWERCASE && !/(?=.*[a-z])/.test(password)) return false;
    if (REQUIRE_NUMBER && !/(?=.*\d)/.test(password)) return false;
    
    return true;
  }
  
  /**
   * Validate string length within bounds
   */
  static validateLength(value: string, min: number, max: number): boolean {
    if (typeof value !== 'string') return false;
    const length = value.trim().length;
    return length >= min && length <= max;
  }
  
  /**
   * Generate Content Security Policy header value
   */
  static generateCSP(): string {
    const { CSP } = SECURITY_CONFIG;
    const directives = [];
    
    for (const [directive, sources] of Object.entries(CSP)) {
      const kebabCase = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
      directives.push(`${kebabCase} ${sources.join(' ')}`);
    }
    
    return directives.join('; ');
  }
  
  /**
   * Validate UUID format (for poll IDs)
   */
  static isValidUUID(uuid: string): boolean {
    if (typeof uuid !== 'string') return false;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  
  /**
   * Validate option index for voting
   */
  static isValidOptionIndex(index: number, maxOptions: number): boolean {
    if (typeof index !== 'number' || !Number.isInteger(index)) return false;
    return index >= 0 && index < maxOptions;
  }
}

// Export types for use in other files
export type SecurityConfig = typeof SECURITY_CONFIG;
export type DangerousPatterns = typeof DANGEROUS_PATTERNS;
