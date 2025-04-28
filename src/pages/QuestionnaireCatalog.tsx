import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tooltip as MuiTooltip,
} from "@mui/material";
import {
  Edit,
  Play,
  Trash2,
  BarChart as StatsIcon,
  Copy,
  Upload,
  Download,
  AlertCircle,
} from "lucide-react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { saveAs } from "file-saver";

import {
  Questionnaire,
  Question,
  QuestionOption,
  QuestionnaireResponse,
} from "../lib/types";

interface QuestionnaireExportData {
  questionnaire: Questionnaire;
  questions: Question[];
  options: QuestionOption[];
}

const QuestionnaireCatalog = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const { user } = useAuth();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // --- Мемоізація фільтрованих опитувальників ---
  const userQuestionnaires = useMemo(() => {
    if (!user?.id) return [];
    return state.questionnaires.filter(
      (q: Questionnaire) => q.user_id === user.id
    );
  }, [state.questionnaires, user]);

  // --- Мемоізація підрахунку питань та відповідей ---
  const questionnaireCounts = useMemo(() => {
    const counts: Record<
      string,
      { questionCount: number; responseCount: number }
    > = {};
    const responses = state.responses || [];

    userQuestionnaires.forEach((q) => {
      const questionCount = state.questions.filter(
        (ques: Question) => ques.questionnaire_id === q.id
      ).length;
      const responseCount = responses.filter(
        (res: QuestionnaireResponse) => res.questionnaire_id === q.id
      ).length;
      counts[q.id] = { questionCount, responseCount };
    });
    return counts;
  }, [userQuestionnaires, state.questions, state.responses]);

  // --- Обробники дій ---
  const openConfirmDelete = useCallback((id: string) => {
    setDeletingId(id);
    setShowConfirmDelete(true);
  }, []);

  const closeConfirmDelete = useCallback(() => {
    setShowConfirmDelete(false);
    setDeletingId(null);
  }, []);

  const handleDelete = useCallback(() => {
    if (deletingId) {
      console.log(`Видалення опитувальника: ${deletingId}`);
      dispatch({ type: "DELETE_QUESTIONNAIRE", payload: deletingId });
      closeConfirmDelete();
    }
  }, [dispatch, deletingId, closeConfirmDelete]);

  const handleDuplicate = useCallback(
    (questionnaire: Questionnaire) => {
      if (!user?.id) return;

      const oldId = questionnaire.id;
      const newId = crypto.randomUUID();

      dispatch({
        type: "ADD_QUESTIONNAIRE",
        payload: {
          ...questionnaire,
          id: newId,
          title: `${questionnaire.title} (копія)`,
          created_at: new Date().toISOString(),
          user_id: user.id,
        },
      });

      // Отримуємо питання та опції для старого опитувальника
      const questionsToDuplicate = state.questions.filter(
        (q: Question) => q.questionnaire_id === oldId
      );
      const optionsToDuplicate = state.questionOptions.filter(
        (o: QuestionOption) =>
          questionsToDuplicate.some((q) => q.id === o.question_id)
      );

      const questionIdMapping = new Map<string, string>();

      // Дублюємо питання
      questionsToDuplicate.forEach((question) => {
        const newQuestionId = crypto.randomUUID();
        questionIdMapping.set(question.id, newQuestionId);

        dispatch({
          type: "ADD_QUESTION",
          payload: {
            ...question,
            id: newQuestionId,
            questionnaire_id: newId,
          },
        });
      });

      // Дублюємо варіанти відповідей
      optionsToDuplicate.forEach((option) => {
        const newQuestionId = questionIdMapping.get(option.question_id);
        if (newQuestionId) {
          dispatch({
            type: "ADD_OPTION",
            payload: {
              ...option,
              id: crypto.randomUUID(),
              question_id: newQuestionId,
            },
          });
        } else {
          console.warn(
            `Не знайдено відповідного питання для дублювання опції ${option.id} (старе ID питання ${option.question_id})`
          );
        }
      });
    },
    [dispatch, state.questions, state.questionOptions, user]
  );

  const handleExport = useCallback(
    (questionnaire: Questionnaire) => {
      const questions = state.questions.filter(
        (q: Question) => q.questionnaire_id === questionnaire.id
      );
      const options = state.questionOptions.filter((o: QuestionOption) =>
        questions.some((q) => q.id === o.question_id)
      );
      const exportData: QuestionnaireExportData = {
        questionnaire,
        questions,
        options,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const filename = `${
        questionnaire.title
          .toLowerCase()
          .replace(/[^a-z0-9ієїґ\- ]/g, "")
          .replace(/\s+/g, "-") || "questionnaire"
      }.json`;
      saveAs(blob, filename);
    },
    [state.questions, state.questionOptions]
  );

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Перевірка типу файлу
      if (file.type !== "application/json") {
        setImportError("Будь ласка, виберіть файл у форматі JSON.");
        if (event.target) event.target.value = "";
        return;
      }

      setIsImporting(true);
      setImportError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!user?.id) {
            throw new Error("Користувач не автентифікований.");
          }

          const content = e.target?.result as string;
          const parsedData = JSON.parse(content);
          // --- Розширена валідація структури даних ---
          if (
            typeof parsedData !== "object" ||
            parsedData === null ||
            typeof parsedData.questionnaire !== "object" ||
            parsedData.questionnaire === null ||
            !Array.isArray(parsedData.questions) ||
            !Array.isArray(parsedData.options) ||
            typeof parsedData.questionnaire.id !== "string" ||
            typeof parsedData.questionnaire.title !== "string"
          ) {
            throw new Error(
              "Неправильна структура або відсутні ключові поля у файлі JSON."
            );
          }

          // Приводимо тип після валідації
          const data = parsedData as QuestionnaireExportData;

          // Генеруємо нові ID
          const newQuestionnaireId = crypto.randomUUID();
          const questionIdMapping = new Map<string, string>();

          // Імпортуємо опитувальник
          dispatch({
            type: "ADD_QUESTIONNAIRE",
            payload: {
              id: newQuestionnaireId,
              title: data.questionnaire.title,
              description: data.questionnaire.description ?? null,
              created_at: new Date().toISOString(),
              user_id: user.id,
            },
          });

          // Імпортуємо питання
          data.questions.forEach((question: Question) => {
            const oldQuestionId = question.id;
            const newQuestionId = crypto.randomUUID();
            questionIdMapping.set(oldQuestionId, newQuestionId);

            dispatch({
              type: "ADD_QUESTION",
              payload: {
                id: newQuestionId,
                questionnaire_id: newQuestionnaireId,
                question_text: question.question_text,
                question_type: question.question_type,
                order: typeof question.order === "number" ? question.order : 0,
              },
            });
          });

          // Імпортуємо варіанти відповідей
          data.options.forEach((option: QuestionOption) => {
            const newQuestionId = questionIdMapping.get(option.question_id);
            if (newQuestionId) {
              dispatch({
                type: "ADD_OPTION",
                payload: {
                  id: crypto.randomUUID(),
                  question_id: newQuestionId,
                  option_text: option.option_text,
                  order: typeof option.order === "number" ? option.order : 0,
                },
              });
            } else {
              console.warn(
                `Пропущено опцію ${option.id}, оскільки відповідне питання (${option.question_id}) не знайдено в імпортованих даних.`
              );
            }
          });

          setImportDialogOpen(false);
        } catch (error) {
          console.error("Помилка імпорту:", error);
          setImportError(
            error instanceof Error
              ? error.message
              : "Не вдалося обробити файл. Перевірте формат та вміст."
          );
        } finally {
          setIsImporting(false);
          if (event.target) event.target.value = "";
        }
      };

      reader.onerror = (error) => {
        console.error("Помилка читання файлу:", error);
        setImportError("Не вдалося прочитати файл.");
        setIsImporting(false);
        if (event.target) event.target.value = "";
      };

      reader.readAsText(file);
    },
    [dispatch, user]
  );

  return (
    <div>
      {/* Заголовок та кнопки дій */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Каталог опитувальників
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {" "}
          <Button
            variant="outlined"
            startIcon={<Upload size={18} />}
            onClick={() => {
              setImportDialogOpen(true);
              setImportError(null);
            }}
            disabled={!user}
          >
            Імпортувати
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/create")}
            disabled={!user}
          >
            Створити новий
          </Button>
        </Box>
      </Box>

      {/* Сітка з картками опитувальників */}
      <Grid container spacing={3}>
        {!user && (
          <Grid item xs={12}>
            <Alert severity="warning">
              Будь ласка, увійдіть, щоб побачити ваші опитувальники.
            </Alert>
          </Grid>
        )}

        {user && userQuestionnaires.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              Ще немає створених опитувальників. Створіть свій перший
              опитувальник!
            </Alert>
          </Grid>
        )}

        {user &&
          userQuestionnaires.map((questionnaire: Questionnaire) => {
            const counts = questionnaireCounts[questionnaire.id] || {
              questionCount: 0,
              responseCount: 0,
            };

            return (
              <Grid item xs={12} sm={6} md={4} key={questionnaire.id}>
                <Card
                  elevation={2}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  {" "}
                  <CardContent sx={{ flexGrow: 1 }}>
                    {" "}
                    <MuiTooltip title={questionnaire.title} placement="top">
                      <Typography
                        variant="h6"
                        component="h2"
                        gutterBottom
                        noWrap
                      >
                        {questionnaire.title}
                      </Typography>
                    </MuiTooltip>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        minHeight: "40px",
                        mb: 1,
                      }}
                    >
                      {questionnaire.description || " "}{" "}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {" "}
                      Питань: {counts.questionCount}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Пройдено разів: {counts.responseCount}
                    </Typography>
                  </CardContent>
                  <CardActions
                    sx={{
                      flexWrap: "wrap",
                      gap: 0.5,
                      pt: 0,
                      justifyContent: "flex-start",
                    }}
                  >
                    {" "}
                    <MuiTooltip title="Редагувати структуру">
                      <Button
                        size="small"
                        startIcon={<Edit size={16} />}
                        onClick={() => navigate(`/edit/${questionnaire.id}`)}
                      >
                        Редагувати
                      </Button>
                    </MuiTooltip>
                    <MuiTooltip title="Пройти опитування">
                      <Button
                        size="small"
                        color="primary"
                        startIcon={<Play size={16} />}
                        onClick={() => navigate(`/run/${questionnaire.id}`)}
                      >
                        Пройти
                      </Button>
                    </MuiTooltip>
                    <MuiTooltip title="Переглянути статистику">
                      <Button
                        size="small"
                        color="info"
                        startIcon={<StatsIcon size={16} />}
                        onClick={() =>
                          navigate(`/statistics/${questionnaire.id}`)
                        }
                      >
                        Статистика
                      </Button>
                    </MuiTooltip>
                    <MuiTooltip title="Створити копію">
                      <Button
                        size="small"
                        startIcon={<Copy size={16} />}
                        onClick={() => handleDuplicate(questionnaire)}
                      >
                        Копія
                      </Button>
                    </MuiTooltip>
                    <MuiTooltip title="Зберегти у файл">
                      <Button
                        size="small"
                        startIcon={<Download size={16} />}
                        onClick={() => handleExport(questionnaire)}
                      >
                        Експортувати
                      </Button>
                    </MuiTooltip>
                    <MuiTooltip title="Видалити опитувальник">
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Trash2 size={16} />}
                        onClick={() => openConfirmDelete(questionnaire.id)}
                      >
                        Видалити
                      </Button>
                    </MuiTooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
      </Grid>

      {/* Діалог імпорту */}
      <Dialog
        open={importDialogOpen}
        onClose={() => !isImporting && setImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Імпорт опитувальника</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Виберіть файл JSON, експортований з цього додатку.
          </Typography>
          <TextField
            type="file"
            fullWidth
            size="small"
            inputProps={{
              accept: ".json,application/json",
              onChange: handleImport,
            }}
            disabled={isImporting}
            sx={{ mb: 2 }}
          />
          {isImporting && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "text.secondary",
              }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2">Обробка файлу...</Typography>
            </Box>
          )}
          {importError && (
            <Alert
              severity="error"
              icon={<AlertCircle size={20} />}
              sx={{ mt: 2 }}
            >
              {importError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setImportDialogOpen(false)}
            disabled={isImporting}
          >
            Скасувати
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог підтвердження видалення */}
      <Dialog open={showConfirmDelete} onClose={closeConfirmDelete}>
        <DialogTitle>Підтвердити видалення</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити цей опитувальник? Ця дія є
            незворотною і призведе до видалення всіх пов'язаних питань,
            варіантів та відповідей.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDelete}>Скасувати</Button>
          <Button onClick={handleDelete} color="error">
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuestionnaireCatalog;
