import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  Divider,
  Alert,
} from "@mui/material";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { useStore } from "../lib/store";
import {
  QuestionOption as IQuestionOption,
  QuestionType,
} from "../lib/types";

interface QuestionData {
  id: string;
  text: string;
  type: QuestionType;
  options: IQuestionOption[];
}

const QuestionnaireBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const questionnaire = state.questionnaires.find((q) => q.id === id);
      if (questionnaire) {
        setTitle(questionnaire.title);
        setDescription(questionnaire.description || "");

        const existingQuestions = state.questions
          .filter((q) => q.questionnaire_id === id)
          .sort((a, b) => a.order - b.order)
          .map((q) => ({
            id: q.id,
            text: q.question_text,
            type: q.question_type,
            options: state.questionOptions
              .filter((o) => o.question_id === q.id)
              .sort((a, b) => a.order - b.order),
          }));

        setQuestions(existingQuestions);
      }
    }
  }, [id, state.questionnaires, state.questions, state.questionOptions]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        text: "",
        type: "text",
        options: [],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionData,
    value: any
  ) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };

    if (field === "type" && value === "text") {
      newQuestions[index].options = [];
    }

    setQuestions(newQuestions);
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push({
      id: crypto.randomUUID(),
      question_id: questions[questionIndex].id,
      option_text: "",
      order: newQuestions[questionIndex].options.length,
    });
    setQuestions(newQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    text: string
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex].option_text = text;
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(newQuestions);
  };

  const handleSave = () => {
    try {
      setError(null);

      if (!title.trim()) {
        throw new Error("Назва опитувальника обов'язкова");
      }

      if (questions.length === 0) {
        throw new Error("Додайте хоча б одне питання");
      }

      // Перевірка валідності питань
      for (const question of questions) {
        if (!question.text.trim()) {
          throw new Error("Всі питання повинні мати текст");
        }
        if (
          (question.type === "single_choice" ||
            question.type === "multiple_choice") &&
          question.options.length < 2
        ) {
          throw new Error(
            "Питання з вибором повинні мати мінімум 2 варіанти відповіді"
          );
        }
        for (const option of question.options) {
          if (!option.option_text.trim()) {
            throw new Error("Всі варіанти відповідей повинні мати текст");
          }
        }
      }

      const questionnaireId = id || crypto.randomUUID();

      if (id) {
        // Оновлення існуючого опитувальника
        dispatch({
          type: "UPDATE_QUESTIONNAIRE",
          payload: {
            id: questionnaireId,
            title,
            description: description || null,
            created_at:
              state.questionnaires.find((q) => q.id === id)?.created_at ||
              new Date().toISOString(),
            user_id: user?.id || "",
          },
        });
      } else {
        // Створення нового опитувальника
        dispatch({
          type: "ADD_QUESTIONNAIRE",
          payload: {
            id: questionnaireId,
            title,
            description: description || null,
            created_at: new Date().toISOString(),
            user_id: user?.id || "",
          },
        });
      }

      // Видалення старих питань та опцій
      if (id) {
        const oldQuestions = state.questions.filter(
          (q) => q.questionnaire_id === id
        );
        oldQuestions.forEach((q) => {
          dispatch({ type: "DELETE_QUESTION", payload: q.id });
        });
      }

      // Створення нових питань
      questions.forEach((question, index) => {
        const questionId = question.id;

        dispatch({
          type: "ADD_QUESTION",
          payload: {
            id: questionId,
            questionnaire_id: questionnaireId,
            question_text: question.text,
            question_type: question.type,
            order: index,
          },
        });

        // Створення варіантів відповідей
        question.options.forEach((option, optionIndex) => {
          dispatch({
            type: "ADD_OPTION",
            payload: {
              id: option.id,
              question_id: questionId,
              option_text: option.option_text,
              order: optionIndex,
            },
          });
        });
      });

      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Помилка при збереженні опитувальника"
      );
    }
  };

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        {id ? "Редагування опитувальника" : "Створення опитувальника"}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box component="form" noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Назва опитувальника"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!title.trim()}
            helperText={!title.trim() ? "Назва обов'язкова" : ""}
          />
          <TextField
            margin="normal"
            fullWidth
            multiline
            rows={4}
            label="Опис"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Питання
      </Typography>

      <List>
        {questions.map((question, questionIndex) => (
          <React.Fragment key={question.id}>
            <ListItem
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: 2,
                py: 3,
              }}
            >
              <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
                <IconButton size="small" sx={{ mt: 1 }}>
                  <GripVertical />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label={`Питання ${questionIndex + 1}`}
                    value={question.text}
                    onChange={(e) =>
                      updateQuestion(questionIndex, "text", e.target.value)
                    }
                    error={!question.text.trim()}
                    helperText={
                      !question.text.trim() ? "Текст питання обов'язковий" : ""
                    }
                  />
                </Box>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Тип питання</InputLabel>
                  <Select
                    value={question.type}
                    label="Тип питання"
                    onChange={(e) =>
                      updateQuestion(questionIndex, "type", e.target.value)
                    }
                  >
                    <MenuItem value="text">Текстова відповідь</MenuItem>
                    <MenuItem value="single_choice">Одиночний вибір</MenuItem>
                    <MenuItem value="multiple_choice">Множинний вибір</MenuItem>
                  </Select>
                </FormControl>
                <IconButton
                  color="error"
                  onClick={() => removeQuestion(questionIndex)}
                >
                  <Trash2 />
                </IconButton>
              </Box>

              {(question.type === "single_choice" ||
                question.type === "multiple_choice") && (
                <Box sx={{ pl: 7, width: "100%" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Варіанти відповідей:
                  </Typography>
                  {question.options.map((option, optionIndex) => (
                    <Box
                      key={option.id}
                      sx={{
                        display: "flex",
                        gap: 1,
                        mb: 1,
                        alignItems: "center",
                      }}
                    >
                      <IconButton size="small">
                        <GripVertical />
                      </IconButton>
                      <TextField
                        size="small"
                        fullWidth
                        label={`Варіант ${optionIndex + 1}`}
                        value={option.option_text}
                        onChange={(e) =>
                          updateOption(
                            questionIndex,
                            optionIndex,
                            e.target.value
                          )
                        }
                        error={!option.option_text.trim()}
                        helperText={
                          !option.option_text.trim()
                            ? "Текст варіанту обов'язковий"
                            : ""
                        }
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeOption(questionIndex, optionIndex)}
                      >
                        <Trash2 />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    startIcon={<Plus />}
                    onClick={() => addOption(questionIndex)}
                    sx={{ mt: 1 }}
                  >
                    Додати варіант
                  </Button>
                </Box>
              )}
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ mt: 2, mb: 4 }}>
        <Button variant="outlined" startIcon={<Plus />} onClick={addQuestion}>
          Додати питання
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={!title.trim() || questions.length === 0}
        >
          Зберегти опитувальник
        </Button>
      </Box>
    </div>
  );
};

export default QuestionnaireBuilder;
