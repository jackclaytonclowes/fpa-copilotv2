import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, BookOpen } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import type { CourseWithModules, LessonSummary } from "@/types";

const DAILY_GOAL_XP = 50;

interface NextLesson extends LessonSummary {
  courseTitle: string;
  colorHex: string;
  courseId: string;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [coursesRes, progressRes, todayXpRes] = await Promise.all([
    supabase
      .from("courses")
      .select(`
        id, slug, title, description, cima_paper, color_hex, order_index, is_published,
        modules(
          id, order_index, title, is_published, course_id,
          lessons(id, title, order_index, xp_reward, estimated_minutes, is_published)
        )
      `)
      .eq("is_published", true)
      .order("order_index"),
    supabase
      .from("user_progress")
      .select("lesson_id, status")
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("user_xp")
      .select("amount")
      .eq("user_id", user.id)
      .gte("earned_at", todayStart.toISOString()),
  ]);

  const courses = (coursesRes.data ?? []) as unknown as CourseWithModules[];
  const completedIds = new Set(
    (progressRes.data ?? []).map((p) => p.lesson_id)
  );
  const todayXp = (todayXpRes.data ?? []).reduce(
    (s, r) => s + r.amount,
    0
  );

  for (const course of courses) {
    course.modules = (course.modules ?? []).sort(
      (a, b) => a.order_index - b.order_index
    );
    for (const mod of course.modules) {
      mod.lessons = (mod.lessons ?? [])
        .filter((l) => l.is_published)
        .sort((a, b) => a.order_index - b.order_index);
    }
  }

  let nextLesson: NextLesson | null = null;

  outer: for (const course of courses) {
    for (let mi = 0; mi < course.modules.length; mi++) {
      const mod = course.modules[mi];
      for (let li = 0; li < mod.lessons.length; li++) {
        const lesson = mod.lessons[li];
        if (completedIds.has(lesson.id)) continue;

        let unlocked = false;
        if (mi === 0 && li === 0) {
          unlocked = true;
        } else if (li > 0) {
          unlocked = completedIds.has(mod.lessons[li - 1].id);
        } else {
          const prevMod = course.modules[mi - 1];
          unlocked =
            !!prevMod &&
            prevMod.lessons.length > 0 &&
            completedIds.has(prevMod.lessons[prevMod.lessons.length - 1].id);
        }

        if (unlocked) {
          nextLesson = {
            ...lesson,
            courseTitle: course.title,
            colorHex: course.color_hex,
            courseId: course.id,
          };
          break outer;
        }
      }
    }
  }

  const courseStats: Record<string, { done: number; total: number }> = {};
  for (const course of courses) {
    let done = 0;
    let total = 0;
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        total++;
        if (completedIds.has(lesson.id)) done++;
      }
    }
    courseStats[course.id] = { done, total };
  }

  const dailyProgress = Math.min(
    100,
    Math.round((todayXp / DAILY_GOAL_XP) * 100)
  );
  const goalMet = dailyProgress >= 100;

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      {/* Ink hero card — greeting + daily goal */}
      <div className="ink-card p-6">
        {/* Greeting */}
        <p className="text-sand-300 text-sm font-medium mb-1">
          {getGreeting()}
        </p>
        <h1 className="font-display text-3xl font-bold text-white mb-4 leading-tight">
          Keep building
          <br />
          <em className="not-italic" style={{ color: "#D4F04A" }}>momentum.</em>
        </h1>

        {/* Daily goal row */}
        <div className="flex items-center gap-4">
          <ProgressRing
            value={dailyProgress}
            size={64}
            strokeWidth={5}
            color={goalMet ? "#7EEBC7" : "#D4F04A"}
            trackColor="rgba(255,255,255,0.12)"
          >
            <span className="text-xs font-bold text-white">
              {dailyProgress}%
            </span>
          </ProgressRing>
          <div>
            <p className="text-white font-semibold text-sm">
              {goalMet ? "Goal complete!" : "Daily goal"}
            </p>
            <p className="text-sand-400 text-xs mt-0.5">
              {todayXp} / {DAILY_GOAL_XP} XP today
            </p>
            {goalMet && (
              <p className="text-mint-300 text-xs font-medium mt-0.5">
                🎉 Excellent work
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Continue learning */}
      {nextLesson ? (
        <div>
          <h2 className="text-xs font-bold text-sand-500 uppercase tracking-[0.1em] mb-3">
            Continue learning
          </h2>
          <Link href={`/dashboard/lessons/${nextLesson.id}`}>
            <div className="premium-card p-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: nextLesson.colorHex + "18" }}
                >
                  <BookOpen
                    className="h-6 w-6"
                    style={{ color: nextLesson.colorHex }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-sand-500 mb-0.5">
                    {nextLesson.courseTitle}
                  </p>
                  <p className="font-semibold text-ink text-sm leading-snug truncate">
                    {nextLesson.title}
                  </p>
                  <p className="text-xs text-sand-500 mt-0.5">
                    {nextLesson.estimated_minutes} min · {nextLesson.xp_reward} XP
                  </p>
                </div>
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "#D4F04A" }}
                >
                  <ChevronRight className="h-4 w-4 text-ink" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      ) : (
        completedIds.size > 0 && (
          <div className="premium-card p-6 text-center">
            <p className="text-4xl mb-3">🎓</p>
            <h3 className="font-display font-bold text-lg text-ink mb-1">
              All caught up!
            </h3>
            <p className="text-sm text-sand-500">
              More lessons coming soon.
            </p>
          </div>
        )
      )}

      {/* Course grid */}
      <div>
        <h2 className="text-xs font-bold text-sand-500 uppercase tracking-[0.1em] mb-3">
          Your courses
        </h2>
        {courses.length === 0 ? (
          <div className="premium-card p-6 text-center text-sand-500 text-sm">
            No courses yet — check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {courses.map((course) => {
              const stat = courseStats[course.id] ?? { done: 0, total: 0 };
              const pct =
                stat.total > 0
                  ? Math.round((stat.done / stat.total) * 100)
                  : 0;
              return (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                >
                  <div className="premium-card p-4 h-full">
                    {/* Course colour dot */}
                    <div
                      className="h-10 w-10 rounded-xl mb-3 flex items-center justify-center"
                      style={{ backgroundColor: (course.color_hex ?? "#0d9488") + "18" }}
                    >
                      <BookOpen
                        className="h-5 w-5"
                        style={{ color: course.color_hex ?? "#0d9488" }}
                      />
                    </div>
                    <span className="citron-badge mb-2 inline-block">
                      {course.cima_paper}
                    </span>
                    <p className="font-semibold text-sm text-ink leading-tight mb-3">
                      {course.title}
                    </p>
                    {/* Progress track */}
                    <div className="h-1.5 w-full rounded-full bg-sand-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: pct === 100 ? "#7EEBC7" : "#D4F04A",
                        }}
                      />
                    </div>
                    <p className="text-xs text-sand-500 mt-1.5">
                      {pct}% complete
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
