"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { SecurityUtils, SECURITY_CONFIG } from "@/lib/security";

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Sanitize inputs to prevent XSS using security utilities
  const sanitizedQuestion = SecurityUtils.sanitizeInput(question);
  const sanitizedOptions = options.map(option => SecurityUtils.sanitizeInput(option));

  // Validate input lengths using security configuration
  const { INPUT_LIMITS } = SECURITY_CONFIG;
  if (!SecurityUtils.validateLength(sanitizedQuestion, INPUT_LIMITS.QUESTION.MIN, INPUT_LIMITS.QUESTION.MAX)) {
    return { error: `Question must be between ${INPUT_LIMITS.QUESTION.MIN} and ${INPUT_LIMITS.QUESTION.MAX} characters.` };
  }

  if (sanitizedOptions.some(option => !SecurityUtils.validateLength(option, INPUT_LIMITS.OPTION.MIN, INPUT_LIMITS.OPTION.MAX))) {
    return { error: `Options must be between ${INPUT_LIMITS.OPTION.MIN} and ${INPUT_LIMITS.OPTION.MAX} characters.` };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: sanitizedQuestion,
      options: sanitizedOptions,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Validate ID format using security utilities
  if (!id || !SecurityUtils.validateLength(id, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MIN, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MAX)) {
    return { poll: null, error: "Invalid poll ID." };
  }

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  
  // Validate inputs using security utilities
  if (!pollId || !SecurityUtils.validateLength(pollId, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MIN, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MAX)) {
    return { error: "Invalid poll ID." };
  }

  if (!SecurityUtils.isValidOptionIndex(optionIndex, 100)) { // Assuming max 100 options
    return { error: "Invalid option index." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optionally require login to vote
  // if (!user) return { error: 'You must be logged in to vote.' };

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

// DELETE POLL - ADDED AUTHORIZATION CHECK
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Validate ID format using security utilities
  if (!id || !SecurityUtils.validateLength(id, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MIN, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MAX)) {
    return { error: "Invalid poll ID." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  
  if (!user) {
    return { error: "You must be logged in to delete a poll." };
  }

  // Check if user owns the poll or is admin
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", id)
    .single();

  if (pollError) {
    return { error: "Poll not found." };
  }

  // Check if user owns the poll
  if (poll.user_id !== user.id) {
    // Check if user is admin (you'll need to implement this in your Supabase setup)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { error: "You can only delete your own polls." };
    }
  }

  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Sanitize inputs to prevent XSS using security utilities
  const sanitizedQuestion = SecurityUtils.sanitizeInput(question);
  const sanitizedOptions = options.map(option => SecurityUtils.sanitizeInput(option));

  // Validate input lengths using security configuration
  const { INPUT_LIMITS } = SECURITY_CONFIG;
  if (!SecurityUtils.validateLength(sanitizedQuestion, INPUT_LIMITS.QUESTION.MIN, INPUT_LIMITS.QUESTION.MAX)) {
    return { error: `Question must be between ${INPUT_LIMITS.QUESTION.MIN} and ${INPUT_LIMITS.QUESTION.MAX} characters.` };
  }

  if (sanitizedOptions.some(option => !SecurityUtils.validateLength(option, INPUT_LIMITS.OPTION.MIN, INPUT_LIMITS.OPTION.MAX))) {
    return { error: `Options must be between ${INPUT_LIMITS.OPTION.MIN} and ${INPUT_LIMITS.OPTION.MAX} characters.` };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ question: sanitizedQuestion, options: sanitizedOptions })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
