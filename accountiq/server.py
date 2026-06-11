"""AccountIQ — serves static files and the AI Tutor endpoint."""
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

BASE_DIR = Path(__file__).parent
app = FastAPI(title="AccountIQ")

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
    history: list[dict] = []
    context: dict = {}


def _build_system(context: dict) -> str:
    note = ""
    if context.get("targetPaper"):
        note += f" The student is currently studying {context['targetPaper'].upper()}."
    mastery = context.get("topicMastery", {})
    if mastery:
        weak = [t for t, s in mastery.items() if isinstance(s, (int, float)) and s < 50]
        if weak:
            note += f" Their weakest topics are: {', '.join(weak[:3])}."
    return SYSTEM_PROMPT + note


def _call_openai(system: str, messages: list[dict]) -> str:
    from openai import OpenAI
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return None  # caller handles missing key
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    client = OpenAI(api_key=api_key)
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": system}] + messages,
        max_tokens=600,
        temperature=0.4,
    )
    return resp.choices[0].message.content or ""


def _call_anthropic(system: str, messages: list[dict]) -> str:
    import anthropic
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return None
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
async def aiq_tutor(body: TutorRequest):
    system = _build_system(body.context)
    messages = [
        {"role": m["role"], "content": m["content"]}
        for m in body.history[-8:]
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]
    messages.append({"role": "user", "content": body.question})

    provider = os.environ.get("AI_PROVIDER", "openai").lower()

    try:
        answer = None
        if provider == "anthropic":
            answer = _call_anthropic(system, messages)
        if answer is None:  # anthropic not configured, try openai
            answer = _call_openai(system, messages)
        if answer is None:
            return JSONResponse(
                {"answer": (
                    "<b>⚠️ AI Tutor not configured.</b><br>"
                    "Set <code>OPENAI_API_KEY</code> (or <code>ANTHROPIC_API_KEY</code> "
                    "with <code>AI_PROVIDER=anthropic</code>) in Render environment variables."
                )},
                status_code=200,
            )
        return {"answer": answer}
    except Exception as e:
        err = str(e)
        if "401" in err or "authentication" in err.lower() or "api_key" in err.lower():
            return {"answer": "<b>⚠️ AI authentication failed.</b> Check your API key in Render."}
        return {"answer": "I'm not certain — please check your official CIMA study materials."}


# ── Static file serving ───────────────────────────────────────────────────────

@app.get("/{full_path:path}")
async def serve_static(full_path: str):
    # Serve index.html for root
    if not full_path or full_path == "/":
        return FileResponse(BASE_DIR / "index.html")
    target = BASE_DIR / full_path
    if target.is_file():
        return FileResponse(target)
    # SPA fallback
    return FileResponse(BASE_DIR / "index.html")
