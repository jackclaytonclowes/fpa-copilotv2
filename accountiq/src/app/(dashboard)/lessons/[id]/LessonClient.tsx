"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Star,
} from "lucide-react";

interface ContentCard {
  type: "intro" | "explanation" | "table" | "worked_example";
  heading: string;
  body?: string;
  emoji?: string;
  key_terms?: Array<{ term: string; definition: string }>;
  rows?: string[][];
  headers?: string[];
  steps?: string[];
}

interface Question {
  id: string;
  question_type: string;
  prompt: string;
  options: string[] | null;
  correct_answer: string | string[];
  explanation: string;
  order_index: number;
}

interface LessonClientProps {
  lesson: {
    id: string;
    title: string;
    content: ContentCard[];
    xp_reward: number;
    estimated_minutes: number;
    modules: {
      course_id: string;
      title: string;
      courses: { title: string; color_hex: string; id: string };
    };
  };
  questions: Question[];
  alreadyCompleted: boolean;
}

type Phase = "reading" | "quiz" | "complete";

export default function LessonClient({
  lesson,
  questions,
  alreadyCompleted,
}: LessonClientProps) {
  const router = useRouter();
  const color = lesson.modules.courses.color_hex ?? "#0d9488";

  const cards = lesson.content ?? [];
  const totalSteps = cards.length + questions.length;

  const [phase, setPhase] = useState<Phase>(
    alreadyCompleted ? "complete" : "reading"
  );
  const [cardIdx, setCardIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillValue, setFillValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [xpEarned, setXpEarned] = useState(0);
  const [achievementsEarned, setAchievementsEarned] = useState<string[]>([]);
  const [completing, setCompleting] = useState(false);

  const completedSteps =
    phase === "reading"
      ? cardIdx
      : phase === "quiz"
      ? cards.length + qIdx
      : totalSteps;
  const progress =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 100;

  function advanceCard() {
    if (cardIdx < cards.length - 1) {
      setCardIdx((i) => i + 1);
    } else {
      if (questions.length > 0) setPhase("quiz");
      else completeLesson();
    }
  }

  function submitAnswer() {
    const q = questions[qIdx];
    const answer = selectedOption ?? fillValue;
    const correct = String(q.correct_answer).toLowerCase().trim();
    const given = answer.toLowerCase().trim();
    const ok = given === correct;

    setIsCorrect(ok);
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
      const data = await res.json();
      setXpEarned(data.xp_earned ?? lesson.xp_reward);
      setAchievementsEarned(data.achievements_earned ?? []);
    } catch {
      setXpEarned(lesson.xp_reward);
    }
    setPhase("complete");
    setCompleting(false);
  }

  if (phase === "complete") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lesson complete!</h1>
        <p className="text-gray-500 mb-6">{lesson.title}</p>

        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-2xl px-6 py-4 mb-4">
          <Star className="h-6 w-6 text-yellow-500 fill-yellow-400" />
          <span className="text-2xl font-bold text-yellow-700">+{xpEarned} XP</span>
        </div>

        {achievementsEarned.length > 0 && (
          <div className="mb-6 space-y-2">
            {achievementsEarned.map((a) => (
              <div
                key={a}
                className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2 text-sm font-medium text-teal-700"
              >
                🏆 Achievement unlocked: {a}
              </div>
            ))}
          </div>
        )}

        <Button
          className="w-full max-w-xs"
          onClick={() =>
            router.push(`/dashboard/courses/${lesson.modules.courses.id}`)
          }
        >
          Back to course map
        </Button>
        <Button
          variant="ghost"
          className="mt-2 w-full max-w-xs"
          onClick={() => router.push("/dashboard/home")}
        >
          Go home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Progress bar header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={() =>
              router.push(`/dashboard/courses/${lesson.modules.courses.id}`)
            }
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <Progress value={progress} />
          </div>
          <span className="text-xs text-gray-400 shrink-0">{progress}%</span>
        </div>
      </div>

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

      {/* Bottom action */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto">
          {phase === "reading" && (
            <Button className="w-full" onClick={advanceCard}>
              {cardIdx < cards.length - 1 ? (
                <>
                  Continue <ChevronRight className="h-4 w-4" />
                </>
              ) : questions.length > 0 ? (
                "Start quiz"
              ) : completing ? (
                "Completing…"
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
                (questions[qIdx].question_type !== "fill_blank" &&
                  !selectedOption) ||
                (questions[qIdx].question_type === "fill_blank" &&
                  !fillValue.trim())
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

function ContentCardView({ card }: { card: ContentCard }) {
  if (!card) return null;

  return (
    <div className="animate-slide-up space-y-4">
      {card.type === "intro" && (
        <div className="text-center py-4">
          {card.emoji && <div className="text-5xl mb-4">{card.emoji}</div>}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{card.heading}</h1>
          {card.body && <p className="text-gray-600 text-base leading-relaxed">{card.body}</p>}
        </div>
      )}

      {card.type === "explanation" && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{card.heading}</h2>
          {card.body && (
            <p className="text-gray-600 text-base leading-relaxed mb-4">{card.body}</p>
          )}
          {card.key_terms && card.key_terms.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Key terms
              </p>
              {card.key_terms.map((kt) => (
                <div
                  key={kt.term}
                  className="rounded-xl bg-teal-50 border border-teal-100 p-3"
                >
                  <p className="font-semibold text-teal-800 text-sm">{kt.term}</p>
                  <p className="text-gray-600 text-sm mt-0.5">{kt.definition}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {card.type === "table" && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{card.heading}</h2>
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
                  <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-gray-700 border-b border-gray-100">
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
          <h2 className="text-xl font-bold text-gray-900 mb-3">{card.heading}</h2>
          <div className="space-y-3">
            {(card.steps ?? []).map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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

      {(question.question_type === "mcq") && (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => {
            let style =
              "border-gray-200 bg-white hover:border-teal-400 hover:bg-teal-50";
            if (submitted) {
              const correct = String(question.correct_answer);
              if (opt === correct) style = "border-teal-500 bg-teal-50";
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
            let style = "border-gray-200 bg-white hover:border-teal-400";
            if (submitted) {
              const correct = String(question.correct_answer);
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
        <div>
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
        </div>
      )}
    </div>
  );
}
