import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

export default async function CoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [coursesRes, lessonsRes, progressRes] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, cima_paper, color_hex, description")
      .eq("is_published", true)
      .order("order_index"),
    supabase
      .from("lessons")
      .select("id, modules!inner(course_id)")
      .eq("is_published", true),
    supabase
      .from("user_progress")
      .select("lesson_id, status")
      .eq("user_id", user.id)
      .eq("status", "completed"),
  ]);

  const courses = coursesRes.data ?? [];
  const allLessons = (lessonsRes.data ?? []) as unknown as Array<{ id: string; modules: { course_id: string } }>;
  const completed = new Set((progressRes.data ?? []).map((p) => p.lesson_id));

  const courseStats: Record<string, { done: number; total: number }> = {};
  for (const l of allLessons) {
    const cid = l.modules.course_id;
    if (!courseStats[cid]) courseStats[cid] = { done: 0, total: 0 };
    courseStats[cid].total++;
    if (completed.has(l.id)) courseStats[cid].done++;
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-1">
        Courses
      </h1>
      <p className="text-sand-500 text-sm mb-6">Your CIMA learning paths</p>

      <div className="space-y-3">
        {courses.map((course) => {
          const stat = courseStats[course.id] ?? { done: 0, total: 0 };
          const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
          const done = pct === 100;
          return (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
              <div className="premium-card p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: (course.color_hex ?? "#0d9488") + "18" }}
                  >
                    <BookOpen
                      className="h-6 w-6"
                      style={{ color: course.color_hex ?? "#0d9488" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="citron-badge">{course.cima_paper}</span>
                      {done && <span className="mint-badge">Complete</span>}
                    </div>
                    <p className="font-semibold text-ink text-sm leading-snug mb-2">
                      {course.title}
                    </p>
                    <div className="h-1.5 w-full rounded-full bg-sand-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: done ? "#7EEBC7" : "#D4F04A",
                        }}
                      />
                    </div>
                    <p className="text-xs text-sand-500 mt-1">
                      {stat.done}/{stat.total} lessons · {pct}%
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-sand-400 shrink-0" />
                </div>
              </div>
            </Link>
          );
        })}
        {courses.length === 0 && (
          <div className="premium-card p-8 text-center">
            <p className="text-sand-500 text-sm">
              No courses available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
