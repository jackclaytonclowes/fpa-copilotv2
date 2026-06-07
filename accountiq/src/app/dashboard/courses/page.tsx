import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Courses</h1>
      <p className="text-gray-500 text-sm mb-6">Your CIMA learning paths</p>

      <div className="space-y-3">
        {courses.map((course) => {
          const stat = courseStats[course.id] ?? { done: 0, total: 0 };
          const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
          return (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
              <Card className="hover:shadow-md transition-shadow active:scale-[0.99]">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: (course.color_hex ?? "#0d9488") + "22" }}
                    >
                      <BookOpen
                        className="h-6 w-6"
                        style={{ color: course.color_hex ?? "#0d9488" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {course.cima_paper}
                        </Badge>
                      </div>
                      <p className="font-semibold text-gray-900">{course.title}</p>
                      <div className="mt-2 space-y-1">
                        <Progress value={pct} className="h-1.5" />
                        <p className="text-xs text-gray-400">
                          {stat.done}/{stat.total} lessons · {pct}%
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {courses.length === 0 && (
          <p className="text-center text-gray-400 py-12">No courses available yet.</p>
        )}
      </div>
    </div>
  );
}
