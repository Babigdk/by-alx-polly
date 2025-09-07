// app/api/polls/vote/route.ts
import { createClient } from "@/lib/supabase/server";
import { SecurityUtils, SECURITY_CONFIG } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { pollId, optionIndex } = await req.json();

  // Validate inputs using security utilities
  if (!pollId || !SecurityUtils.validateLength(pollId, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MIN, SECURITY_CONFIG.INPUT_LIMITS.POLL_ID.MAX)) {
    return NextResponse.json({ error: "Invalid poll ID." }, { status: 400 });
  }

  if (!SecurityUtils.isValidOptionIndex(optionIndex, 100)) { // Assuming max 100 options
    return NextResponse.json({ error: "Invalid option index." }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optionally require login to vote
  // if (!user) return NextResponse.json({ error: 'You must be logged in to vote.' }, { status: 401 });

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ error: null }, { status: 200 });
}
