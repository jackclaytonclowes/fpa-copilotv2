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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-teal-700 text-base tracking-tight">
          AccountIQ
        </span>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm font-semibold text-orange-500">
            <span>🔥</span>
            <span>{streak}</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold text-yellow-600">
            <span>⭐</span>
            <span>{totalXp.toLocaleString()}</span>
          </div>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover border-2 border-teal-200"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-teal-100 border-2 border-teal-200 flex items-center justify-center text-teal-700 text-xs font-bold uppercase">
              {displayName[0]}
            </div>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 flex">
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
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                active ? "text-teal-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${active ? "stroke-teal-600" : ""}`}
                strokeWidth={active ? 2.5 : 2}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
