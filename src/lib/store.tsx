import React, { createContext, useContext, useReducer } from "react";
import {
  User,
  Questionnaire,
  Question,
  QuestionOption,
  QuestionnaireResponse,
  QuestionAnswer,
} from "./types";

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
  | { type: "SET_CURRENT_USER"; payload: User | null }
  | { type: "ADD_USER"; payload: User }
  | { type: "ADD_QUESTIONNAIRE"; payload: Questionnaire }
  | { type: "UPDATE_QUESTIONNAIRE"; payload: Questionnaire }
  | { type: "DELETE_QUESTIONNAIRE"; payload: string }
  | { type: "ADD_QUESTION"; payload: Question }
  | { type: "UPDATE_QUESTION"; payload: Question }
  | { type: "DELETE_QUESTION"; payload: string }
  | { type: "ADD_OPTION"; payload: QuestionOption }
  | { type: "UPDATE_OPTION"; payload: QuestionOption }
  | { type: "DELETE_OPTION"; payload: string }
  | { type: "ADD_RESPONSE"; payload: QuestionnaireResponse }
  | { type: "ADD_ANSWER"; payload: QuestionAnswer }
  | { type: "LOAD_STATE"; payload: State };

const initialState: State = {
  users: [],
  currentUser: null,
  questionnaires: [],
  questions: [],
  questionOptions: [],
  responses: [],
  answers: [],
};

const STORAGE_KEY = "appState";

function loadState(): State {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      // Перевірка структури даних
      if (
        Array.isArray(parsedState.users) &&
        Array.isArray(parsedState.questionnaires) &&
        Array.isArray(parsedState.questions) &&
        Array.isArray(parsedState.questionOptions) &&
        Array.isArray(parsedState.responses) &&
        Array.isArray(parsedState.answers)
      ) {
        return parsedState;
      }
    }
  } catch (error) {
    console.error("Error loading state:", error);
  }
  return initialState;
}

function saveState(state: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving state:", error);
  }
}

function reducer(state: State, action: Action): State {
  let newState: State;

  switch (action.type) {
    case "SET_CURRENT_USER":
      newState = { ...state, currentUser: action.payload };
      break;
    case "ADD_USER":
      // Перевірка на дублікати email
      if (state.users.some((user) => user.email === action.payload.email)) {
        throw new Error("Користувач з таким email вже існує");
      }
      newState = { ...state, users: [...state.users, action.payload] };
      break;
    case "ADD_QUESTIONNAIRE":
      newState = {
        ...state,
        questionnaires: [...state.questionnaires, action.payload],
      };
      break;
    case "UPDATE_QUESTIONNAIRE":
      newState = {
        ...state,
        questionnaires: state.questionnaires.map((q) =>
          q.id === action.payload.id ? action.payload : q
        ),
      };
      break;
    case "DELETE_QUESTIONNAIRE":
      newState = {
        ...state,
        questionnaires: state.questionnaires.filter(
          (q) => q.id !== action.payload
        ),
        questions: state.questions.filter(
          (q) => q.questionnaire_id !== action.payload
        ),
        questionOptions: state.questionOptions.filter(
          (o) =>
            !state.questions.some(
              (q) =>
                q.questionnaire_id === action.payload && q.id === o.question_id
            )
        ),
        responses: state.responses.filter(
          (r) => r.questionnaire_id !== action.payload
        ),
        answers: state.answers.filter(
          (a) =>
            !state.responses.some(
              (r) =>
                r.questionnaire_id === action.payload && r.id === a.response_id
            )
        ),
      };
      break;
    case "ADD_QUESTION":
      newState = { ...state, questions: [...state.questions, action.payload] };
      break;
    case "UPDATE_QUESTION":
      newState = {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? action.payload : q
        ),
      };
      break;
    case "DELETE_QUESTION":
      newState = {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.payload),
        questionOptions: state.questionOptions.filter(
          (o) => o.question_id !== action.payload
        ),
        answers: state.answers.filter((a) => a.question_id !== action.payload),
      };
      break;
    case "ADD_OPTION":
      newState = {
        ...state,
        questionOptions: [...state.questionOptions, action.payload],
      };
      break;
    case "UPDATE_OPTION":
      newState = {
        ...state,
        questionOptions: state.questionOptions.map((o) =>
          o.id === action.payload.id ? action.payload : o
        ),
      };
      break;
    case "DELETE_OPTION":
      newState = {
        ...state,
        questionOptions: state.questionOptions.filter(
          (o) => o.id !== action.payload
        ),
        answers: state.answers.map((a) => ({
          ...a,
          selected_options:
            a.selected_options?.filter((id) => id !== action.payload) || null,
        })),
      };
      break;
    case "ADD_RESPONSE":
      newState = { ...state, responses: [...state.responses, action.payload] };
      break;
    case "ADD_ANSWER":
      newState = { ...state, answers: [...state.answers, action.payload] };
      break;
    case "LOAD_STATE":
      newState = action.payload;
      break;
    default:
      return state;
  }

  saveState(newState);
  return newState;
}

const StoreContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Стан ініціалізується за допомогою loadState одразу
  const [state, dispatch] = useReducer(reducer, initialState, loadState);

  // Мемоізація значення контексту
  const contextValue = React.useMemo(
    () => ({ state, dispatch }),
    [state, dispatch]
  );

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
}

// Хук для використання стану
// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
