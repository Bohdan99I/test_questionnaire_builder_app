import React from "react";
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
} from "@mui/material";
import {
  Edit,
  Play,
  Trash2,
  BarChart,
  Copy,
  Upload,
  Download,
} from "lucide-react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { saveAs } from "file-saver";
import { Questionnaire, Question, QuestionOption } from "../lib/types";

const QuestionnaireCatalog = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const { user } = useAuth();
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);

  const userQuestionnaires = state.questionnaires.filter(
    (q) => q.user_id === user?.id
  );

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_QUESTIONNAIRE", payload: id });
  };

  const handleDuplicate = (questionnaire: Questionnaire) => {
    const newId = crypto.randomUUID();
    const oldId = questionnaire.id;

    // Дублюємо опитувальник
    dispatch({
      type: "ADD_QUESTIONNAIRE",
      payload: {
        ...questionnaire,
        id: newId,
        title: `${questionnaire.title} (копія)`,
        created_at: new Date().toISOString(),
      },
    });

    // Дублюємо питання
    const questions = state.questions.filter(
      (q) => q.questionnaire_id === oldId
    );
    questions.forEach((question) => {
      const newQuestionId = crypto.randomUUID();

      dispatch({
        type: "ADD_QUESTION",
        payload: {
          ...question,
          id: newQuestionId,
          questionnaire_id: newId,
        },
      });

      // Дублюємо варіанти відповідей
      const options = state.questionOptions.filter(
        (o) => o.question_id === question.id
      );
      options.forEach((option) => {
        dispatch({
          type: "ADD_OPTION",
          payload: {
            ...option,
            id: crypto.randomUUID(),
            question_id: newQuestionId,
          },
        });
      });
    });
  };

  const handleExport = (questionnaire: Questionnaire) => {
    const questions = state.questions.filter(
      (q) => q.questionnaire_id === questionnaire.id
    );
    const options = state.questionOptions.filter((o) =>
      questions.some((q) => q.id === o.question_id)
    );

    const exportData = {
      questionnaire,
      questions,
      options,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    saveAs(
      blob,
      `${questionnaire.title.toLowerCase().replace(/\s+/g, "-")}.json`
    );
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Валідація структури даних
        if (!data.questionnaire || !data.questions || !data.options) {
          throw new Error("Неправильний формат файлу");
        }

        // Генеруємо нові ID
        const newId = crypto.randomUUID();
        const idMapping = new Map<string, string>();

        // Імпортуємо опитувальник
        dispatch({
          type: "ADD_QUESTIONNAIRE",
          payload: {
            ...data.questionnaire,
            id: newId,
            user_id: user!.id,
            created_at: new Date().toISOString(),
          },
        });

        // Імпортуємо питання
        data.questions.forEach((question: Question) => {
          const newQuestionId = crypto.randomUUID();
          idMapping.set(question.id, newQuestionId);

          dispatch({
            type: "ADD_QUESTION",
            payload: {
              ...question,
              id: newQuestionId,
              questionnaire_id: newId,
            },
          });
        });

        // Імпортуємо варіанти відповідей
        data.options.forEach((option: QuestionOption) => {
          const questionId = idMapping.get(option.question_id);
          if (questionId) {
            dispatch({
              type: "ADD_OPTION",
              payload: {
                ...option,
                id: crypto.randomUUID(),
                question_id: questionId,
              },
            });
          }
        });

        setImportDialogOpen(false);
        setImportError(null);
      } catch (error) {
        setImportError("Помилка при імпорті файлу");
      }
    };
    reader.readAsText(file);
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
          Каталог опитувальників
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setImportDialogOpen(true)}
          >
            Імпортувати
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/create")}
          >
            Створити новий
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {userQuestionnaires.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">
              Ще немає створених опитувальників. Створіть свій перший
              опитувальник!
            </Alert>
          </Grid>
        ) : (
          userQuestionnaires.map((questionnaire) => {
            const questionCount = state.questions.filter(
              (q) => q.questionnaire_id === questionnaire.id
            ).length;

            const responseCount = state.responses.filter(
              (r) => r.questionnaire_id === questionnaire.id
            ).length;

            return (
              <Grid item xs={12} sm={6} md={4} key={questionnaire.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {questionnaire.title}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      gutterBottom
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        minHeight: "48px",
                      }}
                    >
                      {questionnaire.description || "Без опису"}
                    </Typography>
                    <Typography variant="body2">
                      Питань: {questionCount}
                    </Typography>
                    <Typography variant="body2">
                      Пройдено разів: {responseCount}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ flexWrap: "wrap", gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<Edit size={16} />}
                      onClick={() => navigate(`/edit/${questionnaire.id}`)}
                    >
                      Редагувати
                    </Button>
                    <Button
                      size="small"
                      color="primary"
                      startIcon={<Play size={16} />}
                      onClick={() => navigate(`/run/${questionnaire.id}`)}
                    >
                      Пройти
                    </Button>
                    <Button
                      size="small"
                      color="info"
                      startIcon={<BarChart size={16} />}
                      onClick={() =>
                        navigate(`/statistics/${questionnaire.id}`)
                      }
                    >
                      Статистика
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Copy size={16} />}
                      onClick={() => handleDuplicate(questionnaire)}
                    >
                      Дублювати
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Download size={16} />}
                      onClick={() => handleExport(questionnaire)}
                    >
                      Експорт
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Trash2 size={16} />}
                      onClick={() => handleDelete(questionnaire.id)}
                    >
                      Видалити
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
      >
        <DialogTitle>Імпорт опитувальника</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Виберіть файл JSON з опитувальником для імпорту
          </Typography>
          <TextField
            type="file"
            fullWidth
            inputProps={{
              accept: ".json",
              onChange: handleImport,
            }}
          />
          {importError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {importError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Скасувати</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuestionnaireCatalog;
