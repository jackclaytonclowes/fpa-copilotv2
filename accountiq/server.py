"""AccountIQ — serves static files, AI Tutor, and user-state persistence.

Supabase schema notes:
  - Existing tables (users, user_xp, user_streaks, user_progress, mock_exams,
    ai_tutor_conversations) are from the original AccountIQ MVP — left untouched.
  - New table: user_state (JSON blob for onboarding prefs + lesson progress).
    Run accountiq/supabase/schema.sql to create it.
"""
import os
from datetime import datetime, timezone
from pathlib import Path
from functools import lru_cache

from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

BASE_DIR = Path(__file__).parent
app = FastAPI(title="AccountIQ")


# ── Supabase client (service role — server-side only) ─────────────────────────

@lru_cache(maxsize=1)
def _supabase():
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        return None
    from supabase import create_client
    return create_client(url, key)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def get_current_user(authorization: str = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.removeprefix("Bearer ").strip()
    sb = _supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    try:
        resp = sb.auth.get_user(token)
        if not resp.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return resp.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ── Config endpoint (returns public Supabase keys to the browser) ─────────────

@app.get("/api/config")
async def get_config():
    return {
        "supabaseUrl":     os.environ.get("SUPABASE_URL", ""),
        "supabaseAnonKey": os.environ.get("SUPABASE_ANON_KEY", ""),
    }


# ── User state persistence ────────────────────────────────────────────────────
# Stores the AccountIQStore JSON blob in user_state, and also reads
# XP + streak from the existing user_xp / user_streaks tables so that
# any progress from the original app carries over.

class StateBody(BaseModel):
    state: dict


@app.get("/api/aiq/state")
async def load_state(user=Depends(get_current_user)):
    sb = _supabase()
    uid = str(user.id)
    try:
        # Load our JSON state blob
        blob_res = (
            sb.table("user_state")
            .select("state")
            .eq("user_id", uid)
            .maybe_single()
            .execute()
        )
        state = blob_res.data["state"] if blob_res.data else {}

        # Enrich with XP from existing user_xp table (if it exists)
        try:
            xp_res = (
                sb.table("user_xp")
                .select("amount")
                .eq("user_id", uid)
                .execute()
            )
            if xp_res.data:
                legacy_xp = sum(r["amount"] for r in xp_res.data if r.get("amount"))
                state["xp"] = max(state.get("xp", 0), legacy_xp)
        except Exception:
            pass  # table may not exist or have different schema

        # Enrich with streak from existing user_streaks table (if it exists)
        try:
            streak_res = (
                sb.table("user_streaks")
                .select("current_streak, last_activity_date")
                .eq("user_id", uid)
                .maybe_single()
                .execute()
            )
            if streak_res.data:
                legacy_streak = streak_res.data.get("current_streak", 0) or 0
                state["streak"] = max(state.get("streak", 0), legacy_streak)
                if streak_res.data.get("last_activity_date"):
                    state.setdefault("streakLastDate", streak_res.data["last_activity_date"])
        except Exception:
            pass

        return {"state": state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/aiq/state")
async def save_state(body: StateBody, user=Depends(get_current_user)):
    sb = _supabase()
    uid = str(user.id)
    try:
        sb.table("user_state").upsert(
            {
                "user_id":    uid,
                "state":      body.state,
                "updated_at": _now_iso(),
            },
            on_conflict="user_id",
        ).execute()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── AI Tutor ──────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are AccountIQ Tutor, an expert CIMA Certificate in Business Accounting teacher. "
    "Be concise, encouraging, and use UK English. "
    "Show full working for calculations. "
    "Format answers with clear steps when appropriate. "
    "Keep responses under 300 words unless a detailed calculation is needed. "
    "Focus on the CIMA Certificate syllabus: "
    "BA1 (Business Economics), "
    "BA2 (Fundamentals of Management Accounting), "
    "BA3 (Fundamentals of Financial Accounting), "
    "BA4 (Fundamentals of Ethics, Corporate Governance and Business Law). "
    "If a question is outside this scope, politely redirect to CIMA study materials."
)


class TutorRequest(BaseModel):
    question: str
    history:  list[dict] = []
    context:  dict = {}


def _build_system(context: dict) -> str:
    note = ""
    if context.get("targetPaper"):
        note += f" The student is currently studying {context['targetPaper'].upper()}."
    mastery = context.get("topicMastery", {})
    if mastery:
        weak = [
            t for t, s in mastery.items()
            if isinstance(s, dict) and s.get("total", 0) > 0
            and s.get("correct", 0) / s["total"] < 0.5
        ]
        if weak:
            note += f" Their weakest topics are: {', '.join(weak[:3])}."
    return SYSTEM_PROMPT + note


def _call_openai(system: str, messages: list[dict]) -> str | None:
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return None
    from openai import OpenAI
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    client = OpenAI(api_key=api_key)
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": system}] + messages,
        max_tokens=600,
        temperature=0.4,
    )
    return resp.choices[0].message.content or ""


def _call_anthropic(system: str, messages: list[dict]) -> str | None:
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return None
    import anthropic
    model = os.environ.get("AI_MODEL", "claude-sonnet-4-6")
    client = anthropic.Anthropic(api_key=api_key)
    resp = client.messages.create(
        model=model,
        max_tokens=600,
        system=system,
        messages=messages,
    )
    return resp.content[0].text if resp.content else ""


@app.post("/api/aiq/tutor")
async def aiq_tutor(
    body: TutorRequest,
    authorization: str = Header(default=None),
):
    system = _build_system(body.context)
    messages = [
        {"role": m["role"], "content": m["content"]}
        for m in body.history[-8:]
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]
    messages.append({"role": "user", "content": body.question})

    provider = os.environ.get("AI_PROVIDER", "openai").lower()
    answer = None

    try:
        if provider == "anthropic":
            answer = _call_anthropic(system, messages)
        if answer is None:
            answer = _call_openai(system, messages)
        if answer is None:
            return {
                "answer": (
                    "<b>⚠️ AI Tutor not configured.</b><br>"
                    "Set <code>OPENAI_API_KEY</code> (or <code>ANTHROPIC_API_KEY</code> "
                    "with <code>AI_PROVIDER=anthropic</code>) in Render environment variables."
                )
            }
    except Exception as e:
        err = str(e)
        if "401" in err or "authentication" in err.lower() or "api_key" in err.lower():
            return {"answer": "<b>⚠️ AI authentication failed.</b> Check your API key in Render."}
        return {"answer": "I'm not certain — please check your official CIMA study materials."}

    # Log conversation to ai_tutor_conversations (existing table) when authed
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        sb = _supabase()
        if sb:
            try:
                user_resp = sb.auth.get_user(token)
                if user_resp.user:
                    uid = str(user_resp.user.id)
                    full_messages = [
                        *[m for m in messages[:-1]],
                        {"role": "user",      "content": body.question},
                        {"role": "assistant", "content": answer},
                    ]
                    now = _now_iso()
                    sb.table("ai_tutor_conversations").insert({
                        "user_id":    uid,
                        "lesson_id":  None,
                        "messages":   full_messages,
                        "created_at": now,
                        "updated_at": now,
                    }).execute()
            except Exception:
                pass  # non-critical

    return {"answer": answer}


# ── Static file serving ───────────────────────────────────────────────────────

@app.get("/{full_path:path}")
async def serve_static(full_path: str):
    if not full_path:
        return FileResponse(BASE_DIR / "index.html")
    target = BASE_DIR / full_path
    if target.is_file():
        return FileResponse(target)
    return FileResponse(BASE_DIR / "index.html")
