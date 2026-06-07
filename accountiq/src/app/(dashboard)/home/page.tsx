import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BookOpen, Target } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [coursesRes, progressRes, streakRes] = await Promise.all([
    supabase
      .from("courses")
      .select("id, slug, title, cima_paper, color_hex, description")
      .eq("is_published", true)
      .order("order_index"),
    supabase
      .from("user_progress")
      .select("lesson_id, status, xp_earned")
      .eq("user_id", user.id),
    supabase
      .from("user_streaks")
      .select("current_streak, last_activity_date")
      .eq("user_id", user.id)
      .single(),
  ]);

  const courses = coursesRes.data ?? [];
  const progress = progressRes.data ?? [];
  const streak = streakRes.data;

  const completedIds = new Set(
    progress.filter((p) => p.status === "completed").map((p) => p.lesson_id)
  );

  // Find the next incomplete lesson across all courses
  const lessonsRes = await supabase
    .from("lessons")
    .select("id, title, module_id, modules!inner(course_id, courses!inner(title, color_hex, id))")
    .eq("is_published", true)
    .order("order_index");

  const allLessons = (lessonsRes.data ?? []) as unknown as Array<{
    id: string;
    title: string;
    module_id: string;
    modules: { course_id: string; courses: { title: string; color_hex: string; id: string } };
  }>;

  const nextLesson = allLessons.find((l) => !completedIds.has(l.id));

  // Build course completion percentages
  const courseCompletions: Record<string, { done: number; total: number }> = {};
  for (const lesson of allLessons) {
    const cid = lesson.modules.course_id;
    if (!courseCompletions[cid]) courseCompletions[cid] = { done: 0, total: 0 };
    courseCompletions[cid].total++;
    if (completedIds.has(lesson.id)) courseCompletions[cid].done++;
  }

  const DAILY_GOAL_XP = 50;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayXp = progress
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + (p.xp_earned ?? 0), 0);
  const dailyProgress = Math.min(100, Math.round((todayXp / DAILY_GOAL_XP) * 100));

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good {getGreeting()}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Keep up the momentum</p>
      </div>

      {/* Daily goal */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Target className="h-4 w-4 text-teal-600" />
              Daily goal
            </div>
            <span className="text-xs text-gray-400">
              {todayXp}/{DAILY_GOAL_XP} XP
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

      {/* Continue learning */}
      {nextLesson && (
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
                    style={{ backgroundColor: nextLesson.modules.courses.color_hex + "22" }}
                  >
                    <BookOpen
                      className="h-6 w-6"
                      style={{ color: nextLesson.modules.courses.color_hex }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">
                      {nextLesson.modules.courses.title}
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
      )}

      {/* Courses grid */}
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
              const comp = courseCompletions[course.id] ?? { done: 0, total: 0 };
              const pct = comp.total > 0 ? Math.round((comp.done / comp.total) * 100) : 0;
              return (
                <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow active:scale-[0.99]">
                    <CardContent className="pt-4 pb-4">
                      <div
                        className="h-10 w-10 rounded-xl mb-3 flex items-center justify-center"
                        style={{ backgroundColor: (course.color_hex ?? "#0d9488") + "22" }}
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
                      <p className="text-xs text-gray-400 mt-1">{pct}% complete</p>
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
