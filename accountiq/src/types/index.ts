// ─── Content card types ───────────────────────────────────────────────────────

export interface KeyTerm {
  term: string;
  definition: string;
}

export type ContentCardType =
  | "intro"
  | "explanation"
  | "table"
  | "worked_example";

export interface ContentCard {
  type: ContentCardType;
  heading: string;
  body?: string;
  emoji?: string;
  key_terms?: (KeyTerm | string)[];
  rows?: string[][];
  headers?: string[];
  steps?: string[];
}

// ─── Question types ───────────────────────────────────────────────────────────

export type QuestionType =
  | "mcq"
  | "true_false"
  | "fill_blank"
  | "match"
  | "calculation";

export interface Question {
  id: string;
  question_type: QuestionType;
  prompt: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
  order_index: number;
}

// ─── Content hierarchy ────────────────────────────────────────────────────────

export interface LessonSummary {
  id: string;
  title: string;
  order_index: number;
  xp_reward: number;
  estimated_minutes: number;
  is_published: boolean;
}

export interface LessonWithContent extends LessonSummary {
  content: ContentCard[];
  module_id: string;
}

export interface ModuleWithLessons {
  id: string;
  title: string;
  order_index: number;
  is_published: boolean;
  course_id: string;
  lessons: LessonSummary[];
}

export interface CourseWithModules {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cima_paper: string;
  color_hex: string;
  order_index: number;
  is_published: boolean;
  modules: ModuleWithLessons[];
}

// ─── Lesson page prop (server → client) ──────────────────────────────────────

export interface LessonPageData extends LessonWithContent {
  modules: {
    course_id: string;
    title: string;
    courses: {
      id: string;
      title: string;
      color_hex: string;
    };
  };
}

// ─── API response ─────────────────────────────────────────────────────────────

export interface CompleteResponse {
  xp_earned: number;
  new_total_xp: number;
  score_percent: number;
  streak: number;
  achievements_earned: string[];
}
