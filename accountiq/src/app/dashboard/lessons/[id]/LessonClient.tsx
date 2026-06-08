"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Star,
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

  // Track in-progress state once on mount (only when starting fresh)
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

  // ─── Complete screen ─────────────────────────────────────────────────────────

  if (phase === "complete") {
    const scoreImproved =
      result !== null &&
      previousScore !== null &&
      result.score_percent > previousScore;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">
          {isReviewing ? "📖" : "🎉"}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {isReviewing ? "Review complete!" : "Lesson complete!"}
        </h1>
        <p className="text-gray-500 text-sm mb-6">{lesson.title}</p>

        {/* XP — only on first completion */}
        {result && result.xp_earned > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-2xl px-6 py-4 mb-3">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-400" />
            <span className="text-2xl font-bold text-yellow-700">
              +{result.xp_earned} XP
            </span>
          </div>
        )}

        {/* Score */}
        {result && questions.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-3 mb-3 w-full max-w-xs">
            <p className="text-sm text-gray-500 mb-1">Quiz score</p>
            <p className="text-2xl font-bold text-gray-900">
              {result.score_percent}%
            </p>
            {scoreImproved && (
              <p className="text-xs text-teal-600 font-medium mt-1">
                New best score! (was {previousScore}%)
              </p>
            )}
          </div>
        )}

        {/* Achievements */}
        {result && result.achievements_earned.length > 0 && (
          <div className="mb-3 space-y-2 w-full max-w-xs">
            {result.achievements_earned.map((a) => (
              <div
                key={a}
                className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2 text-sm font-medium text-teal-700"
              >
                🏆 {a}
              </div>
            ))}
          </div>
        )}

        <div className="w-full max-w-xs space-y-2 mt-2">
          <Button className="w-full" onClick={backToCourse}>
            Back to course map
          </Button>

          {!isReviewing && (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={startRevisionNotes}
              >
                <FileText className="h-4 w-4" />
                Revision notes
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={startReview}
              >
                <RotateCcw className="h-4 w-4" />
                Review lesson
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/dashboard/home")}
          >
            Go home
          </Button>
        </div>
      </div>
    );
  }

  // ─── Summary mode ────────────────────────────────────────────────────────────

  if (studyMode === "summary") {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <button
              onClick={backToCourse}
              className="text-gray-400 hover:text-gray-600 shrink-0"
              aria-label="Back to course"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700 truncate">
                {lesson.title}
              </p>
            </div>
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

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4">
          <div className="max-w-lg mx-auto">
            <Button className="w-full" variant="outline" onClick={backToCourse}>
              Back to course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Reading + quiz screen ───────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen">
      {/* Progress bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={backToCourse}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="Back to course"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <Progress value={progress} />
          </div>
          <span className="text-xs text-gray-400 shrink-0 w-8 text-right">
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
        <div className="bg-teal-50 border-b border-teal-100 px-4 py-2 text-center">
          <p className="text-xs text-teal-700 font-medium">
            Review mode — no additional XP will be awarded
          </p>
        </div>
      )}

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {phase === "reading" && <ContentCardView card={cards[cardIdx]} />}
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
          />
        )}
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto">
          {phase === "reading" && (
            <Button className="w-full" onClick={advanceCard}>
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
            </Button>
          )}

          {phase === "quiz" && !submitted && (
            <Button
              className="w-full"
              onClick={submitAnswer}
              disabled={
                questions[qIdx].question_type !== "fill_blank"
                  ? !selectedOption
                  : !fillValue.trim()
              }
            >
              Check answer
            </Button>
          )}

          {phase === "quiz" && submitted && (
            <div className="space-y-3">
              <div
                className={`rounded-2xl p-3 flex items-start gap-3 text-sm ${
                  isCorrect
                    ? "bg-teal-50 border border-teal-200 text-teal-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold mb-0.5">
                    {isCorrect ? "Correct!" : "Not quite"}
                  </p>
                  <p className="text-xs opacity-80">
                    {questions[qIdx].explanation}
                  </p>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={nextQuestion}
                disabled={completing}
              >
                {qIdx < questions.length - 1
                  ? "Next question"
                  : completing
                  ? "Saving…"
                  : "Finish lesson"}
              </Button>
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

function ContentCardView({ card }: { card: ContentCard }) {
  if (!card) return null;

  return (
    <div className="animate-slide-up space-y-4">
      {card.type === "intro" && (
        <div className="text-center py-4">
          {card.emoji && (
            <div className="text-5xl mb-4">{card.emoji}</div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {card.heading}
          </h1>
          {card.body && (
            <p className="text-gray-600 text-base leading-relaxed">
              {card.body}
            </p>
          )}
        </div>
      )}

      {card.type === "explanation" && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {card.heading}
          </h2>
          {card.body && (
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              {card.body}
            </p>
          )}
          {card.key_terms && card.key_terms.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Key terms
              </p>
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
        </div>
      )}

      {card.type === "table" && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {card.heading}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              {card.headers && (
                <thead className="bg-gray-50">
                  <tr>
                    {card.headers.map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {(card.rows ?? []).map((row, ri) => (
                  <tr
                    key={ri}
                    className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="px-3 py-2 text-gray-700 border-b border-gray-100"
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
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {card.heading}
          </h2>
          <div className="space-y-3">
            {(card.steps ?? []).map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed pt-1">
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
}) {
  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <p className="text-xs text-gray-400 mb-2">
          Question {questionNumber} of {totalQuestions}
        </p>
        <h2 className="text-lg font-bold text-gray-900 leading-snug">
          {question.prompt}
        </h2>
      </div>

      {question.question_type === "mcq" && (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => {
            const correct = String(question.correct_answer);
            let style =
              "border-gray-200 bg-white hover:border-teal-400 hover:bg-teal-50";
            if (submitted) {
              if (opt === correct)
                style = "border-teal-500 bg-teal-50";
              else if (opt === selectedOption)
                style = "border-red-400 bg-red-50";
              else style = "border-gray-100 bg-gray-50 opacity-60";
            } else if (opt === selectedOption) {
              style = "border-teal-500 bg-teal-50";
            }
            return (
              <button
                key={opt}
                disabled={submitted}
                onClick={() => onSelectOption(opt)}
                className={`w-full text-left rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${style}`}
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
            let style = "border-gray-200 bg-white hover:border-teal-400";
            if (submitted) {
              if (opt === correct) style = "border-teal-500 bg-teal-50";
              else if (opt === selectedOption)
                style = "border-red-400 bg-red-50";
              else style = "border-gray-100 opacity-60";
            } else if (opt === selectedOption) {
              style = "border-teal-500 bg-teal-50";
            }
            return (
              <button
                key={opt}
                disabled={submitted}
                onClick={() => onSelectOption(opt)}
                className={`rounded-2xl border-2 py-6 text-center font-bold text-lg transition-all ${style}`}
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
          className={`w-full rounded-xl border-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
            submitted
              ? isCorrect
                ? "border-teal-500 bg-teal-50"
                : "border-red-400 bg-red-50"
              : "border-gray-200"
          }`}
        />
      )}
    </div>
  );
}
