import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BookOpen, Target } from "lucide-react";
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
    // Only XP earned today — fixes the daily goal bug
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

  // Sort modules and lessons within each course by order_index
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

  // Find first unlocked, incomplete lesson — respects the same lock rules as the course map
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

  // Completion % per course
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

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Keep up the momentum</p>
      </div>

      {/* Daily goal — XP earned today only */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Target className="h-4 w-4 text-teal-600" />
              Daily goal
            </div>
            <span className="text-xs text-gray-400">
              {todayXp} / {DAILY_GOAL_XP} XP today
            </span>
          </div>
          <Progress value={dailyProgress} className="h-3" />
          {dailyProgress >= 100 && (
            <p className="text-xs text-teal-600 font-medium mt-2">
              Goal complete! 🎉
            </p>
          )}
        </CardContent>
      </Card>

      {/* Continue learning — only shows a lesson the user can actually access */}
      {nextLesson ? (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Continue learning
          </h2>
          <Link href={`/dashboard/lessons/${nextLesson.id}`}>
            <Card className="hover:shadow-md transition-shadow active:scale-[0.99]">
              <CardContent className="pt-5">
                <div className="flex items-center gap-4">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: nextLesson.colorHex + "22" }}
                  >
                    <BookOpen
                      className="h-6 w-6"
                      style={{ color: nextLesson.colorHex }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">
                      {nextLesson.courseTitle}
                    </p>
                    <p className="font-semibold text-gray-900 truncate">
                      {nextLesson.title}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      ) : (
        completedIds.size > 0 && (
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-2xl mb-2">🎓</p>
              <p className="font-semibold text-gray-900">
                All caught up!
              </p>
              <p className="text-sm text-gray-400 mt-1">
                More lessons coming soon.
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* Course grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Your courses
        </h2>
        {courses.length === 0 ? (
          <Card>
            <CardContent className="pt-5 text-center text-gray-400 text-sm">
              No courses yet — check back soon.
            </CardContent>
          </Card>
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
                  <Card className="h-full hover:shadow-md transition-shadow active:scale-[0.99]">
                    <CardContent className="pt-4 pb-4">
                      <div
                        className="h-10 w-10 rounded-xl mb-3 flex items-center justify-center"
                        style={{
                          backgroundColor:
                            (course.color_hex ?? "#0d9488") + "22",
                        }}
                      >
                        <BookOpen
                          className="h-5 w-5"
                          style={{ color: course.color_hex ?? "#0d9488" }}
                        />
                      </div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {course.cima_paper}
                      </Badge>
                      <p className="font-semibold text-sm text-gray-900 leading-tight mb-2">
                        {course.title}
                      </p>
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-xs text-gray-400 mt-1">
                        {pct}% complete
                      </p>
                    </CardContent>
                  </Card>
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
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
