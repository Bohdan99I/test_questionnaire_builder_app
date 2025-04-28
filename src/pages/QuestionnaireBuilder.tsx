import React, { useState, useEffect, useCallback } from "react";
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Radio,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  FormGroup,
} from "@mui/material";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  AlertCircle,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import {
  Questionnaire,
  Question,
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
  const { id: questionnaireIdParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!questionnaireIdParam);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  //Завантаження даних для редагування 
  useEffect(() => {
    if (questionnaireIdParam && !isDataLoaded) {
      setIsLoading(true);
      console.log(`Завантаження даних для ID: ${questionnaireIdParam}`);
      const questionnaire = state.questionnaires.find(
        (q: Questionnaire) => q.id === questionnaireIdParam
      );

      if (questionnaire) {
        if (questionnaire.user_id !== user?.id) {
          setError("Ви не маєте права редагувати цей опитувальник.");
          setIsLoading(false);
          return;
        }

        setTitle(questionnaire.title);
        setDescription(questionnaire.description || "");

        const existingQuestionsRaw = state.questions
          .filter((q: Question) => q.questionnaire_id === questionnaireIdParam)
          .sort((a: Question, b: Question) => a.order - b.order);

        const questionIds = new Set(existingQuestionsRaw.map((q) => q.id));
        const relevantOptions = state.questionOptions
          .filter((o: IQuestionOption) => questionIds.has(o.question_id))
          .sort((a: IQuestionOption, b: IQuestionOption) => a.order - b.order);

        const optionsByQuestionId = relevantOptions.reduce((acc, option) => {
          (acc[option.question_id] = acc[option.question_id] || []).push(
            option
          );
          return acc;
        }, {} as Record<string, IQuestionOption[]>);

        const existingQuestions = existingQuestionsRaw.map(
          (q: Question): QuestionData => ({
            id: q.id,
            text: q.question_text,
            type: q.question_type,
            options: optionsByQuestionId[q.id] || [],
          })
        );

        setQuestions(existingQuestions);
        setIsDataLoaded(true);
      } else {
        setError(`Опитувальник з ID ${questionnaireIdParam} не знайдено.`);
      }
      setIsLoading(false);
    } else if (!questionnaireIdParam) {
      setIsLoading(false);
    }
  }, [
    questionnaireIdParam,
    state.questionnaires,
    state.questions,
    state.questionOptions,
    isDataLoaded,
    user?.id,
    navigate,
  ]);

  //Функції для управління станом конструктора опитувальників 
  const addQuestion = useCallback(() => {
    setQuestions((prevQuestions) => [
      ...prevQuestions,
      {
        id: crypto.randomUUID(),
        text: "",
        type: "text",
        options: [],
      },
    ]);
  }, []);

  const removeQuestion = useCallback((index: number) => {
    setQuestions((prevQuestions) => {
      const newQuestions = [...prevQuestions];
      newQuestions.splice(index, 1);
      return newQuestions;
    });
  }, []);

  const updateQuestion = useCallback(
    (
      index: number,
      field: keyof QuestionData,
      value: string | QuestionType
    ) => {
      setQuestions((prevQuestions) => {
        const newQuestions = [...prevQuestions];
        if (
          field === "type" &&
          (value === "text" ||
            value === "single_choice" ||
            value === "multiple_choice")
        ) {
          newQuestions[index] = {
            ...newQuestions[index],
            type: value as QuestionType,
          };
          if (value === "text") {
            newQuestions[index].options = [];
          }
        } else if (field === "text" && typeof value === "string") {
          newQuestions[index] = { ...newQuestions[index], text: value };
        } else if (field === "id" || field === "options") {
          console.warn(
            `Attempted to update restricted field '${field}' using updateQuestion`
          );
          return prevQuestions;
        }
        return newQuestions;
      });
    },
    []
  );

  const addOption = useCallback((questionIndex: number) => {
    setQuestions((prevQuestions) => {
      if (!prevQuestions[questionIndex]) return prevQuestions;

      const newQuestions = [...prevQuestions];
      const currentOptions = newQuestions[questionIndex].options || [];
      const newOption: IQuestionOption = {
        id: crypto.randomUUID(),
        question_id: newQuestions[questionIndex].id,
        option_text: "",
        order: currentOptions.length,
      };
      newQuestions[questionIndex].options = [...currentOptions, newOption];
      return newQuestions;
    });
  }, []);

  const updateOption = useCallback(
    (questionIndex: number, optionIndex: number, text: string) => {
      setQuestions((prevQuestions) => {
        if (!prevQuestions[questionIndex]?.options?.[optionIndex])
          return prevQuestions;

        const newQuestions = [...prevQuestions];
        const newOptions = [...newQuestions[questionIndex].options];
        newOptions[optionIndex] = {
          ...newOptions[optionIndex],
          option_text: text,
        };
        newQuestions[questionIndex].options = newOptions;
        return newQuestions;
      });
    },
    []
  );

  const removeOption = useCallback(
    (questionIndex: number, optionIndex: number) => {
      setQuestions((prevQuestions) => {
        if (!prevQuestions[questionIndex]?.options?.[optionIndex])
          return prevQuestions;

        const newQuestions = [...prevQuestions];
        const options = [...newQuestions[questionIndex].options];
        options.splice(optionIndex, 1);
        const updatedOptions = options.map((opt, idx) => ({
          ...opt,
          order: idx,
        }));
        newQuestions[questionIndex].options = updatedOptions;
        return newQuestions;
      });
    },
    []
  );

  //Обробники Drag & Drop 
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    setQuestions((prevQuestions) => {
      const items = Array.from(prevQuestions);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination!.index, 0, reorderedItem);
      return items;
    });
  }, []);

  const handleOptionDragEnd = useCallback(
    (questionIndex: number, result: DropResult) => {
      if (!result.destination) return;

      setQuestions((prevQuestions) => {
        if (!prevQuestions[questionIndex]?.options) return prevQuestions;

        const newQuestions = [...prevQuestions];
        const options = Array.from(newQuestions[questionIndex].options);
        const [reorderedItem] = options.splice(result.source.index, 1);
        options.splice(result.destination!.index, 0, reorderedItem);

        const updatedOptions = options.map((opt, index) => ({
          ...opt,
          order: index,
        }));

        newQuestions[questionIndex].options = updatedOptions;
        return newQuestions;
      });
    },
    []
  );

  // Збереження опитувальника 
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      //Валідація 
      if (!user?.id) {
        throw new Error("Користувач не автентифікований. Неможливо зберегти.");
      }
      if (!title.trim()) {
        throw new Error("Назва опитувальника не може бути порожньою.");
      }
      if (questions.length === 0) {
        throw new Error("Опитувальник повинен містити хоча б одне питання.");
      }

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question.text.trim()) {
          throw new Error(
            `Питання ${i + 1}: Текст питання не може бути порожнім.`
          );
        }
        if (
          question.type === "single_choice" ||
          question.type === "multiple_choice"
        ) {
          if (question.options.length < 2) {
            throw new Error(
              `Питання ${i + 1} (${
                question.text
              }): Питання з вибором повинні мати принаймні 2 варіанти.`
            );
          }
          for (let j = 0; j < question.options.length; j++) {
            const option = question.options[j];
            if (!option.option_text.trim()) {
              throw new Error(
                `Питання ${i + 1} (${question.text}): Варіант ${
                  j + 1
                } не може бути порожнім.`
              );
            }
          }
        }
      }

      // Логіка збереження опитувальника 
      const finalQuestionnaireId = questionnaireIdParam || crypto.randomUUID();

      // 1. Оновлюємо або додаємо сам опитувальник
      const questionnairePayload: Questionnaire = {
        id: finalQuestionnaireId,
        title: title.trim(),
        description: description.trim() || null,
        created_at: questionnaireIdParam
          ? state.questionnaires.find((q) => q.id === questionnaireIdParam)
              ?.created_at ?? new Date().toISOString()
          : new Date().toISOString(),
        user_id: user.id,
      };

      dispatch({
        type: questionnaireIdParam
          ? "UPDATE_QUESTIONNAIRE"
          : "ADD_QUESTIONNAIRE",
        payload: questionnairePayload,
      });

      // 2. Видаляємо старі питання та опції ТІЛЬКИ ЯКЩО РЕДАГУЄМО ОПИТУВАЛЬНИК
      const newQuestionMap = new Map<string, string>();
      const questionsToSave: Question[] = [];
      const optionsToSave: IQuestionOption[] = [];

      questions.forEach((localQuestion, index) => {
        const newQuestionId = crypto.randomUUID();
        newQuestionMap.set(localQuestion.id, newQuestionId);

        questionsToSave.push({
          id: newQuestionId,
          questionnaire_id: finalQuestionnaireId,
          question_text: localQuestion.text.trim(),
          question_type: localQuestion.type,
          order: index,
        });

        localQuestion.options.forEach((localOption, optionIndex) => {
          optionsToSave.push({
            id: crypto.randomUUID(),
            question_id: newQuestionId,
            option_text: localOption.option_text.trim(),
            order: optionIndex,
          });
        });
      });

      // 3. Видаляємо ВСІ старі питання та опції, пов'язані з questionnaireIdParam (тільки при редагуванні)
      if (questionnaireIdParam) {
        const oldQuestions = state.questions.filter(
          (q: Question) => q.questionnaire_id === questionnaireIdParam
        );
        const oldOptions = state.questionOptions.filter((o: IQuestionOption) =>
          oldQuestions.some((q) => q.id === o.question_id)
        );

        oldOptions.forEach((opt) =>
          dispatch({ type: "DELETE_OPTION", payload: opt.id })
        );
        oldQuestions.forEach((q) =>
          dispatch({ type: "DELETE_QUESTION", payload: q.id })
        );
      }

      // 4. Додаємо нові питання та опції
      questionsToSave.forEach((q) =>
        dispatch({ type: "ADD_QUESTION", payload: q })
      );
      optionsToSave.forEach((o) =>
        dispatch({ type: "ADD_OPTION", payload: o })
      );

      // 5. Успішне збереження - перехід на головну
      navigate("/");
    } catch (err) {
      console.error("Помилка збереження:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Невідома помилка при збереженні опитувальника."
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    title,
    description,
    questions,
    questionnaireIdParam,
    user,
    dispatch,
    navigate,
    state.questionnaires,
    state.questions,
    state.questionOptions,
  ]);

  // Рендеринг
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Показуємо помилку завантаження даних, якщо вона є (після завершення завантаження)
  if (!isLoading && error && !isSaving) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  // Показуємо помилку, якщо не вдалося завантажити опитувальник
  if (questionnaireIdParam && !isDataLoaded && !isLoading) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Не вдалося завантажити дані опитувальника.
      </Alert>
    );
  }

  return (
    <div>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          {questionnaireIdParam
            ? "Редагування опитувальника"
            : "Створення опитувальника"}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Eye size={18} />}
          onClick={() => setPreviewOpen(true)}
          disabled={questions.length === 0}
        >
          Превью
        </Button>
      </Box>

      {/* Форма назви та опису */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }} elevation={1}>
        <Box component="form" noValidate onSubmit={(e) => e.preventDefault()}>
          {" "}
          <TextField
            margin="normal"
            required
            fullWidth
            label="Назва опитувальника"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!title.trim()}
            helperText={!title.trim() ? "Назва обов'язкова" : ""}
            disabled={isSaving}
          />
          <TextField
            margin="normal"
            fullWidth
            multiline
            rows={3}
            label="Опис (опціонально)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />
        </Box>
      </Paper>

      {/* Секція питань */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Питання
      </Typography>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <List
              ref={provided.innerRef}
              {...provided.droppableProps}
              disablePadding
            >
              {questions.map((question, questionIndex) => (
                <Draggable
                  key={question.id}
                  draggableId={question.id}
                  index={questionIndex}
                >
                  {(providedDraggableQuestion) => (
                    <React.Fragment>
                      <Paper
                        elevation={2}
                        sx={{ mb: 2 }}
                        ref={providedDraggableQuestion.innerRef}
                        {...providedDraggableQuestion.draggableProps}
                      >
                        <ListItem
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            gap: 2,
                            py: 2,
                            px: { xs: 1, md: 2 },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              width: "100%",
                              alignItems: "flex-start",
                            }}
                          >
                            {/* Drag Handle */}
                            <Box
                              {...providedDraggableQuestion.dragHandleProps}
                              sx={{ pt: 1.5, cursor: "grab" }}
                            >
                              <GripVertical size={20} />
                            </Box>
                            {/* Текст та тип питання */}
                            <Box
                              sx={{
                                flexGrow: 1,
                                display: "flex",
                                flexDirection: { xs: "column", md: "row" },
                                gap: 2,
                              }}
                            >
                              <TextField
                                fullWidth
                                required
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
                                disabled={isSaving}
                                multiline
                                minRows={1}
                              />
                              <FormControl
                                sx={{ minWidth: { xs: "100%", md: 200 } }}
                                size="small"
                              >
                                {" "}
                                <InputLabel>Тип питання</InputLabel>
                                <Select
                                  value={question.type}
                                  label="Тип питання"
                                  onChange={(e) =>
                                    updateQuestion(
                                      questionIndex,
                                      "type",
                                      e.target.value as QuestionType
                                    )
                                  }
                                  disabled={isSaving}
                                >
                                  <MenuItem value="text">
                                    Текстова відповідь
                                  </MenuItem>
                                  <MenuItem value="single_choice">
                                    Один варіант
                                  </MenuItem>
                                  <MenuItem value="multiple_choice">
                                    Кілька варіантів
                                  </MenuItem>
                                </Select>
                              </FormControl>
                            </Box>
                            <Tooltip title="Видалити питання">
                              <IconButton
                                color="error"
                                onClick={() => removeQuestion(questionIndex)}
                                disabled={isSaving}
                                sx={{ ml: "auto" }}
                              >
                                <Trash2 size={20} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          {(question.type === "single_choice" ||
                            question.type === "multiple_choice") && (
                            <Box
                              sx={{
                                pl: { xs: 0, md: 4 },
                                pt: 1,
                                width: "100%",
                              }}
                            >
                              {" "}
                              <DragDropContext
                                onDragEnd={(result) =>
                                  handleOptionDragEnd(questionIndex, result)
                                }
                              >
                                <Droppable
                                  droppableId={`options-${question.id}`}
                                >
                                  {(providedOptions) => (
                                    <div
                                      ref={providedOptions.innerRef}
                                      {...providedOptions.droppableProps}
                                    >
                                      {question.options.map(
                                        (option, optionIndex) => (
                                          <Draggable
                                            key={option.id}
                                            draggableId={option.id}
                                            index={optionIndex}
                                          >
                                            {(providedDraggableOption) => (
                                              <Box
                                                ref={
                                                  providedDraggableOption.innerRef
                                                }
                                                {...providedDraggableOption.draggableProps}
                                                sx={{
                                                  display: "flex",
                                                  gap: 1,
                                                  mb: 1,
                                                  alignItems: "center",
                                                }}
                                              >
                                                <Box
                                                  {...providedDraggableOption.dragHandleProps}
                                                  sx={{
                                                    cursor: "grab",
                                                    display: "flex",
                                                    alignItems: "center",
                                                  }}
                                                >
                                                  <GripVertical size={18} />
                                                </Box>
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
                                                  disabled={isSaving}
                                                />
                                                <Tooltip title="Видалити варіант">
                                                  <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() =>
                                                      removeOption(
                                                        questionIndex,
                                                        optionIndex
                                                      )
                                                    }
                                                    disabled={isSaving}
                                                  >
                                                    <Trash2 size={18} />
                                                  </IconButton>
                                                </Tooltip>
                                              </Box>
                                            )}
                                          </Draggable>
                                        )
                                      )}
                                      {providedOptions.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </DragDropContext>
                              <Button
                                size="small"
                                startIcon={<Plus size={16} />}
                                onClick={() => addOption(questionIndex)}
                                sx={{ mt: 1, textTransform: "none" }}
                                disabled={isSaving}
                              >
                                Додати варіант
                              </Button>
                            </Box>
                          )}
                        </ListItem>
                      </Paper>
                    </React.Fragment>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>

      {/* Кнопка Додати питання */}
      <Box sx={{ mt: 2, mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<Plus />}
          onClick={addQuestion}
          disabled={isSaving}
        >
          Додати питання
        </Button>
      </Box>

      {/* Повідомлення про помилку збереження */}
      {error && isSaving && (
        <Alert severity="error" icon={<AlertCircle />} sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Кнопка Зберегти */}
      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={
            isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />
          }
          onClick={handleSave}
          disabled={
            isSaving || isLoading || !title.trim() || questions.length === 0
          }
        >
          {isSaving
            ? "Збереження..."
            : questionnaireIdParam
            ? "Оновити опитувальник"
            : "Зберегти опитувальник"}
        </Button>
      </Box>

      {/* Діалог Превью */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Превью опитувальника</DialogTitle>
        <DialogContent dividers>
          {" "}
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" paragraph>
              {description}
            </Typography>
          )}
          <List disablePadding>
            {questions.map((question, index) => (
              <ListItem
                key={question.id}
                sx={{ display: "block", mb: 2 }}
                divider
              >
                {" "}
                <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
                  {index + 1}. {question.text || "(Питання без тексту)"}
                </Typography>
                {question.type === "text" ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    disabled
                    placeholder="Місце для текстової відповіді"
                    variant="outlined"
                  />
                ) : question.type === "single_choice" ? (
                  <FormControl
                    component="fieldset"
                    disabled
                    sx={{ width: "100%" }}
                  >
                    <RadioGroup>
                      {question.options.map((option) => (
                        <FormControlLabel
                          key={option.id}
                          value={option.id}
                          control={<Radio />}
                          label={option.option_text || "(Варіант без тексту)"}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                ) : (
                  <FormControl
                    component="fieldset"
                    disabled
                    sx={{ width: "100%" }}
                  >
                    <FormGroup>
                      {question.options.map((option) => (
                        <FormControlLabel
                          key={option.id}
                          control={<Checkbox />}
                          label={option.option_text || "(Варіант без тексту)"}
                        />
                      ))}
                    </FormGroup>
                  </FormControl>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Закрити</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuestionnaireBuilder;