import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "./SignOutButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, streakRes, xpRes, achievementsRes] = await Promise.all([
    supabase
      .from("users")
      .select("display_name, avatar_url, daily_goal_minutes")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_streaks")
      .select("current_streak, longest_streak, last_activity_date")
      .eq("user_id", user.id)
      .single(),
    supabase.from("user_xp").select("amount").eq("user_id", user.id),
    supabase
      .from("user_achievements")
      .select("earned_at, achievements(title, description, icon)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false }),
  ]);

  const profile = profileRes.data;
  const streak = streakRes.data;
  const totalXp = (xpRes.data ?? []).reduce((s, r) => s + r.amount, 0);
  const achievements = (achievementsRes.data ?? []) as unknown as Array<{
    earned_at: string;
    achievements: { title: string; description: string; icon: string } | null;
  }>;

  const displayName = profile?.display_name ?? user.email ?? "Learner";

  return (
    <div className="max-w-lg mx-auto">
      {/* Profile hero */}
      <div className="ink-card rounded-none px-5 pt-6 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center text-ink text-2xl font-bold uppercase shrink-0"
            style={{ background: "#D4F04A" }}
          >
            {displayName[0]}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white leading-tight">
              {displayName}
            </h1>
            <p className="text-sand-400 text-sm mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="premium-numeral text-3xl text-white">
              {streak?.current_streak ?? 0}
            </p>
            <p className="text-xs text-sand-400 mt-1">Day streak 🔥</p>
          </div>
          <div className="text-center border-x border-white/10">
            <p className="premium-numeral text-3xl" style={{ color: "#D4F04A" }}>
              {totalXp.toLocaleString()}
            </p>
            <p className="text-xs text-sand-400 mt-1">Total XP ⭐</p>
          </div>
          <div className="text-center">
            <p className="premium-numeral text-3xl text-white">
              {achievements.length}
            </p>
            <p className="text-xs text-sand-400 mt-1">Achievements 🏆</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* Longest streak */}
        {streak && streak.longest_streak > 0 && (
          <div className="premium-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-sand-500 uppercase tracking-widest mb-1">
                Longest streak
              </p>
              <p className="font-display text-2xl font-bold text-ink">
                {streak.longest_streak} days
              </p>
            </div>
            <span className="text-3xl">🔥</span>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-sand-500 uppercase tracking-[0.1em] mb-3">
              Achievements
            </h2>
            <div className="space-y-2">
              {achievements.map((a, i) => (
                <div key={i} className="premium-card px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl shrink-0">
                    {a.achievements?.icon ?? "🏅"}
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-ink">
                      {a.achievements?.title ?? "Achievement"}
                    </p>
                    <p className="text-xs text-sand-500 mt-0.5">
                      {a.achievements?.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <SignOutButton />
      </div>
    </div>
  );
}
