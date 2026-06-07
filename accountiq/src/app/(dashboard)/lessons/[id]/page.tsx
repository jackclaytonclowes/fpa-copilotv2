import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import LessonClient from "./LessonClient";

interface ContentCard {
  type: "intro" | "explanation" | "table" | "worked_example";
  heading: string;
  body?: string;
  emoji?: string;
  key_terms?: Array<{ term: string; definition: string }>;
  rows?: string[][];
  headers?: string[];
  steps?: string[];
}

interface Question {
  id: string;
  question_type: string;
  prompt: string;
  options: string[] | null;
  correct_answer: string | string[];
  explanation: string;
  order_index: number;
}

export default async function LessonPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [lessonRes, questionsRes, progressRes] = await Promise.all([
    supabase
      .from("lessons")
      .select(`
        id, title, content, xp_reward, estimated_minutes,
        modules!inner(course_id, title, courses!inner(title, color_hex, id))
      `)
      .eq("id", params.id)
      .single(),
    supabase
      .from("questions")
      .select("id, question_type, prompt, options, correct_answer, explanation, order_index")
      .eq("lesson_id", params.id)
      .order("order_index"),
    supabase
      .from("user_progress")
      .select("status")
      .eq("user_id", user.id)
      .eq("lesson_id", params.id)
      .single(),
  ]);

  if (!lessonRes.data) notFound();

  const lesson = lessonRes.data as unknown as {
    id: string;
    title: string;
    content: ContentCard[];
    xp_reward: number;
    estimated_minutes: number;
    modules: {
      course_id: string;
      title: string;
      courses: { title: string; color_hex: string; id: string };
    };
  };

  return (
    <LessonClient
      lesson={lesson}
      questions={(questionsRes.data ?? []) as Question[]}
      alreadyCompleted={progressRes.data?.status === "completed"}
    />
  );
}
