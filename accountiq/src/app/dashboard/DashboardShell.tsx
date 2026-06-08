"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, MessageSquare, User } from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
  streak: number;
  totalXp: number;
  displayName: string;
  avatarUrl: string | null;
}

const NAV_ITEMS = [
  { href: "/dashboard/home", label: "Home", Icon: Home },
  { href: "/dashboard/courses", label: "Courses", Icon: BookOpen },
  { href: "/dashboard/tutor", label: "Tutor", Icon: MessageSquare },
  { href: "/dashboard/profile", label: "Profile", Icon: User },
];

export default function DashboardShell({
  children,
  streak,
  totalXp,
  displayName,
  avatarUrl,
}: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-cream-100">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-sand-200 px-5 h-14 flex items-center justify-between">
        <span
          className="font-display text-lg font-bold tracking-tight"
          style={{ color: "#0C0E1A" }}
        >
          Account<span style={{ color: "#D4F04A" }}>IQ</span>
        </span>

        <div className="flex items-center gap-3">
          {/* Streak */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100">
            <span className="text-sm leading-none">🔥</span>
            <span className="text-xs font-bold text-orange-600">{streak}</span>
          </div>
          {/* XP */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-citron-50 border border-citron-200">
            <span className="text-sm leading-none">⭐</span>
            <span className="text-xs font-bold text-ink-900">{totalXp.toLocaleString()}</span>
          </div>
          {/* Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-sand-200"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-ink flex items-center justify-center text-citron text-xs font-bold uppercase ring-2 ring-sand-200">
              {displayName[0]}
            </div>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-sand-200">
        <div className="flex max-w-lg mx-auto">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active =
              href === "/dashboard/courses"
                ? pathname.startsWith("/dashboard/courses") ||
                  pathname.startsWith("/dashboard/lessons")
                : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative"
              >
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: "#D4F04A" }}
                  />
                )}
                <Icon
                  className="h-5 w-5 transition-colors"
                  style={{ color: active ? "#0C0E1A" : "#AFA090" }}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span
                  className="text-xs font-medium transition-colors"
                  style={{ color: active ? "#0C0E1A" : "#AFA090" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
