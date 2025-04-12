import React, { useState, useEffect, useMemo } from "react";
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
  CircularProgress,
} from "@mui/material";
import { useStore } from "../lib/store";
import { Question, QuestionOption } from "../lib/types";

interface PopulatedQuestion extends Question {
  options: QuestionOption[];
}

const QuestionnaireRun = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [startTime] = useState<Date>(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const questionnaire = useMemo(() => {
    return state.questionnaires.find((q) => q.id === id);
  }, [state.questionnaires, id]);

  const questions: PopulatedQuestion[] = useMemo(() => {
    if (!questionnaire) return [];

    const filteredQuestions = state.questions
      .filter((q) => q.questionnaire_id === id)
      .sort((a, b) => a.order - b.order);

    return filteredQuestions.map((question) => ({
      ...question,
      options: state.questionOptions
        .filter((o) => o.question_id === question.id)
        .sort((a, b) => a.order - b.order),
    }));
  }, [state.questions, state.questionOptions, id, questionnaire]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!questionnaire) {
        console.warn(`Опитувальник з ID ${id} не знайдено.`);
        navigate("/");
      } else {
        setIsLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [questionnaire, id, navigate]);

  // --- Рендер індикатора завантаження ---
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // --- Рендер помилки, якщо опитувальник не знайдено після завантаження ---
  if (!questionnaire || questions.length === 0) {
    return (
      <Alert severity="error">
        {!questionnaire
          ? `Опитувальник з ID ${id} не знайдено.`
          : `Для опитувальника "${questionnaire.title}" не знайдено питань.`}
      </Alert>
    );
  }

  // --- Рендер питання ---
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    console.error(
      "Помилка: Спроба доступу до неіснуючого питання за індексом",
      currentQuestionIndex
    );
    return (
      <Alert severity="error">
        Виникла внутрішня помилка відображення питання.
      </Alert>
    );
  }

  // --- Обробники відповідей ---
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
      let updatedAnswers: string[];
      if (checked) {
        updatedAnswers = [...new Set([...currentAnswers, optionId])];
      } else {
        updatedAnswers = currentAnswers.filter((id) => id !== optionId);
      }
      return {
        ...prev,
        [questionId]: updatedAnswers,
      };
    });
  };

  // --- Обробники навігації між питаннями ---
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setError(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setError(null);
    }
  };

  // --- Обробник відправки форми ---
  const handleSubmit = () => {
    setError(null);

    try {
      const unansweredQuestions = questions.filter((q) => {
        const answer = answers[q.id];
        if (answer === undefined || answer === null) return true;
        if (Array.isArray(answer) && answer.length === 0) return true;
        if (typeof answer === "string" && answer.trim() === "") return true;
        return false;
      });

      if (unansweredQuestions.length > 0) {
        const firstUnansweredIndex = questions.findIndex((q) =>
          unansweredQuestions.some((uq) => uq.id === q.id)
        );
        if (
          firstUnansweredIndex !== -1 &&
          firstUnansweredIndex !== currentQuestionIndex
        ) {
          setCurrentQuestionIndex(firstUnansweredIndex);
        }
        throw new Error(
          `Будь ласка, дайте відповідь на ${
            unansweredQuestions.length > 1 ? "всі питання" : "питання"
          }. Перше пропущене: "${unansweredQuestions[0].question_text}"`
        );
      }

      const endTime = new Date();
      const timeTakenSeconds = Math.round(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

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

      // Успішне завершення - перехід на головну або сторінку подяки
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Сталася невідома помилка при збереженні відповідей."
      );
      console.error("Помилка відправки:", err);
    }
  };

  // --- JSX Рендеринг ---
  return (
    <div>
      {/* Заголовок та опис опитувальника */}
      <Typography variant="h4" component="h1" gutterBottom>
        {questionnaire.title}
      </Typography>

      {questionnaire.description && (
        <Typography variant="body1" sx={{ mb: 4 }}>
          {questionnaire.description}
        </Typography>
      )}

      {/* Блок з поточним питанням */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Питання {currentQuestionIndex + 1} з {questions.length}
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          {currentQuestion.question_text}
        </Typography>

        {/* Умовний рендеринг полів вводу */}
        {currentQuestion.question_type === "text" && (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={answers[currentQuestion.id] ?? ""}
            onChange={(e) =>
              handleTextAnswer(currentQuestion.id, e.target.value)
            }
            label="Ваша відповідь"
            variant="outlined"
          />
        )}

        {currentQuestion.question_type === "single_choice" && (
          <RadioGroup
            value={answers[currentQuestion.id] ?? ""}
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
                    checked={
                      Array.isArray(answers[currentQuestion.id]) &&
                      (answers[currentQuestion.id] as string[]).includes(
                        option.id
                      )
                    }
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

      {/* Відображення помилки */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Кнопки навігації */}
      <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
        <Button
          variant="outlined"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || isLoading}
        >
          Назад
        </Button>
        {currentQuestionIndex === questions.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            Завершити
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext} disabled={isLoading}>
            Далі
          </Button>
        )}
      </Box>
    </div>
  );
};

export default QuestionnaireRun;
