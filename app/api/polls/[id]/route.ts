// app/api/polls/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { SecurityUtils, SECURITY_CONFIG } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const id = params.id;

  // Validate ID format using security utilities
  if (!id || !SecurityUtils.validateLength(id, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MIN, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MAX)) {
    return NextResponse.json({ poll: null, error: "Invalid poll ID." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ poll: null, error: error.message }, { status: 404 });
  return NextResponse.json({ poll: data, error: null });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const id = params.id;

    // Validate ID format using security utilities
    if (!id || !SecurityUtils.validateLength(id, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MIN, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MAX)) {
        return NextResponse.json({ error: "Invalid poll ID." }, { status: 400 });
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
        return NextResponse.json({ error: "You must be logged in to delete a poll." }, { status: 401 });
    }

    // Check if user owns the poll or is admin
    const { data: poll, error: pollError } = await supabase
        .from("polls")
        .select("user_id")
        .eq("id", id)
        .single();

    if (pollError) {
        return NextResponse.json({ error: "Poll not found." }, { status: 404 });
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
            return NextResponse.json({ error: "You can only delete your own polls." }, { status: 403 });
        }
    }

    const { error } = await supabase.from("polls").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ error: null }, { status: 200 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const pollId = params.id;
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
        return NextResponse.json({ error: "You must be logged in to update a poll." }, { status: 401 });
    }

    // Only allow updating polls owned by the user
    const { error } = await supabase
        .from("polls")
        .update({ question: sanitizedQuestion, options: sanitizedOptions })
        .eq("id", pollId)
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: null }, { status: 200 });
}
