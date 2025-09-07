// app/api/polls/route.ts
import { createClient } from "@/lib/supabase/server";
import { SecurityUtils, SECURITY_CONFIG } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const formData = await req.formData();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!question || options.length < 2) {
    return NextResponse.json({ error: "Please provide a question and at least two options." }, { status: 400 });
  }

  // Sanitize inputs to prevent XSS using security utilities
  const sanitizedQuestion = SecurityUtils.sanitizeInput(question);
  const sanitizedOptions = options.map(option => SecurityUtils.sanitizeInput(option));

  // Validate input lengths using security configuration
  const { INPUT_LIMITS } = SECURITY_CONFIG;
  if (!SecurityUtils.validateLength(sanitizedQuestion, INPUT_LIMITS.QUESTION.MIN, INPUT_LIMITS.QUESTION.MAX)) {
    return NextResponse.json({ error: `Question must be between ${INPUT_LIMITS.QUESTION.MIN} and ${INPUT_LIMITS.QUESTION.MAX} characters.` }, { status: 400 });
  }

  if (sanitizedOptions.some(option => !SecurityUtils.validateLength(option, INPUT_LIMITS.OPTION.MIN, INPUT_LIMITS.OPTION.MAX))) {
    return NextResponse.json({ error: `Options must be between ${INPUT_LIMITS.OPTION.MIN} and ${INPUT_LIMITS.OPTION.MAX} characters.` }, { status: 400 });
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to create a poll." }, { status: 401 });
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: sanitizedQuestion,
      options: sanitizedOptions,
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: null }, { status: 201 });
}

export async function GET() {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ polls: [], error: "Not authenticated" }, { status: 401 });
  
    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
  
    if (error) return NextResponse.json({ polls: [], error: error.message }, { status: 500 });
    return NextResponse.json({ polls: data ?? [], error: null });
  }
