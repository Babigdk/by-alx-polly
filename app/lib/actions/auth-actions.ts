'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';
import { SecurityUtils, SECURITY_CONFIG } from '@/lib/security';

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
