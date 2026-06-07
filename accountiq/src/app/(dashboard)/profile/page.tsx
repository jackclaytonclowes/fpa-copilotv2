import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-teal-100 border-4 border-teal-200 flex items-center justify-center text-teal-700 text-2xl font-bold uppercase">
          {displayName[0]}
        </div>
        <div>
          <p className="font-bold text-xl text-gray-900">{displayName}</p>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-orange-500">
              🔥 {streak?.current_streak ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">Current streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">
              ⭐ {totalXp.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Total XP</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-teal-600">
              🏆 {achievements.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Achievements</p>
          </CardContent>
        </Card>
      </div>

      {streak && streak.longest_streak > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-gray-500">
              Longest streak:{" "}
              <span className="font-bold text-gray-900">
                {streak.longest_streak} days 🔥
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Achievements
          </h2>
          <div className="space-y-2">
            {achievements.map((a, i) => (
              <Card key={i}>
                <CardContent className="pt-3 pb-3 flex items-center gap-3">
                  <span className="text-2xl">
                    {a.achievements?.icon ?? "🏅"}
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {a.achievements?.title ?? "Achievement"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {a.achievements?.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <SignOutButton />
    </div>
  );
}
