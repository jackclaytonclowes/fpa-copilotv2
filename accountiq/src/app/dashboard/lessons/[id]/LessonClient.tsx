"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Zap,
  RotateCcw,
  BookOpen,
  PenLine,
  FileText,
} from "lucide-react";
import type { ContentCard, Question, LessonPageData, CompleteResponse } from "@/types";

interface LessonClientProps {
  lesson: LessonPageData;
  questions: Question[];
  userId: string;
  alreadyCompleted: boolean;
  previousScore: number | null;
}

type Phase = "reading" | "quiz" | "complete";
type StudyMode = "learn" | "quiz" | "summary";

export default function LessonClient({
  lesson,
  questions,
  userId,
  alreadyCompleted,
  previousScore,
}: LessonClientProps) {
  const router = useRouter();
  const color = lesson.modules.courses.color_hex ?? "#0d9488";
  const cards = lesson.content ?? [];
  const totalSteps = cards.length + questions.length;

  const [phase, setPhase] = useState<Phase>(
    alreadyCompleted ? "complete" : "reading"
  );
  const [studyMode, setStudyMode] = useState<StudyMode>("learn");
  const [isReviewing, setIsReviewing] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillValue, setFillValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [result, setResult] = useState<CompleteResponse | null>(null);
  const [completing, setCompleting] = useState(false);

  const progressWritten = useRef(false);
  useEffect(() => {
    if (alreadyCompleted || progressWritten.current) return;
    progressWritten.current = true;
    const supabase = createClient();
    supabase
      .from("user_progress")
      .upsert(
        { user_id: userId, lesson_id: lesson.id, status: "in_progress" },
        { onConflict: "user_id,lesson_id", ignoreDuplicates: true }
      )
      .then();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const completedSteps =
    phase === "reading"
      ? cardIdx
      : phase === "quiz"
      ? cards.length + qIdx
      : totalSteps;
  const progress =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 100;

  function switchToMode(mode: StudyMode) {
    setStudyMode(mode);
    if (mode === "learn") {
      setPhase("reading");
      setCardIdx(0);
      resetQuiz();
    } else if (mode === "quiz") {
      setPhase("quiz");
      setQIdx(0);
      resetQuiz();
    }
    // summary mode just changes the display — phase stays as-is
  }

  function resetQuiz() {
    setSelectedOption(null);
    setFillValue("");
    setSubmitted(false);
    setIsCorrect(null);
    setAnswers({});
    setResult(null);
  }

  function startReview() {
    setIsReviewing(true);
    setStudyMode("learn");
    setPhase("reading");
    setCardIdx(0);
    setQIdx(0);
    resetQuiz();
  }

  function startRevisionNotes() {
    setIsReviewing(true);
    setStudyMode("summary");
  }

  function advanceCard() {
    if (cardIdx < cards.length - 1) {
      setCardIdx((i) => i + 1);
    } else if (questions.length > 0) {
      setPhase("quiz");
      setStudyMode("quiz");
    } else {
      completeLesson();
    }
  }

  function submitAnswer() {
    const q = questions[qIdx];
    const answer = selectedOption ?? fillValue;
    const correct = String(q.correct_answer).toLowerCase().trim();
    const given = answer.toLowerCase().trim();

    setIsCorrect(given === correct);
    setSubmitted(true);
    setAnswers((prev) => ({ ...prev, [q.id]: answer }));
  }

  function nextQuestion() {
    setSubmitted(false);
    setIsCorrect(null);
    setSelectedOption(null);
    setFillValue("");
    if (qIdx < questions.length - 1) {
      setQIdx((i) => i + 1);
    } else {
      completeLesson();
    }
  }

  async function completeLesson() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data: CompleteResponse = await res.json();
      setResult(data);
    } catch {
      setResult({
        xp_earned: alreadyCompleted ? 0 : lesson.xp_reward,
        new_total_xp: 0,
        score_percent: 0,
        streak: 0,
        achievements_earned: [],
      });
    }
    setPhase("complete");
    setCompleting(false);
  }

  function backToCourse() {
    router.push(`/dashboard/courses/${lesson.modules.courses.id}`);
  }

  // ─── Complete screen ──────────────────────────────────────────────────────────

  if (phase === "complete") {
    const scoreImproved =
      result !== null &&
      previousScore !== null &&
      result.score_percent > previousScore;

    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 py-10">
        {/* Hero complete card */}
        <div className="ink-card w-full max-w-sm p-8 text-center mb-6 animate-scale-in">
          <div className="text-5xl mb-4">
            {isReviewing ? "📖" : "🎉"}
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            {isReviewing ? "Review complete!" : "Lesson complete!"}
          </h1>
          <p className="text-sand-400 text-sm">{lesson.title}</p>

          {/* XP earned */}
          {result && result.xp_earned > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl"
              style={{ background: "rgba(212, 240, 74, 0.15)", border: "1px solid rgba(212, 240, 74, 0.3)" }}>
              <Zap className="h-5 w-5" style={{ color: "#D4F04A" }} />
              <span className="premium-numeral text-2xl" style={{ color: "#D4F04A" }}>
                +{result.xp_earned}
              </span>
              <span className="text-sm text-sand-300 font-medium">XP</span>
            </div>
          )}
        </div>

        {/* Score card */}
        {result && questions.length > 0 && (
          <div className="premium-card w-full max-w-sm p-5 mb-3 text-center">
            <p className="text-xs text-sand-500 uppercase tracking-widest font-bold mb-2">
              Quiz score
            </p>
            <p className="premium-numeral text-4xl text-ink">
              {result.score_percent}%
            </p>
            {scoreImproved && (
              <p className="text-xs text-teal-600 font-semibold mt-2">
                New best! (was {previousScore}%)
              </p>
            )}
          </div>
        )}

        {/* Achievements */}
        {result && result.achievements_earned.length > 0 && (
          <div className="w-full max-w-sm space-y-2 mb-3">
            {result.achievements_earned.map((a) => (
              <div
                key={a}
                className="premium-card px-4 py-3 flex items-center gap-3"
              >
                <span className="text-xl">🏆</span>
                <span className="text-sm font-semibold text-ink">{a}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="w-full max-w-sm space-y-2 mt-2">
          <button
            className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]"
            style={{ background: "#D4F04A", color: "#0C0E1A" }}
            onClick={backToCourse}
          >
            Back to course map
          </button>

          {!isReviewing && (
            <>
              <button
                className="w-full py-3.5 rounded-2xl font-semibold text-sm border border-sand-300 bg-white text-ink hover:bg-sand-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                onClick={startRevisionNotes}
              >
                <FileText className="h-4 w-4" />
                Revision notes
              </button>
              <button
                className="w-full py-3.5 rounded-2xl font-semibold text-sm border border-sand-300 bg-white text-ink hover:bg-sand-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                onClick={startReview}
              >
                <RotateCcw className="h-4 w-4" />
                Review lesson
              </button>
            </>
          )}

          <button
            className="w-full py-3 text-sand-500 text-sm font-medium hover:text-ink transition-colors"
            onClick={() => router.push("/dashboard/home")}
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  // ─── Summary mode ────────────────────────────────────────────────────────────

  if (studyMode === "summary") {
    return (
      <div className="flex flex-col min-h-screen bg-cream">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-sand-200 px-4 py-3">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <button
              onClick={backToCourse}
              className="text-sand-400 hover:text-ink shrink-0 transition-colors"
              aria-label="Back to course"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-sm font-semibold text-ink truncate flex-1">
              {lesson.title}
            </p>
          </div>
        </div>

        <StudyModeTabs
          current={studyMode}
          hasQuiz={questions.length > 0}
          onSwitch={switchToMode}
        />

        <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <RevisionSummaryView cards={cards} />
        </div>

        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-sand-200 px-4 py-4">
          <div className="max-w-lg mx-auto">
            <button
              className="w-full py-3.5 rounded-2xl font-semibold text-sm border border-sand-300 bg-white text-ink hover:bg-sand-100 transition-all active:scale-[0.98]"
              onClick={backToCourse}
            >
              Back to course
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Reading + quiz ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      {/* Progress header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-sand-200 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={backToCourse}
            className="text-sand-400 hover:text-ink shrink-0 transition-colors"
            aria-label="Back to course"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 h-1.5 rounded-full bg-sand-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: color }}
            />
          </div>
          <span className="text-xs font-bold text-sand-500 shrink-0 w-8 text-right">
            {progress}%
          </span>
        </div>
      </div>

      <StudyModeTabs
        current={studyMode}
        hasQuiz={questions.length > 0}
        onSwitch={switchToMode}
      />

      {/* Review mode banner */}
      {isReviewing && (
        <div
          className="px-4 py-2 text-center text-xs font-semibold"
          style={{ background: "rgba(212, 240, 74, 0.12)", color: "#4E680B" }}
        >
          Review mode — no additional XP will be awarded
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {phase === "reading" && <ContentCardView card={cards[cardIdx]} color={color} />}
        {phase === "quiz" && (
          <QuizView
            question={questions[qIdx]}
            questionNumber={qIdx + 1}
            totalQuestions={questions.length}
            selectedOption={selectedOption}
            fillValue={fillValue}
            submitted={submitted}
            isCorrect={isCorrect}
            onSelectOption={setSelectedOption}
            onFillChange={setFillValue}
            color={color}
          />
        )}
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-sand-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          {phase === "reading" && (
            <button
              className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: "#D4F04A", color: "#0C0E1A" }}
              onClick={advanceCard}
            >
              {cardIdx < cards.length - 1 ? (
                <>
                  Continue <ChevronRight className="h-4 w-4" />
                </>
              ) : questions.length > 0 ? (
                isReviewing ? "Re-attempt quiz" : "Start quiz"
              ) : completing ? (
                "Saving…"
              ) : isReviewing ? (
                "Finish reviewing"
              ) : (
                "Complete lesson"
              )}
            </button>
          )}

          {phase === "quiz" && !submitted && (
            <button
              className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#D4F04A", color: "#0C0E1A" }}
              onClick={submitAnswer}
              disabled={
                questions[qIdx].question_type !== "fill_blank"
                  ? !selectedOption
                  : !fillValue.trim()
              }
            >
              Check answer
            </button>
          )}

          {phase === "quiz" && submitted && (
            <div className="space-y-3">
              <div
                className={`rounded-2xl p-3.5 flex items-start gap-3 text-sm border ${
                  isCorrect
                    ? "bg-mint-50 border-mint-200 text-teal-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className="font-bold mb-0.5">
                    {isCorrect ? "Correct!" : "Not quite"}
                  </p>
                  <p className="text-xs opacity-80">
                    {questions[qIdx].explanation}
                  </p>
                </div>
              </div>
              <button
                className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: "#D4F04A", color: "#0C0E1A" }}
                onClick={nextQuestion}
                disabled={completing}
              >
                {qIdx < questions.length - 1
                  ? "Next question"
                  : completing
                  ? "Saving…"
                  : "Finish lesson"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Study mode tab bar ───────────────────────────────────────────────────────

function StudyModeTabs({
  current,
  hasQuiz,
  onSwitch,
}: {
  current: StudyMode;
  hasQuiz: boolean;
  onSwitch: (m: StudyMode) => void;
}) {
  const tabs: { mode: StudyMode; label: string; Icon: React.ElementType }[] = [
    { mode: "learn", label: "Learn", Icon: BookOpen },
    ...(hasQuiz ? [{ mode: "quiz" as StudyMode, label: "Quiz", Icon: PenLine }] : []),
    { mode: "summary", label: "Summary", Icon: FileText },
  ];

  return (
    <div className="flex border-b border-gray-100 bg-white">
      {tabs.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          onClick={() => onSwitch(mode)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            current === mode
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Revision summary view ────────────────────────────────────────────────────

function RevisionSummaryView({ cards }: { cards: ContentCard[] }) {
  const sections = cards.filter(
    (c) => c.type === "explanation" || c.type === "worked_example" || c.type === "table"
  );

  if (sections.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-8">
        No revision notes available for this lesson.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Revision Notes</h2>
        <p className="text-xs text-gray-400">Key concepts from this lesson</p>
      </div>

      {sections.map((card, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">{card.heading}</h3>

          {card.body && (
            <p className="text-gray-600 text-sm leading-relaxed">{card.body}</p>
          )}

          {card.key_terms && card.key_terms.length > 0 && (
            <div className="space-y-2">
              {card.key_terms.map((kt, i) => {
                if (typeof kt === "string") {
                  const colonIdx = kt.indexOf(":");
                  const term = colonIdx > -1 ? kt.slice(0, colonIdx).trim() : kt;
                  const def = colonIdx > -1 ? kt.slice(colonIdx + 1).trim() : "";
                  return (
                    <div
                      key={i}
                      className="rounded-xl bg-teal-50 border border-teal-100 p-3"
                    >
                      <p className="font-semibold text-teal-800 text-sm">{term}</p>
                      {def && (
                        <p className="text-gray-600 text-sm mt-0.5">{def}</p>
                      )}
                    </div>
                  );
                }
                return (
                  <div
                    key={(kt as { term: string }).term ?? i}
                    className="rounded-xl bg-teal-50 border border-teal-100 p-3"
                  >
                    <p className="font-semibold text-teal-800 text-sm">
                      {(kt as { term: string }).term}
                    </p>
                    <p className="text-gray-600 text-sm mt-0.5">
                      {(kt as { definition: string }).definition}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {card.type === "worked_example" && card.steps && card.steps.length > 0 && (
            <div className="space-y-2">
              {card.steps.map((step, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          )}

          {card.type === "table" && card.headers && card.rows && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {card.headers.map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200 text-xs"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {card.rows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-3 py-2 text-gray-700 border-b border-gray-100 text-xs"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Content card renderer ────────────────────────────────────────────────────

function ContentCardView({ card, color }: { card: ContentCard; color: string }) {
  if (!card) return null;

  return (
    <div className="animate-slide-up space-y-5">
      {card.type === "intro" && (
        <div className="text-center py-6">
          {card.emoji && (
            <div className="text-6xl mb-5">{card.emoji}</div>
          )}
          <h1 className="font-display text-3xl font-bold text-ink mb-3 leading-tight">
            {card.heading}
          </h1>
          {card.body && (
            <p className="text-sand-600 text-base leading-relaxed">
              {card.body}
            </p>
          )}
        </div>
      )}

      {card.type === "explanation" && (
        <div>
          <h2 className="font-display text-2xl font-bold text-ink mb-3 leading-tight">
            {card.heading}
          </h2>
          {card.body && (
            <p className="text-ink/70 text-base leading-relaxed mb-5">
              {card.body}
            </p>
          )}
          {card.key_terms && card.key_terms.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-sand-500">
                Key terms
              </p>
              {card.key_terms.map((kt, i) => {
                if (typeof kt === "string") {
                  const colonIdx = kt.indexOf(":");
                  const term = colonIdx > -1 ? kt.slice(0, colonIdx).trim() : kt;
                  const def = colonIdx > -1 ? kt.slice(colonIdx + 1).trim() : "";
                  return (
                    <div key={i} className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
                      <p className="font-bold text-teal-800 text-sm mb-1">{term}</p>
                      {def && <p className="text-ink/70 text-sm leading-relaxed">{def}</p>}
                    </div>
                  );
                }
                return (
                  <div key={(kt as { term: string }).term ?? i} className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
                    <p className="font-bold text-teal-800 text-sm mb-1">{(kt as { term: string }).term}</p>
                    <p className="text-ink/70 text-sm leading-relaxed">{(kt as { definition: string }).definition}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {card.type === "table" && (
        <div>
          <h2 className="font-display text-2xl font-bold text-ink mb-4">
            {card.heading}
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-sand-200">
            <table className="w-full text-sm">
              {card.headers && (
                <thead className="bg-sand-100">
                  <tr>
                    {card.headers.map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left font-bold text-ink text-xs uppercase tracking-wide border-b border-sand-200"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {(card.rows ?? []).map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-sand-50"}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="px-4 py-2.5 text-ink/80 border-b border-sand-100 text-sm"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {card.type === "worked_example" && (
        <div>
          <h2 className="font-display text-2xl font-bold text-ink mb-4">
            {card.heading}
          </h2>
          <div className="space-y-4">
            {(card.steps ?? []).map((step, i) => (
              <div key={i} className="flex gap-4">
                <div
                  className="h-7 w-7 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: color }}
                >
                  {i + 1}
                </div>
                <p className="text-ink/80 text-sm leading-relaxed pt-1">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quiz renderer ────────────────────────────────────────────────────────────

function QuizView({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  fillValue,
  submitted,
  isCorrect,
  onSelectOption,
  onFillChange,
  color,
}: {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: string | null;
  fillValue: string;
  submitted: boolean;
  isCorrect: boolean | null;
  onSelectOption: (v: string) => void;
  onFillChange: (v: string) => void;
  color: string;
}) {
  return (
    <div className="animate-slide-up space-y-6">
      <div>
        <p className="text-xs font-bold text-sand-500 uppercase tracking-widest mb-2">
          Question {questionNumber} of {totalQuestions}
        </p>
        <h2 className="font-display text-xl font-bold text-ink leading-snug">
          {question.prompt}
        </h2>
      </div>

      {question.question_type === "mcq" && (
        <div className="space-y-2.5">
          {(question.options ?? []).map((opt) => {
            const correct = String(question.correct_answer);
            let style = "border-sand-200 bg-white hover:border-citron-300 hover:bg-citron-50";
            if (submitted) {
              if (opt === correct)
                style = "border-mint-300 bg-mint-50";
              else if (opt === selectedOption)
                style = "border-red-300 bg-red-50";
              else style = "border-sand-100 bg-sand-50 opacity-50";
            } else if (opt === selectedOption) {
              style = "border-citron-400 bg-citron-50";
            }
            return (
              <button
                key={opt}
                disabled={submitted}
                onClick={() => onSelectOption(opt)}
                className={`w-full text-left rounded-2xl border-2 px-4 py-3.5 text-sm font-medium transition-all ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {question.question_type === "true_false" && (
        <div className="grid grid-cols-2 gap-3">
          {["True", "False"].map((opt) => {
            const correct = String(question.correct_answer);
            let style = "border-sand-200 bg-white hover:border-citron-300";
            if (submitted) {
              if (opt === correct) style = "border-mint-300 bg-mint-50";
              else if (opt === selectedOption) style = "border-red-300 bg-red-50";
              else style = "border-sand-100 opacity-50";
            } else if (opt === selectedOption) {
              style = "border-citron-400 bg-citron-50";
            }
            return (
              <button
                key={opt}
                disabled={submitted}
                onClick={() => onSelectOption(opt)}
                className={`rounded-2xl border-2 py-7 text-center font-bold text-lg transition-all ${style}`}
              >
                {opt === "True" ? "✅ True" : "❌ False"}
              </button>
            );
          })}
        </div>
      )}

      {question.question_type === "fill_blank" && (
        <input
          type="text"
          value={fillValue}
          disabled={submitted}
          onChange={(e) => onFillChange(e.target.value)}
          placeholder="Type your answer…"
          className={`w-full rounded-2xl border-2 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 transition-all ${
            submitted
              ? isCorrect
                ? "border-mint-300 bg-mint-50"
                : "border-red-300 bg-red-50"
              : "border-sand-200 bg-white focus:border-citron-400 focus:ring-citron-200"
          }`}
        />
      )}
    </div>
  );
}
