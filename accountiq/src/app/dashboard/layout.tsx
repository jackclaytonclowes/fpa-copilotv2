import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [streakRes, xpRes, profileRes] = await Promise.all([
    supabase
      .from("user_streaks")
      .select("current_streak")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("user_xp")
      .select("amount")
      .eq("user_id", user.id),
    supabase
      .from("users")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  const streak = streakRes.data?.current_streak ?? 0;
  const totalXp = (xpRes.data ?? []).reduce((s, r) => s + r.amount, 0);
  const displayName = profileRes.data?.display_name ?? user.email ?? "You";
  const avatarUrl = profileRes.data?.avatar_url ?? null;

  return (
    <DashboardShell
      streak={streak}
      totalXp={totalXp}
      displayName={displayName}
      avatarUrl={avatarUrl}
    >
      {children}
    </DashboardShell>
  );
}
