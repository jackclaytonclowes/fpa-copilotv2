# AccountIQ

Gamified CIMA accounting education app. Learn accounting through bite-sized lessons, interactive quizzes, XP rewards, daily streaks, and an AI tutor.

**This app lives entirely in the `/accountiq` directory and is completely separate from the FP&A Copilot project in the parent folder.**

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + custom Radix UI components |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| AI Tutor | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Animations | Framer Motion |

---

## Project structure

```
accountiq/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/          # Email/password + Google OAuth
│   │   │   └── signup/         # Registration with display name
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx      # Top bar (streak, XP, avatar) + bottom nav
│   │   │   ├── home/           # Continue learning + course grid + daily goal
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx    # Course list
│   │   │   │   └── [id]/       # Course map (vertical lesson path)
│   │   │   ├── lessons/[id]/   # Card reader + quiz engine
│   │   │   ├── tutor/          # Streaming AI chat
│   │   │   └── profile/        # Stats, achievements, sign-out
│   │   └── api/
│   │       ├── lessons/[id]/complete/  # XP, streak, achievement logic
│   │       └── tutor/message/          # Anthropic streaming endpoint
│   ├── components/ui/          # Button, Card, Badge, Progress, Dialog, Tabs
│   └── lib/supabase/           # Browser and server Supabase clients
├── supabase/
│   ├── migrations/001_initial.sql   # Full schema with RLS
│   └── seed/001_ba3_module1.sql     # BA3 course, 3 lessons, 12 questions
├── middleware.ts               # Route protection (/dashboard → /login)
├── .env.example                # Copy to .env.local and fill in values
└── package.json
```

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)
- An [Anthropic](https://console.anthropic.com) API key

---

## Setup

### 1. Install dependencies

```bash
cd accountiq
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=sk-ant-...
```

All four keys are required. Find your Supabase keys at **Settings > API** in your project dashboard.

### 3. Run the database migration

In your Supabase project, open the **SQL Editor** and run:

```
supabase/migrations/001_initial.sql
```

This creates all 12 tables, RLS policies, the `updated_at` trigger, and the auto-profile function that creates a `public.users` row whenever someone signs up.

### 4. Load seed data (optional but recommended)

In the SQL Editor, run:

```
supabase/seed/001_ba3_module1.sql
```

This inserts:
- 1 course: **BA3 Financial Accounting**
- 1 module: Accounting Principles
- 3 lessons with real CIMA content (accruals, going concern, materiality, prudence)
- 12 MCQ and true/false questions with full explanations
- 3 starter achievements

### 5. Enable Google OAuth (optional)

In your Supabase project: **Authentication > Providers > Google**.  
Follow the [Supabase Google OAuth guide](https://supabase.com/docs/guides/auth/social-login/auth-google).

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login` automatically.

---

## Database schema overview

| Table | Purpose |
|---|---|
| `users` | Profile (display name, avatar, daily goal) |
| `courses` | CIMA paper courses |
| `modules` | Sections within a course |
| `lessons` | Individual lessons (content stored as JSONB cards) |
| `questions` | MCQ / true-false / fill-blank questions per lesson |
| `user_progress` | Completion status, score, XP earned per lesson |
| `user_xp` | Append-only XP event log |
| `user_streaks` | Current and longest daily streaks |
| `achievements` | Achievement definitions |
| `user_achievements` | Which achievements each user has earned |
| `mock_exams` | Timed exam sessions (schema ready, UI not yet built) |
| `ai_tutor_conversations` | Chat history per user/lesson |

All user-owned tables have RLS enabled. Course content (courses, modules, lessons, questions, achievements) is publicly readable.

---

## Lesson content format

Lesson content is stored as a JSONB array of cards. Each card has a `type` field:

```jsonc
// intro — title screen
{ "type": "intro", "emoji": "📚", "heading": "...", "body": "..." }

// explanation — body text with optional key terms
{ "type": "explanation", "heading": "...", "body": "...",
  "key_terms": [{ "term": "...", "definition": "..." }] }

// table — rendered as an HTML table
{ "type": "table", "heading": "...", "headers": ["Col A", "Col B"],
  "rows": [["cell", "cell"], ["cell", "cell"]] }

// worked_example — numbered steps
{ "type": "worked_example", "heading": "...", "steps": ["Step 1...", "Step 2..."] }
```

---

## AI Tutor

The tutor uses **streaming** via the Anthropic SDK. Each session is capped at **10 user messages per day** per user (counted from `ai_tutor_conversations`). If you pass a `lesson_id` in the request body, the tutor receives the lesson title and a content summary as context.

The system prompt instructs the model to:
- Use UK English
- Be concise and encouraging
- Show full working for calculations
- Stay under 300 words unless a detailed calculation is needed

---

## Adding new content

To add a new course or lesson, insert rows directly in Supabase or write a new seed file following the pattern in `supabase/seed/001_ba3_module1.sql`. Set `is_published = true` for the course, module, and lessons to make them visible.

---

## Deployment

The app is a standard Next.js 14 project and can be deployed to any platform that supports it.

**Vercel (recommended):**
1. Push your branch to GitHub
2. Import the repo in Vercel, set the **root directory** to `accountiq`
3. Add all four environment variables in the Vercel project settings
4. Deploy

**Other platforms:** set `NODE_ENV=production`, run `npm run build`, then `npm start`. Ensure the four env vars are available at runtime.
