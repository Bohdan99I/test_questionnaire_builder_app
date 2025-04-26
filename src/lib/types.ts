export type QuestionType = 'text' | 'single_choice' | 'multiple_choice';

export interface User {
  id: string;
  email: string;
  password?: string;
}

export interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  user_id: string;
}

export interface Question {
  id: string;
  questionnaire_id: string;
  question_text: string;
  question_type: QuestionType;
  order: number;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  order: number;
}

export interface QuestionnaireResponse {
  id: string;
  questionnaire_id: string;
  started_at: string;
  completed_at: string | null;
  time_taken_seconds: number | null;
}

export interface QuestionAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string | null;
  selected_options: string[] | null;
}