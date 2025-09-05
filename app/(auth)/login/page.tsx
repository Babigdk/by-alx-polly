'use client';

/**
 * Login Page Component
 * 
 * This client component handles user authentication by providing a login form
 * with email and password fields. It includes client-side validation, error handling,
 * and security measures to ensure a secure login process.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from '@/app/lib/actions/auth-actions';

/**
 * Client-side validation helpers
 * These functions validate user inputs before form submission to provide
 * immediate feedback and prevent unnecessary server requests with invalid data.
 */

/**
 * Validates email format and length
 * @param email - The email address to validate
 * @returns Error message if invalid, null if valid
 */
function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required";
  if (email.trim().length < 3) return "Email must be at least 3 characters long";
  if (email.trim().length > 254) return "Email must be less than 254 characters";
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return "Please enter a valid email address";
  }
  
  return null;
}

/**
 * Validates password presence
 * @param password - The password to validate
 * @returns Error message if invalid, null if valid
 */
function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 1) return "Password is required";
  
  return null;
}

/**
 * Login Page Component
 * Renders a form for user authentication with email and password fields
 * @returns React component with login form
 */
export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  /**
   * Handles input field changes and clears field-specific errors
   * @param field - The form field being changed (email or password)
   * @param value - The new value of the field
   */
  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Validates all form fields before submission
   * @returns Boolean indicating if the form is valid
   */
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission, validates inputs, and attempts login
   * @param event - Form submission event
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const result = await login({ 
        email: formData.email.trim(), 
        password: formData.password 
      });

      if (result?.error) {
        setErrors({ general: result.error });
      } else {
        window.location.href = '/polls'; // Full reload to pick up session
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login to ALX Polly</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="your@email.com" 
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                autoComplete="email"
                maxLength={254}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                autoComplete="current-password"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>
            {errors.general && (
              <p className="text-red-500 text-sm">{errors.general}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}