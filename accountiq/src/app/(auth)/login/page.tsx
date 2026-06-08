"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface LoginFields {
  email: string;
  password: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>();

  async function onSubmit(data: LoginFields) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setError("root", { message: error.message });
    } else {
      router.push("/dashboard/home");
      router.refresh();
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError("root", { message: error.message });
  }

  return (
    <main className="min-h-screen bg-cream flex">
      {/* Left panel — ink hero (hidden on small screens) */}
      <div className="hidden md:flex flex-col justify-between w-1/2 ink-card rounded-none p-12">
        <div>
          <span className="font-display text-2xl font-bold text-white">
            Account<span style={{ color: "#D4F04A" }}>IQ</span>
          </span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Master CIMA,
            <br />
            <em className="not-italic" style={{ color: "#D4F04A" }}>one lesson at a time.</em>
          </h2>
          <p className="text-sand-400 text-base leading-relaxed">
            AI-powered accounting education built for CIMA professionals.
            Learn faster, retain more, progress with confidence.
          </p>
        </div>
        <p className="text-sand-500 text-sm">
          © {new Date().getFullYear()} AccountIQ
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="md:hidden mb-8 text-center">
            <span className="font-display text-2xl font-bold text-ink">
              Account<span style={{ color: "#D4F04A" }}>IQ</span>
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold text-ink mb-1">
            Welcome back
          </h1>
          <p className="text-sand-500 text-sm mb-8">
            Sign in to continue your learning journey
          </p>

          {/* Errors */}
          {(callbackError || errors.root) && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-5">
              {callbackError
                ? "Authentication failed. Please try again."
                : errors.root?.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                className={`w-full rounded-2xl border-2 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-citron-300 transition-all ${
                  errors.email ? "border-red-400" : "border-sand-200 focus:border-citron-400"
                }`}
                placeholder="you@example.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                className={`w-full rounded-2xl border-2 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-citron-300 transition-all ${
                  errors.password ? "border-red-400" : "border-sand-200 focus:border-citron-400"
                }`}
                placeholder="••••••••"
                {...register("password", {
                  required: "Password is required",
                })}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{ background: "#D4F04A", color: "#0C0E1A" }}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sand-200" />
            </div>
            <div className="relative flex justify-center text-xs text-sand-400">
              <span className="bg-cream px-3">or</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3.5 rounded-2xl border-2 border-sand-200 bg-white font-semibold text-sm text-ink flex items-center justify-center gap-2 hover:bg-sand-50 transition-all active:scale-[0.98]"
            onClick={handleGoogle}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-sand-500 mt-6">
            No account?{" "}
            <Link href="/signup" className="font-semibold text-ink hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
