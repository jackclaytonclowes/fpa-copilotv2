import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { message, lesson_id, history = [] } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Check daily message limit
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const countRes = await supabase
    .from("ai_tutor_conversations")
    .select("id, messages")
    .eq("user_id", user.id)
    .gte("created_at", todayStart.toISOString());

  const todayMessages = (countRes.data ?? []).reduce(
    (total, conv) =>
      total +
      ((conv.messages as Array<{ role: string }>) ?? []).filter(
        (m) => m.role === "user"
      ).length,
    0
  );

  if (todayMessages >= 10) {
    return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });
  }

  // Load lesson context if provided
  let lessonContext = "";
  if (lesson_id) {
    const lessonRes = await supabase
      .from("lessons")
      .select("title, content")
      .eq("id", lesson_id)
      .single();

    if (lessonRes.data) {
      const cards =
        (lessonRes.data.content as Array<{ heading?: string; body?: string }>) ?? [];
      const summary = cards
        .map((c) => `${c.heading ?? ""}: ${c.body ?? ""}`)
        .join(" ")
        .slice(0, 800);
      lessonContext = `Current lesson: "${lessonRes.data.title}". Content summary: ${summary}`;
    }
  }

  const system = `You are AccountIQ Tutor, an expert CIMA accounting teacher. ${
    lessonContext ? lessonContext + "." : ""
  } Be concise, encouraging, and use UK English. Show full working for calculations. Format answers with clear steps when appropriate. Keep responses under 300 words unless a detailed calculation is needed.`;

  const messages = [
    ...history
      .filter((m: { role: string; content: string }) => m.role !== "system")
      .slice(-8)
      .map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    { role: "user" as const, content: message },
  ];

  // Persist conversation once streaming completes
  async function persist(fullText: string) {
    const today = new Date().toISOString().slice(0, 10);
    const existingConvRes = await supabase
      .from("ai_tutor_conversations")
      .select("id, messages")
      .eq("user_id", user!.id)
      .eq("lesson_id", lesson_id ?? null)
      .gte("created_at", new Date(today).toISOString())
      .single();

    const newMessages = [
      ...((existingConvRes.data?.messages as Array<unknown>) ?? history),
      { role: "user", content: message },
      { role: "assistant", content: fullText },
    ];

    if (existingConvRes.data) {
      await supabase
        .from("ai_tutor_conversations")
        .update({ messages: newMessages, updated_at: new Date().toISOString() })
        .eq("id", existingConvRes.data.id);
    } else {
      await supabase.from("ai_tutor_conversations").insert({
        user_id: user!.id,
        lesson_id: lesson_id ?? null,
        messages: newMessages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  const ai = getAIProvider();
  const stream = await ai.streamChat({ system, messages, onComplete: persist });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
