import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const lessonId = params.id;
  const body = await request.json().catch(() => ({}));
  const answers: Record<string, string> = body.answers ?? {};

  // Fetch lesson xp_reward and questions
  const [lessonRes, questionsRes, progressRes] = await Promise.all([
    supabase
      .from("lessons")
      .select("xp_reward")
      .eq("id", lessonId)
      .single(),
    supabase
      .from("questions")
      .select("id, correct_answer")
      .eq("lesson_id", lessonId),
    supabase
      .from("user_progress")
      .select("id, status, attempts")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .single(),
  ]);

  if (!lessonRes.data) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const xpReward = lessonRes.data.xp_reward ?? 10;
  const questions = questionsRes.data ?? [];

  // Calculate score
  let correctCount = 0;
  for (const q of questions) {
    const submitted = answers[q.id];
    if (
      submitted !== undefined &&
      String(submitted).toLowerCase().trim() ===
        String(q.correct_answer).toLowerCase().trim()
    ) {
      correctCount++;
    }
  }
  const scorePercent =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 100;

  const existingProgress = progressRes.data;
  const alreadyCompleted = existingProgress?.status === "completed";

  // Upsert progress
  const now = new Date().toISOString();
  await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: "completed",
      score_percent: scorePercent,
      xp_earned: xpReward,
      attempts: (existingProgress?.attempts ?? 0) + 1,
      first_completed_at: alreadyCompleted ? undefined : now,
    },
    { onConflict: "user_id,lesson_id" }
  );

  // Award XP only on first completion
  if (!alreadyCompleted) {
    await supabase.from("user_xp").insert({
      user_id: user.id,
      amount: xpReward,
      reason: "lesson_complete",
      reference_id: lessonId,
      earned_at: now,
    });
  }

  // Update streak
  const today = new Date().toISOString().slice(0, 10);
  const streakRes = await supabase
    .from("user_streaks")
    .select("id, current_streak, longest_streak, last_activity_date")
    .eq("user_id", user.id)
    .single();

  let currentStreak = 1;
  let longestStreak = 1;
  const streakData = streakRes.data;

  if (streakData) {
    const last = streakData.last_activity_date;
    currentStreak = streakData.current_streak ?? 0;
    longestStreak = streakData.longest_streak ?? 0;

    if (last !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      if (last === yesterdayStr) {
        currentStreak = currentStreak + 1;
      } else {
        currentStreak = 1;
      }

      longestStreak = Math.max(longestStreak, currentStreak);
    }
  }

  await supabase.from("user_streaks").upsert(
    {
      user_id: user.id,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
    },
    { onConflict: "user_id" }
  );

  // Check achievements
  const achievementsEarned: string[] = [];

  if (!alreadyCompleted) {
    const [allProgressRes, achievementDefsRes, existingAchievementsRes] =
      await Promise.all([
        supabase
          .from("user_progress")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "completed"),
        supabase
          .from("achievements")
          .select("id, slug, title, trigger_type, trigger_value"),
        supabase
          .from("user_achievements")
          .select("achievement_id")
          .eq("user_id", user.id),
      ]);

    const completedCount = (allProgressRes.data ?? []).length;
    const earnedIds = new Set(
      (existingAchievementsRes.data ?? []).map((a) => a.achievement_id)
    );

    for (const ach of achievementDefsRes.data ?? []) {
      if (earnedIds.has(ach.id)) continue;

      let qualifies = false;
      if (ach.trigger_type === "lessons_completed") {
        qualifies = completedCount >= (ach.trigger_value?.count ?? 1);
      } else if (ach.trigger_type === "streak_days") {
        qualifies = currentStreak >= (ach.trigger_value?.days ?? 7);
      }

      if (qualifies) {
        await supabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_id: ach.id,
          earned_at: now,
        });
        achievementsEarned.push(ach.title);
      }
    }
  }

  // Return total XP
  const totalXpRes = await supabase
    .from("user_xp")
    .select("amount")
    .eq("user_id", user.id);
  const newTotalXp = (totalXpRes.data ?? []).reduce(
    (s, r) => s + r.amount,
    0
  );

  return NextResponse.json({
    xp_earned: alreadyCompleted ? 0 : xpReward,
    new_total_xp: newTotalXp,
    score_percent: scorePercent,
    streak: currentStreak,
    achievements_earned: achievementsEarned,
  });
}
