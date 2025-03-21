import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Alert,
} from "@mui/material";
import { useStore } from "../lib/store";
import { Question, QuestionOption } from "../lib/types";

interface QuestionWithOptions extends Question {
  options: QuestionOption[];
}

const QuestionnaireRun = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [startTime] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const questionnaire = state.questionnaires.find((q) => q.id === id);
  const questions = state.questions
    .filter((q) => q.questionnaire_id === id)
    .sort((a, b) => a.order - b.order)
    .map((question) => ({
      ...question,
      options: state.questionOptions
        .filter((o) => o.question_id === question.id)
        .sort((a, b) => a.order - b.order),
    }));

  useEffect(() => {
    if (!questionnaire) {
      navigate("/");
    }
  }, [questionnaire, navigate]);

  if (!questionnaire || questions.length === 0) {
    return <Alert severity="error">Опитувальник не знайдено</Alert>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleTextAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSingleChoice = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleMultipleChoice = (
    questionId: string,
    optionId: string,
    checked: boolean
  ) => {
    setAnswers((prev) => {
      const currentAnswers = (prev[questionId] as string[]) || [];
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentAnswers, optionId],
        };
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter((id) => id !== optionId),
        };
      }
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    try {
      setError(null);

      // Перевірка відповідей
      const unansweredQuestions = questions.filter((q) => {
        const answer = answers[q.id];
        if (!answer) return true;
        if (Array.isArray(answer) && answer.length === 0) return true;
        if (typeof answer === "string" && !answer.trim()) return true;
        return false;
      });

      if (unansweredQuestions.length > 0) {
        throw new Error("Будь ласка, дайте відповідь на всі питання");
      }

      const endTime = new Date();
      const timeTakenSeconds = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      // Створення запису про проходження
      const responseId = crypto.randomUUID();
      dispatch({
        type: "ADD_RESPONSE",
        payload: {
          id: responseId,
          questionnaire_id: questionnaire.id,
          started_at: startTime.toISOString(),
          completed_at: endTime.toISOString(),
          time_taken_seconds: timeTakenSeconds,
        },
      });

      // Збереження відповідей
      Object.entries(answers).forEach(([questionId, answer]) => {
        dispatch({
          type: "ADD_ANSWER",
          payload: {
            id: crypto.randomUUID(),
            response_id: responseId,
            question_id: questionId,
            answer_text: typeof answer === "string" ? answer : null,
            selected_options: Array.isArray(answer) ? answer : null,
          },
        });
      });

      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Помилка при збереженні відповідей"
      );
    }
  };

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        {questionnaire.title}
      </Typography>

      {questionnaire.description && (
        <Typography variant="body1" sx={{ mb: 4 }}>
          {questionnaire.description}
        </Typography>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Питання {currentQuestionIndex + 1} з {questions.length}
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          {currentQuestion.question_text}
        </Typography>

        {currentQuestion.question_type === "text" && (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={answers[currentQuestion.id] || ""}
            onChange={(e) =>
              handleTextAnswer(currentQuestion.id, e.target.value)
            }
          />
        )}

        {currentQuestion.question_type === "single_choice" && (
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onChange={(e) =>
              handleSingleChoice(currentQuestion.id, e.target.value)
            }
          >
            {currentQuestion.options.map((option) => (
              <FormControlLabel
                key={option.id}
                value={option.id}
                control={<Radio />}
                label={option.option_text}
              />
            ))}
          </RadioGroup>
        )}

        {currentQuestion.question_type === "multiple_choice" && (
          <FormGroup>
            {currentQuestion.options.map((option) => (
              <FormControlLabel
                key={option.id}
                control={
                  <Checkbox
                    checked={(
                      (answers[currentQuestion.id] as string[]) || []
                    ).includes(option.id)}
                    onChange={(e) =>
                      handleMultipleChoice(
                        currentQuestion.id,
                        option.id,
                        e.target.checked
                      )
                    }
                  />
                }
                label={option.option_text}
              />
            ))}
          </FormGroup>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
        <Button
          variant="outlined"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Назад
        </Button>
        {currentQuestionIndex === questions.length - 1 ? (
          <Button variant="contained" onClick={handleSubmit}>
            Завершити
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Далі
          </Button>
        )}
      </Box>
    </div>
  );
};

export default QuestionnaireRun;
