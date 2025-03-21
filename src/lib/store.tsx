import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, Questionnaire, Question, QuestionOption, QuestionnaireResponse, QuestionAnswer } from './types';

interface State {
  users: User[];
  currentUser: User | null;
  questionnaires: Questionnaire[];
  questions: Question[];
  questionOptions: QuestionOption[];
  responses: QuestionnaireResponse[];
  answers: QuestionAnswer[];
}

type Action =
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'ADD_QUESTIONNAIRE'; payload: Questionnaire }
  | { type: 'UPDATE_QUESTIONNAIRE'; payload: Questionnaire }
  | { type: 'DELETE_QUESTIONNAIRE'; payload: string }
  | { type: 'ADD_QUESTION'; payload: Question }
  | { type: 'UPDATE_QUESTION'; payload: Question }
  | { type: 'DELETE_QUESTION'; payload: string }
  | { type: 'ADD_OPTION'; payload: QuestionOption }
  | { type: 'UPDATE_OPTION'; payload: QuestionOption }
  | { type: 'DELETE_OPTION'; payload: string }
  | { type: 'ADD_RESPONSE'; payload: QuestionnaireResponse }
  | { type: 'ADD_ANSWER'; payload: QuestionAnswer }
  | { type: 'LOAD_STATE'; payload: State };

const initialState: State = {
  users: [],
  currentUser: null,
  questionnaires: [],
  questions: [],
  questionOptions: [],
  responses: [],
  answers: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'ADD_QUESTIONNAIRE':
      return { ...state, questionnaires: [...state.questionnaires, action.payload] };
    case 'UPDATE_QUESTIONNAIRE':
      return {
        ...state,
        questionnaires: state.questionnaires.map(q =>
          q.id === action.payload.id ? action.payload : q
        ),
      };
    case 'DELETE_QUESTIONNAIRE':
      return {
        ...state,
        questionnaires: state.questionnaires.filter(q => q.id !== action.payload),
        questions: state.questions.filter(q => q.questionnaire_id !== action.payload),
      };
    case 'ADD_QUESTION':
      return { ...state, questions: [...state.questions, action.payload] };
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.payload.id ? action.payload : q
        ),
      };
    case 'DELETE_QUESTION':
      return {
        ...state,
        questions: state.questions.filter(q => q.id !== action.payload),
        questionOptions: state.questionOptions.filter(o => o.question_id !== action.payload),
      };
    case 'ADD_OPTION':
      return { ...state, questionOptions: [...state.questionOptions, action.payload] };
    case 'UPDATE_OPTION':
      return {
        ...state,
        questionOptions: state.questionOptions.map(o =>
          o.id === action.payload.id ? action.payload : o
        ),
      };
    case 'DELETE_OPTION':
      return {
        ...state,
        questionOptions: state.questionOptions.filter(o => o.id !== action.payload),
      };
    case 'ADD_RESPONSE':
      return { ...state, responses: [...state.responses, action.payload] };
    case 'ADD_ANSWER':
      return { ...state, answers: [...state.answers, action.payload] };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Завантаження стану з localStorage при ініціалізації
  useEffect(() => {
    const savedState = localStorage.getItem('appState');
    if (savedState) {
      dispatch({ type: 'LOAD_STATE', payload: JSON.parse(savedState) });
    }
  }, []);

  // Збереження стану в localStorage при змінах
  useEffect(() => {
    localStorage.setItem('appState', JSON.stringify(state));
  }, [state]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}