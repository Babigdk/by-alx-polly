'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';
import { SecurityUtils, SECURITY_CONFIG } from '@/lib/security';

/**
 * Authentication Actions Module
 * 
 * This module contains server actions for handling user authentication flows including
 * login, registration, and logout. All functions implement security best practices
 * including input validation, sanitization, and proper error handling.
 */

/**
 * Authenticates a user with their email and password
 * 
 * @param data - Object containing user login credentials
 * @param data.email - User's email address
 * @param data.password - User's password
 * 
 * @returns Object with error field (null if successful, error message if failed)
 * 
 * This function validates and sanitizes inputs, checks for proper email format,
 * and attempts to authenticate the user with Supabase. It implements security
 * measures to prevent common attacks like XSS and injection.
 */
export async function login(data: LoginFormData) {
  const supabase = await createClient();

  // Validate and sanitize inputs using security utilities
  if (!data.email || !data.password) {
    return { error: "Email and password are required." };
  }

  const sanitizedEmail = SecurityUtils.sanitizeInput(data.email);
  const sanitizedPassword = data.password; // Don't sanitize password

  // Validate email using security utilities
  if (!SecurityUtils.isValidEmail(sanitizedEmail)) {
    return { error: "Please enter a valid email address." };
  }

  // Validate email length using security configuration
  const { INPUT_LIMITS } = SECURITY_CONFIG;
  if (!SecurityUtils.validateLength(sanitizedEmail, INPUT_LIMITS.EMAIL.MIN, INPUT_LIMITS.EMAIL.MAX)) {
    return { error: `Email must be between ${INPUT_LIMITS.EMAIL.MIN} and ${INPUT_LIMITS.EMAIL.MAX} characters.` };
  }

  if (sanitizedPassword.length < 1) {
    return { error: "Password is required." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: sanitizedEmail,
    password: sanitizedPassword,
  });

  if (error) {
    return { error: error.message };
  }

  // Success: no error
  return { error: null };
}

/**
 * Registers a new user account
 * 
 * @param data - Object containing user registration information
 * @param data.name - User's display name
 * @param data.email - User's email address
 * @param data.password - User's chosen password
 * 
 * @returns Object with error field (null if successful, error message if failed)
 * 
 * This function validates and sanitizes all inputs, enforces password strength
 * requirements, and creates a new user account in Supabase. It implements
 * security measures to prevent common attacks and ensure data integrity.
 */
export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  // Validate and sanitize inputs using security utilities
  if (!data.name || !data.email || !data.password) {
    return { error: "Name, email, and password are required." };
  }

  const sanitizedName = SecurityUtils.sanitizeInput(data.name);
  const sanitizedEmail = SecurityUtils.sanitizeInput(data.email);
  const sanitizedPassword = data.password; // Don't sanitize password

  // Validate name length using security configuration
  const { INPUT_LIMITS } = SECURITY_CONFIG;
  if (!SecurityUtils.validateLength(sanitizedName, INPUT_LIMITS.NAME.MIN, INPUT_LIMITS.NAME.MAX)) {
    return { error: `Name must be between ${INPUT_LIMITS.NAME.MIN} and ${INPUT_LIMITS.NAME.MAX} characters.` };
  }

  // Validate email using security utilities
  if (!SecurityUtils.isValidEmail(sanitizedEmail)) {
    return { error: "Please enter a valid email address." };
  }

  if (!SecurityUtils.validateLength(sanitizedEmail, INPUT_LIMITS.EMAIL.MIN, INPUT_LIMITS.EMAIL.MAX)) {
    return { error: `Email must be between ${INPUT_LIMITS.EMAIL.MIN} and ${INPUT_LIMITS.EMAIL.MAX} characters.` };
  }

  // Validate password strength using security utilities
  if (!SecurityUtils.isStrongPassword(sanitizedPassword)) {
    return { error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number." };
  }

  const { error } = await supabase.auth.signUp({
    email: sanitizedEmail,
    password: sanitizedPassword,
    options: {
      data: {
        name: sanitizedName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Success: no error
  return { error: null };
}

/**
 * Logs out the currently authenticated user
 * 
 * @returns Object with error field (null if successful, error message if failed)
 * 
 * This function terminates the user's session in Supabase and clears authentication
 * state. It should be called when a user explicitly requests to log out.
 */
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
