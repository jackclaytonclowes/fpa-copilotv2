import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import LessonClient from "./LessonClient";
import type { LessonPageData, Question } from "@/types";

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
        id, title, content, xp_reward, estimated_minutes, module_id, order_index, is_published,
        modules!inner(
          course_id, title,
          courses!inner(id, title, color_hex)
        )
      `)
      .eq("id", params.id)
      .single(),
    supabase
      .from("questions")
      .select(
        "id, question_type, prompt, options, correct_answer, explanation, order_index"
      )
      .eq("lesson_id", params.id)
      .order("order_index"),
    supabase
      .from("user_progress")
      .select("status, score_percent")
      .eq("user_id", user.id)
      .eq("lesson_id", params.id)
      .single(),
  ]);

  if (!lessonRes.data) notFound();

  const lesson = lessonRes.data as unknown as LessonPageData;
  const questions = (questionsRes.data ?? []) as unknown as Question[];
  const existingProgress = progressRes.data;

  return (
    <ErrorBoundary>
      <LessonClient
        lesson={lesson}
        questions={questions}
        userId={user.id}
        alreadyCompleted={existingProgress?.status === "completed"}
        previousScore={existingProgress?.score_percent ?? null}
      />
    </ErrorBoundary>
  );
}
