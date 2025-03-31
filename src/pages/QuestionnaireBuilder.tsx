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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Plus, Trash2, GripVertical, Save, Eye } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { QuestionOption as IQuestionOption, QuestionType } from "../lib/types";

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
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items);
  };

  const handleOptionDragEnd = (questionIndex: number, result: any) => {
    if (!result.destination) return;

    const newQuestions = [...questions];
    const options = Array.from(newQuestions[questionIndex].options);
    const [reorderedItem] = options.splice(result.source.index, 1);
    options.splice(result.destination.index, 0, reorderedItem);

    newQuestions[questionIndex].options = options;
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

      if (id) {
        const oldQuestions = state.questions.filter(
          (q) => q.questionnaire_id === id
        );
        oldQuestions.forEach((q) => {
          dispatch({ type: "DELETE_QUESTION", payload: q.id });
        });
      }

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
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1">
          {id ? "Редагування опитувальника" : "Створення опитувальника"}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Eye />}
          onClick={() => setPreviewOpen(true)}
          disabled={questions.length === 0}
        >
          Превью
        </Button>
      </Box>

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

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <List ref={provided.innerRef} {...provided.droppableProps}>
              {questions.map((question, questionIndex) => (
                <Draggable
                  key={question.id}
                  draggableId={question.id}
                  index={questionIndex}
                >
                  {(provided) => (
                    <React.Fragment>
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: 2,
                          py: 3,
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
                          <IconButton
                            size="small"
                            sx={{ mt: 1 }}
                            {...provided.dragHandleProps}
                          >
                            <GripVertical />
                          </IconButton>
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              fullWidth
                              label={`Питання ${questionIndex + 1}`}
                              value={question.text}
                              onChange={(e) =>
                                updateQuestion(
                                  questionIndex,
                                  "text",
                                  e.target.value
                                )
                              }
                              error={!question.text.trim()}
                              helperText={
                                !question.text.trim()
                                  ? "Текст питання обов'язковий"
                                  : ""
                              }
                            />
                          </Box>
                          <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Тип питання</InputLabel>
                            <Select
                              value={question.type}
                              label="Тип питання"
                              onChange={(e) =>
                                updateQuestion(
                                  questionIndex,
                                  "type",
                                  e.target.value
                                )
                              }
                            >
                              <MenuItem value="text">
                                Текстова відповідь
                              </MenuItem>
                              <MenuItem value="single_choice">
                                Одиночний вибір
                              </MenuItem>
                              <MenuItem value="multiple_choice">
                                Множинний вибір
                              </MenuItem>
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
                            <DragDropContext
                              onDragEnd={(result) =>
                                handleOptionDragEnd(questionIndex, result)
                              }
                            >
                              <Droppable droppableId={`options-${question.id}`}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                  >
                                    {question.options.map(
                                      (option, optionIndex) => (
                                        <Draggable
                                          key={option.id}
                                          draggableId={option.id}
                                          index={optionIndex}
                                        >
                                          {(provided) => (
                                            <Box
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              sx={{
                                                display: "flex",
                                                gap: 1,
                                                mb: 1,
                                                alignItems: "center",
                                              }}
                                            >
                                              <IconButton
                                                size="small"
                                                {...provided.dragHandleProps}
                                              >
                                                <GripVertical />
                                              </IconButton>
                                              <TextField
                                                size="small"
                                                fullWidth
                                                label={`Варіант ${
                                                  optionIndex + 1
                                                }`}
                                                value={option.option_text}
                                                onChange={(e) =>
                                                  updateOption(
                                                    questionIndex,
                                                    optionIndex,
                                                    e.target.value
                                                  )
                                                }
                                                error={
                                                  !option.option_text.trim()
                                                }
                                                helperText={
                                                  !option.option_text.trim()
                                                    ? "Текст варіанту обов'язковий"
                                                    : ""
                                                }
                                              />
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() =>
                                                  removeOption(
                                                    questionIndex,
                                                    optionIndex
                                                  )
                                                }
                                              >
                                                <Trash2 />
                                              </IconButton>
                                            </Box>
                                          )}
                                        </Draggable>
                                      )
                                    )}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContext>
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
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>

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

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Превью опитувальника</DialogTitle>
        <DialogContent>
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" paragraph>
              {description}
            </Typography>
          )}
          {questions.map((question, index) => (
            <Paper key={question.id} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {index + 1}. {question.text}
              </Typography>
              {question.type === "text" ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  disabled
                  placeholder="Місце для текстової відповіді"
                />
              ) : question.type === "single_choice" ? (
                <FormControl component="fieldset">
                  {question.options.map((option) => (
                    <div key={option.id}>
                      <input
                        type="radio"
                        disabled
                        style={{ marginRight: "8px" }}
                      />
                      {option.option_text}
                    </div>
                  ))}
                </FormControl>
              ) : (
                <FormControl component="fieldset">
                  {question.options.map((option) => (
                    <div key={option.id}>
                      <input
                        type="checkbox"
                        disabled
                        style={{ marginRight: "8px" }}
                      />
                      {option.option_text}
                    </div>
                  ))}
                </FormControl>
              )}
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Закрити</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuestionnaireBuilder;
