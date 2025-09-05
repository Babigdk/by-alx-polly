# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

![ALX Polly Logo](./public/globe.svg)

## 📋 Table of Contents

- [About the Application](#about-the-application)
- [Security Features](#️-security-features-implemented)
- [Getting Started](#-getting-started)
  - [Prerequisites](#1-prerequisites)
  - [Installation](#2-installation)
  - [Environment Variables](#3-environment-variables)
  - [Database Setup](#4-database-setup)
  - [Running the Application](#5-running-the-application)
- [Usage Examples](#-usage-examples)
- [Security Testing](#-security-testing)
- [Security Resources](#-security-resources)
- [Contributing](#-contributing)
- [License](#-license)

## About the Application

ALX Polly allows authenticated users to create, share, and vote on polls. It's a simple yet powerful application that demonstrates key features of modern web development:

-   **Authentication**: Secure user sign-up and login.
-   **Poll Management**: Users can create, view, and delete their own polls.
-   **Voting System**: A straightforward system for casting and viewing votes.
-   **User Dashboard**: A personalized space for users to manage their polls.

The application is built with a modern tech stack:

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Backend & Database**: [Supabase](https://supabase.io/)
-   **UI**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
-   **State Management**: React Server Components and Client Components

---

## 🚨 Security Audit Results & Remediation

This version of ALX Polly has undergone a comprehensive security audit that identified and fixed several critical vulnerabilities. Below is a detailed breakdown of the security flaws discovered and the measures implemented to address them.

### 🔴 Critical Security Vulnerabilities Identified & Fixed

#### 1. **Missing Authorization in Admin Panel**
- **Vulnerability**: Any authenticated user could access the admin panel and perform administrative actions
- **Impact**: Unauthorized users could delete any poll in the system, causing data loss and service disruption
- **Attack Vector**: Direct navigation to `/admin` route
- **Remediation**: 
  - Implemented role-based access control (RBAC)
  - Added authorization checks for admin privileges
  - Redirects unauthorized users to appropriate pages
  - Requires `profiles` table with `role` field in Supabase

#### 2. **Missing Authorization in Poll Operations**
- **Vulnerability**: Users could delete and update polls they didn't own
- **Impact**: Unauthorized data modification, potential data loss
- **Attack Vector**: Manipulating poll IDs in delete/update requests
- **Remediation**:
  - Added ownership verification before any destructive operations
  - Implemented proper authorization checks in all poll actions
  - Admin override capability for legitimate administrative actions

#### 3. **Cross-Site Scripting (XSS) Vulnerabilities**
- **Vulnerability**: Lack of input sanitization allowed malicious script injection
- **Impact**: Attackers could execute arbitrary JavaScript, steal user data, hijack sessions
- **Attack Vector**: Malicious content in poll questions, options, or user names
- **Remediation**:
  - Implemented comprehensive input sanitization using regex patterns
  - Added client-side and server-side validation
  - Created centralized security utilities (`SecurityUtils.sanitizeInput()`)
  - Removes dangerous HTML tags, JavaScript, and event handlers

#### 4. **Missing Input Validation**
- **Vulnerability**: No validation for input length, format, or content type
- **Impact**: Potential DoS attacks, database corruption, unexpected behavior
- **Attack Vector**: Extremely long inputs, malformed data, special characters
- **Remediation**:
  - Added comprehensive input length validation
  - Implemented format validation (email, UUID, etc.)
  - Created centralized validation constants and utilities
  - Added real-time client-side validation with user feedback

#### 5. **Missing Rate Limiting**
- **Vulnerability**: No protection against brute force attacks or spam
- **Impact**: Account takeover attempts, service degradation, resource exhaustion
- **Attack Vector**: Rapid authentication attempts, poll creation spam
- **Remediation**:
  - Implemented general rate limiting (100 requests per 15 minutes)
  - Added stricter authentication rate limiting (5 attempts per 5 minutes)
  - IP-based rate limiting with configurable windows
  - Proper HTTP 429 responses with retry-after headers

#### 6. **Information Disclosure**
- **Vulnerability**: Admin panel exposed internal IDs and user IDs
- **Impact**: Information leakage that could aid in enumeration attacks
- **Attack Vector**: Accessing admin panel or error messages
- **Remediation**:
  - Limited sensitive information exposure
  - Implemented proper error handling without information leakage
  - Added access controls to sensitive endpoints

### 🟡 Medium Security Issues Addressed

#### 7. **Weak Password Requirements**
- **Vulnerability**: No password strength requirements
- **Impact**: Easy-to-guess passwords, account compromise
- **Remediation**:
  - Implemented strong password policy (8+ chars, uppercase, lowercase, number)
  - Added client-side password strength validation
  - Real-time feedback on password requirements

#### 8. **Missing Security Headers**
- **Vulnerability**: No security headers to protect against common attacks
- **Impact**: Clickjacking, MIME type sniffing, XSS protection disabled
- **Remediation**:
  - Added comprehensive security headers
  - Implemented Content Security Policy (CSP)
  - Added X-Frame-Options, X-Content-Type-Options, etc.

### 🟢 Security Improvements Implemented

#### 9. **Centralized Security Configuration**
- **Implementation**: Created `lib/security.ts` with all security constants
- **Benefits**: Consistent security implementation, easy maintenance, centralized policy management

#### 10. **Enhanced Form Validation**
- **Implementation**: Real-time client-side validation with immediate feedback
- **Benefits**: Better user experience, prevents malicious input from reaching server

#### 11. **Comprehensive Error Handling**
- **Implementation**: Secure error messages that don't leak sensitive information
- **Benefits**: Prevents information disclosure while maintaining usability

---

## 🛡️ Security Features Implemented

### Input Validation & Sanitization
- **XSS Prevention**: Removes dangerous HTML tags, scripts, and event handlers
- **Length Validation**: Enforces minimum and maximum input lengths
- **Format Validation**: Email, UUID, and option index validation
- **Content Filtering**: Blocks potentially malicious content patterns

### Authentication & Authorization
- **Role-Based Access Control**: Admin and user role separation
- **Ownership Verification**: Users can only modify their own data
- **Session Management**: Secure session handling with Supabase
- **Password Security**: Strong password requirements and validation

### Rate Limiting & Protection
- **General Rate Limiting**: 100 requests per 15 minutes
- **Authentication Rate Limiting**: 5 attempts per 5 minutes
- **IP-Based Tracking**: Monitors requests by client IP
- **Graceful Degradation**: Proper HTTP 429 responses

### Security Headers
- **Content Security Policy**: Restricts resource loading and execution
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Additional XSS protection layer
- **Referrer Policy**: Controls referrer information leakage

---

## 🔧 Implementation Details

### Security Configuration (`lib/security.ts`)
```typescript
export const SECURITY_CONFIG = {
  RATE_LIMIT: {
    GENERAL: { WINDOW_MS: 15 * 60 * 1000, MAX_REQUESTS: 100 },
    AUTH: { WINDOW_MS: 5 * 60 * 1000, MAX_ATTEMPTS: 5 }
  },
  INPUT_LIMITS: {
    NAME: { MIN: 2, MAX: 100 },
    EMAIL: { MIN: 3, MAX: 254 },
    PASSWORD: { MIN: 8, MAX: 128 },
    QUESTION: { MIN: 3, MAX: 500 },
    OPTION: { MIN: 1, MAX: 200 }
  }
}
```

### Input Sanitization
```typescript
static sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}
```

### Authorization Check Example
```typescript
// Check if user owns the poll
if (poll.user_id !== user.id) {
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: "You can only delete your own polls." };
  }
}
```

---

## 📱 Usage Examples

### Creating a Poll

1. Log in to your account
2. Navigate to the "Create Poll" page
3. Enter your poll question
4. Add at least two options for users to vote on
5. Click "Create Poll"

```typescript
// Example of poll creation using the createPoll server action
const result = await createPoll(formData);
if (!result.error) {
  // Poll created successfully
  router.push('/polls');
}
```

### Voting on a Poll

1. Access a poll via its unique URL or QR code
2. Select your preferred option
3. Click "Vote"
4. View the current results

```typescript
// Example of voting using the submitVote server action
const result = await submitVote(pollId, selectedOptionIndex);
if (!result.error) {
  // Vote recorded successfully
  setHasVoted(true);
}
```

### Sharing a Poll

1. Navigate to one of your created polls
2. Click the "Share" button
3. Copy the unique URL or scan the QR code
4. Share with your audience via your preferred method

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20.x or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.io/) account

### 2. Installation
```bash
git clone <repository-url>
cd alx-polly
npm install
```

### 3. Environment Variables
Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
Create the following tables in Supabase:
```sql
-- Profiles table for role-based access control
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 5. Running the Application
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🔍 Security Testing

### Manual Testing Checklist
- [ ] Try accessing `/admin` without admin privileges
- [ ] Attempt to delete polls owned by other users
- [ ] Test XSS payloads in poll creation forms
- [ ] Verify rate limiting on authentication endpoints
- [ ] Check security headers in browser developer tools
- [ ] Test input validation with various payloads

### Automated Security Testing
Consider implementing:
- **OWASP ZAP**: Automated security scanning
- **Snyk**: Dependency vulnerability scanning
- **ESLint Security**: Code-level security analysis
- **Husky**: Pre-commit security hooks

---

## 📚 Security Resources

### OWASP Top 10
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/)
- [Broken Access Control](https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control)

### Next.js Security
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security)

### Supabase Security
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Policies](https://supabase.com/docs/guides/auth/row-level-security#policies)

---

## 🤝 Contributing

When contributing to this project:
1. Follow security-first development practices
2. Always validate and sanitize user inputs
3. Implement proper authorization checks
4. Test for common security vulnerabilities
5. Update this security documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## ⚠️ Disclaimer

This application is designed for educational purposes and demonstrates security best practices. While significant effort has been made to secure the application, it should not be deployed to production without additional security review and testing.

---

**Security Contact**: For security issues, please create a private issue or contact the development team directly.
