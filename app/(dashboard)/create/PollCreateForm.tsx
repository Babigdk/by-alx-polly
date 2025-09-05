"use client";

/**
 * Poll Creation Form Component
 * 
 * This client component provides a form for creating new polls with a question
 * and multiple options. It includes client-side validation, dynamic option management,
 * and security measures to prevent malicious input.
 */

import { useState } from "react";
import { createPoll } from "@/app/lib/actions/poll-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Client-side validation helpers
 * These functions validate user inputs before form submission to provide
 * immediate feedback and prevent security vulnerabilities.
 */

/**
 * Validates poll question format and content
 * @param question - The poll question to validate
 * @returns Error message if invalid, null if valid
 */
function validateQuestion(question: string): string | null {
  if (!question.trim()) return "Question is required";
  if (question.trim().length < 3) return "Question must be at least 3 characters long";
  if (question.trim().length > 500) return "Question must be less than 500 characters";
  
  // Check for potentially dangerous content
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(question)) {
      return "Question contains invalid content";
    }
  }
  
  return null;
}

/**
 * Validates poll option format and content
 * @param option - The poll option to validate
 * @returns Error message if invalid, null if valid
 */
function validateOption(option: string): string | null {
  if (!option.trim()) return "Option cannot be empty";
  if (option.trim().length > 200) return "Option must be less than 200 characters";
  
  // Check for potentially dangerous content
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(option)) {
      return "Option contains invalid content";
    }
  }
  
  return null;
}

/**
 * Poll Creation Form Component
 * Renders a form for creating new polls with dynamic option management
 * @returns React component with poll creation form
 */
export default function PollCreateForm() {
  const [options, setOptions] = useState(["", ""]);
  const [question, setQuestion] = useState("");
  const [errors, setErrors] = useState<{ question?: string; options?: string[] }>({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles question field changes and clears related errors
   * @param value - The new question value
   */
  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    // Clear error when user starts typing
    if (errors.question) {
      setErrors(prev => ({ ...prev, question: undefined }));
    }
  };

  /**
   * Handles option field changes and clears related errors
   * @param idx - The index of the option being changed
   * @param value - The new option value
   */
  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
    // Clear error when user starts typing
    if (errors.options?.[idx]) {
      setErrors(prev => ({
        ...prev,
        options: prev.options?.map((error, i) => i === idx ? "" : error) || []
      }));
    }
  };

  /**
   * Adds a new empty option to the options list
   */
  const addOption = () => setOptions((opts) => [...opts, ""]);
  
  /**
   * Removes an option from the options list
   * @param idx - The index of the option to remove
   * 
   * Maintains at least two options as required for a valid poll
   */
  const removeOption = (idx: number) => {
    if (options.length > 2) {
      setOptions((opts) => opts.filter((_, i) => i !== idx));
      // Clear error for removed option
      if (errors.options?.[idx]) {
        setErrors(prev => ({
          ...prev,
          options: prev.options?.filter((_, i) => i !== idx)
        }));
      }
    }
  };

  /**
   * Validates the entire form before submission
   * @returns Boolean indicating if the form is valid
   * 
   * Performs comprehensive validation on the question and all options,
   * updating the errors state with any validation failures
   */
  const validateForm = (): boolean => {
    const newErrors: { question?: string; options?: string[] } = {};
    
    // Validate question
    const questionError = validateQuestion(question);
    if (questionError) {
      newErrors.question = questionError;
    }
    
    // Validate options
    const optionErrors: string[] = [];
    let hasValidOptions = false;
    
    options.forEach((option, index) => {
      const optionError = validateOption(option);
      optionErrors.push(optionError || "");
      if (!optionError && option.trim()) {
        hasValidOptions = true;
      }
    });
    
    if (!hasValidOptions) {
      optionErrors[0] = "At least one option is required";
    }
    
    if (optionErrors.some(error => error)) {
      newErrors.options = optionErrors;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   * @param event - The form submission event
   * 
   * Validates the form, prepares form data, submits to server action,
   * and handles success/error states including redirection on success
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append("question", question.trim());
      options.forEach(option => {
        if (option.trim()) {
          formData.append("options", option.trim());
        }
      });
      
      const res = await createPoll(formData);
      
      if (res?.error) {
        setErrors({ question: res.error });
      } else {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/polls";
        }, 1200);
      }
    } catch (error) {
      setErrors({ question: "An unexpected error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Input 
          name="question" 
          id="question" 
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          required 
          maxLength={500}
          className={errors.question ? "border-red-500" : ""}
        />
        {errors.question && (
          <p className="text-red-500 text-sm mt-1">{errors.question}</p>
        )}
      </div>
      
      <div>
        <Label>Options</Label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input
              name="options"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              required
              maxLength={200}
              className={errors.options?.[idx] ? "border-red-500" : ""}
            />
            {options.length > 2 && (
              <Button type="button" variant="destructive" onClick={() => removeOption(idx)}>
                Remove
              </Button>
            )}
          </div>
        ))}
        {errors.options && errors.options.some(error => error) && (
          <div className="space-y-1">
            {errors.options.map((error, index) => 
              error ? (
                <p key={index} className="text-red-500 text-sm">{error}</p>
              ) : null
            )}
          </div>
        )}
        <Button type="button" onClick={addOption} variant="secondary" className="mt-2">
          Add Option
        </Button>
      </div>
      
      {success && <div className="text-green-600">Poll created! Redirecting...</div>}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Poll'}
      </Button>
    </form>
  );
}