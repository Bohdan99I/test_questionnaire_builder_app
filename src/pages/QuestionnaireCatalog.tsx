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
} from "@mui/material";
import { Edit, Play, Trash2 } from "lucide-react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";

const QuestionnaireCatalog = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const { user } = useAuth();

  const userQuestionnaires = state.questionnaires.filter(
    (q) => q.user_id === user?.id
  );

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_QUESTIONNAIRE", payload: id });
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
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/create")}
        >
          Створити новий
        </Button>
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
                  <CardActions>
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
    </div>
  );
};

export default QuestionnaireCatalog;
