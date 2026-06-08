import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Lock, ChevronLeft, Clock, Zap } from "lucide-react";

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

  for (const mod of modules) {
    mod.lessons = (mod.lessons ?? [])
      .filter((l) => l.is_published)
      .sort((a, b) => a.order_index - b.order_index);
  }
  modules.sort((a, b) => a.order_index - b.order_index);

  function isUnlocked(modIdx: number, lesIdx: number): boolean {
    if (modIdx === 0 && lesIdx === 0) return true;
    if (lesIdx > 0) {
      const prev = modules[modIdx].lessons[lesIdx - 1];
      return completedIds.has(prev.id);
    }
    const prevMod = modules[modIdx - 1];
    if (!prevMod || prevMod.lessons.length === 0) return true;
    return completedIds.has(prevMod.lessons[prevMod.lessons.length - 1].id);
  }

  const color = course.color_hex ?? "#0d9488";

  // Total progress
  let totalDone = 0;
  let totalLessons = 0;
  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      totalLessons++;
      if (completedIds.has(lesson.id)) totalDone++;
    }
  }
  const pct = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0;

  return (
    <div className="max-w-lg mx-auto">
      {/* Course hero header */}
      <div className="ink-card mx-0 rounded-none px-5 pt-5 pb-8">
        {/* Back link */}
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1 text-sand-400 text-sm mb-5 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          All courses
        </Link>

        <span
          className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
          style={{ background: color + "30", color: color }}
        >
          {course.cima_paper}
        </span>

        <h1 className="font-display text-2xl font-bold text-white mb-2 leading-tight">
          {course.title}
        </h1>
        {course.description && (
          <p className="text-sand-400 text-sm leading-relaxed mb-4">
            {course.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: "#D4F04A" }}
            />
          </div>
          <span className="text-xs font-bold text-sand-400 shrink-0">
            {totalDone}/{totalLessons}
          </span>
        </div>
      </div>

      {/* Lesson path */}
      <div className="px-4 py-6 space-y-10">
        {modules.map((mod, modIdx) => (
          <div key={mod.id}>
            {/* Module header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-sand-200" />
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-sand-500 px-1">
                {mod.title}
              </span>
              <div className="h-px flex-1 bg-sand-200" />
            </div>

            <div className="relative">
              {/* Vertical connecting line */}
              {mod.lessons.length > 1 && (
                <div
                  className="absolute left-6 top-6 bottom-6 w-px"
                  style={{ background: "#E8E0D4" }}
                  aria-hidden
                />
              )}

              <div className="space-y-4">
                {mod.lessons.map((lesson, lesIdx) => {
                  const done = completedIds.has(lesson.id);
                  const unlocked = isUnlocked(modIdx, lesIdx);
                  const isCurrent = !done && unlocked;

                  const nodeContent = (
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
                            ? "text-white"
                            : isCurrent
                            ? "bg-white border-[3px] citron-pulse"
                            : "bg-sand-100 border-2 border-sand-300"
                        }`}
                        style={
                          done
                            ? { background: color }
                            : isCurrent
                            ? { borderColor: "#D4F04A" }
                            : undefined
                        }
                      >
                        {done ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : isCurrent ? (
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ background: "#D4F04A" }}
                          />
                        ) : (
                          <Lock className="h-4 w-4 text-sand-400" />
                        )}
                      </div>

                      {/* Lesson card */}
                      <div
                        className={`flex-1 rounded-2xl border p-3 transition-all ${
                          done
                            ? "border-mint-200 bg-mint-50"
                            : isCurrent
                            ? "border-citron-200 bg-white shadow-sm"
                            : "border-sand-200 bg-sand-100/50 opacity-50"
                        }`}
                      >
                        <p
                          className={`font-semibold text-sm leading-tight ${
                            done
                              ? "text-teal-800"
                              : isCurrent
                              ? "text-ink"
                              : "text-sand-500"
                          }`}
                        >
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-sand-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.estimated_minutes}m
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
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
                      {nodeContent}
                    </Link>
                  ) : (
                    <div key={lesson.id}>{nodeContent}</div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {modules.length === 0 && (
          <p className="text-center text-sand-500 py-12">No lessons yet.</p>
        )}
      </div>
    </div>
  );
}
