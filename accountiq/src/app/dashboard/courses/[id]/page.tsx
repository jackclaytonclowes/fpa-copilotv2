import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock, Circle, ChevronLeft, Clock, Star } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  xp_reward: number;
  estimated_minutes: number;
  is_published: boolean;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

export default async function CourseMapPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [courseRes, modulesRes, progressRes] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, description, cima_paper, color_hex")
      .eq("id", params.id)
      .single(),
    supabase
      .from("modules")
      .select(`
        id, title, order_index,
        lessons(id, title, order_index, xp_reward, estimated_minutes, is_published)
      `)
      .eq("course_id", params.id)
      .eq("is_published", true)
      .order("order_index"),
    supabase
      .from("user_progress")
      .select("lesson_id, status")
      .eq("user_id", user.id),
  ]);

  if (!courseRes.data) notFound();

  const course = courseRes.data;
  const modules = (modulesRes.data ?? []) as Module[];
  const completedIds = new Set(
    (progressRes.data ?? [])
      .filter((p) => p.status === "completed")
      .map((p) => p.lesson_id)
  );

  // Sort lessons within each module
  for (const mod of modules) {
    mod.lessons = (mod.lessons ?? [])
      .filter((l) => l.is_published)
      .sort((a, b) => a.order_index - b.order_index);
  }
  modules.sort((a, b) => a.order_index - b.order_index);

  // Determine which lessons are unlocked
  // First lesson of each module is unlocked if previous module's last lesson is done (or it's the first module)
  function isUnlocked(modIdx: number, lesIdx: number): boolean {
    if (modIdx === 0 && lesIdx === 0) return true;
    if (lesIdx > 0) {
      const prev = modules[modIdx].lessons[lesIdx - 1];
      return completedIds.has(prev.id);
    }
    // First lesson of module N: need last lesson of module N-1 completed
    const prevMod = modules[modIdx - 1];
    if (!prevMod || prevMod.lessons.length === 0) return true;
    return completedIds.has(prevMod.lessons[prevMod.lessons.length - 1].id);
  }

  const color = course.color_hex ?? "#0d9488";

  return (
    <div className="max-w-lg mx-auto">
      {/* Course header */}
      <div
        className="px-4 pt-6 pb-8"
        style={{ backgroundColor: color + "18" }}
      >
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center text-sm text-gray-500 mb-4 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          All courses
        </Link>
        <Badge variant="outline" className="mb-2" style={{ borderColor: color, color }}>
          {course.cima_paper}
        </Badge>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{course.title}</h1>
        {course.description && (
          <p className="text-sm text-gray-600">{course.description}</p>
        )}
      </div>

      {/* Lesson path */}
      <div className="px-4 py-6 space-y-8">
        {modules.map((mod, modIdx) => (
          <div key={mod.id}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              {mod.title}
            </h2>
            <div className="relative">
              {/* Vertical connecting line */}
              {mod.lessons.length > 1 && (
                <div
                  className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200"
                  aria-hidden
                />
              )}
              <div className="space-y-4">
                {mod.lessons.map((lesson, lesIdx) => {
                  const done = completedIds.has(lesson.id);
                  const unlocked = isUnlocked(modIdx, lesIdx);
                  const isCurrent = !done && unlocked;

                  const node = (
                    <div
                      key={lesson.id}
                      className={`flex items-center gap-4 ${
                        unlocked ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      {/* Node icon */}
                      <div
                        className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          done
                            ? "bg-teal-600 text-white"
                            : isCurrent
                            ? "bg-white border-4 border-teal-600 animate-pulse-ring text-teal-600"
                            : "bg-gray-100 text-gray-300 border-2 border-gray-200"
                        }`}
                      >
                        {done ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : isCurrent ? (
                          <Circle className="h-5 w-5 fill-teal-600" />
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </div>

                      {/* Lesson info */}
                      <div
                        className={`flex-1 rounded-2xl border p-3 transition-all ${
                          done
                            ? "border-teal-100 bg-teal-50"
                            : isCurrent
                            ? "border-teal-200 bg-white shadow-sm"
                            : "border-gray-100 bg-gray-50 opacity-60"
                        }`}
                      >
                        <p
                          className={`font-semibold text-sm leading-tight ${
                            done
                              ? "text-teal-800"
                              : isCurrent
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.estimated_minutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {lesson.xp_reward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  );

                  return unlocked ? (
                    <Link
                      key={lesson.id}
                      href={`/dashboard/lessons/${lesson.id}`}
                    >
                      {node}
                    </Link>
                  ) : (
                    <div key={lesson.id}>{node}</div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {modules.length === 0 && (
          <p className="text-center text-gray-400 py-12">No lessons yet.</p>
        )}
      </div>
    </div>
  );
}
