import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../lib/store";
import { QuestionAnswer, QuestionOption } from "../lib/types";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF4560",
  "#775DD0",
];

const formatTime = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "N/A";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} хв ${seconds} сек`;
};

const QuestionnaireStatistics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useStore();

  // --- Отримання даних про опитувальник ---
  const questionnaire = useMemo(
    () => state.questionnaires.find((q) => q.id === id),
    [state.questionnaires, id]
  );

  const questions = useMemo(
    () =>
      state.questions
        .filter((q) => q.questionnaire_id === id)
        .sort((a, b) => a.order - b.order),
    [state.questions, id]
  );

  const responses = useMemo(
    () => state.responses.filter((r) => r.questionnaire_id === id),
    [state.responses, id]
  );

  // --- Оптимізований вибір відповідей та опцій для поточного опитувальника ---
  const relevantAnswers = useMemo(() => {
    const responseIds = new Set(responses.map((r) => r.id));
    return state.answers.filter((a) => responseIds.has(a.response_id));
  }, [state.answers, responses]);

  const relevantOptions = useMemo(() => {
    const questionIds = new Set(questions.map((q) => q.id));
    return state.questionOptions.filter((o) => questionIds.has(o.question_id));
  }, [state.questionOptions, questions]);

  // --- Обчислення статистики ---

  const averageTimeSeconds = useMemo(() => {
    if (responses.length === 0) return 0;
    const totalTime = responses.reduce(
      (sum, r) => sum + (r.time_taken_seconds ?? 0),
      0
    );
    return responses.length > 0 ? Math.round(totalTime / responses.length) : 0;
  }, [responses]);

  const questionStatistics = useMemo(() => {
    const answersByQuestionId = relevantAnswers.reduce((acc, answer) => {
      (acc[answer.question_id] = acc[answer.question_id] || []).push(answer);
      return acc;
    }, {} as Record<string, QuestionAnswer[]>);

    const optionsByQuestionId = relevantOptions.reduce((acc, option) => {
      (acc[option.question_id] = acc[option.question_id] || []).push(option);
      acc[option.question_id].sort((a, b) => a.order - b.order);
      return acc;
    }, {} as Record<string, QuestionOption[]>);

    return questions.map((question) => {
      const questionAnswers = answersByQuestionId[question.id] || [];
      const questionOptions = optionsByQuestionId[question.id] || [];

      if (question.question_type === "text") {
        return {
          questionId: question.id,
          questionText: question.question_text,
          type: question.question_type,
          totalAnswers: questionAnswers.length,
          answers: questionAnswers
            .map((a) => a.answer_text)
            .filter((text): text is string => !!text),
        };
      }

      const optionCounts = questionOptions.map((option) => {
        const count = questionAnswers.filter(
          (a) =>
            Array.isArray(a.selected_options) &&
            a.selected_options.includes(option.id)
        ).length;

        return {
          name: option.option_text,
          value: count,
          id: option.id,
        };
      });

      const totalSelections = optionCounts.reduce(
        (sum, opt) => sum + opt.value,
        0
      );

      return {
        questionId: question.id,
        questionText: question.question_text,
        type: question.question_type,
        totalAnswers: questionAnswers.length,
        optionCounts,
        totalSelections,
      };
    });
  }, [questions, relevantAnswers, relevantOptions]);

  // --- Рендеринг ---

  if (!questionnaire) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Опитувальник з ID "{id}" не знайдено. Перевірте URL або поверніться до
        каталогу.
        <Button onClick={() => navigate("/")} sx={{ ml: 2 }}>
          До каталогу
        </Button>
      </Alert>
    );
  }

  return (
    <div>
      {/* Заголовок та кнопка "Назад" */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate("/")}
        >
          Назад до каталогу
        </Button>
        {/* Заголовок сторінки */}
        <Typography
          variant="h4"
          component="h1"
          sx={{ flexGrow: 1, textAlign: { xs: "center", sm: "left" } }}
        >
          Статистика: {questionnaire.title}
        </Typography>
      </Box>

      {/* Блок загальної статистики */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          {" "}
          <Card elevation={2}>
            {" "}
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Загальна інформація
              </Typography>
              <Typography variant="body1" component="p" gutterBottom>
                {" "}
                Всього отримано відповідей: <strong>{responses.length}</strong>
              </Typography>
              <Typography variant="body1" component="p">
                Середній час проходження:{" "}
                <strong>{formatTime(averageTimeSeconds)}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Перевірка, чи є взагалі статистика для відображення */}
      {questionStatistics.length === 0 && (
        <Alert severity="info" sx={{ m: 3 }}>
          Ще немає відповідей для цього опитувальника, щоб показати статистику.
        </Alert>
      )}

      {/* Статистика по кожному питанню */}
      {questionStatistics.map((stat) => (
        <Paper key={stat.questionId} sx={{ p: 3, mb: 3 }} elevation={1}>
          {" "}
          <Typography variant="h6" gutterBottom>
            {stat.questionText}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Тип:{" "}
            {stat.type === "text"
              ? "Текст"
              : stat.type === "single_choice"
              ? "Один варіант"
              : "Кілька варіантів"}{" "}
            | Всього відповідей: {stat.totalAnswers}
            {/* Показуємо загальну кількість виборів для multiple_choice */}
            {stat.type === "multiple_choice" &&
              ` | Всього обрано варіантів: ${stat.totalSelections}`}
          </Typography>
          {stat.type === "text" ? (
            <>
              {stat.answers.length > 0 ? (
                <Box
                  sx={{
                    maxHeight: 250,
                    overflowY: "auto",
                    border: "1px solid #eee",
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  <List dense disablePadding>
                    {" "}
                    {stat.answers.map((answer, i) => (
                      <ListItem key={i} disableGutters>
                        <ListItemText primary={`• ${answer}`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                  Немає текстових відповідей.
                </Typography>
              )}
            </>
          ) : (
            <>
              {/* Перевірка, чи є дані для діаграми */}
              {stat.optionCounts &&
              stat.optionCounts.length > 0 &&
              stat.optionCounts.some((opt) => opt.value > 0) ? (
                <Box sx={{ height: 350, width: "100%" }}>
                  {" "}
                  <ResponsiveContainer width="100%" height="100%">
                    {stat.type === "single_choice" ? (
                      <PieChart>
                        <Pie
                          data={stat.optionCounts.filter(
                            (opt) => opt.value > 0
                          )}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          fill="#8884d8"
                          labelLine={false}
                          label={({
                            cx,
                            cy,
                            midAngle,
                            innerRadius,
                            outerRadius,
                            percent,
                            index,
                            name,
                            value,
                          }) => {
                            const RADIAN = Math.PI / 180;
                            const radius =
                              innerRadius + (outerRadius - innerRadius) * 1.2;
                            const x =
                              cx + radius * Math.cos(-midAngle * RADIAN);
                            const y =
                              cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text
                                x={x}
                                y={y}
                                fill={COLORS[index % COLORS.length]}
                                textAnchor={x > cx ? "start" : "end"}
                                dominantBaseline="central"
                                fontSize="12"
                              >
                                {`${name} (${value} - ${(percent * 100).toFixed(
                                  0
                                )}%)`}
                              </text>
                            );
                          }}
                        >
                          {stat.optionCounts
                            .filter((opt) => opt.value > 0)
                            .map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${value} (${(
                              (value / stat.totalAnswers) *
                              100
                            ).toFixed(1)}%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    ) : (
                      <BarChart
                        data={stat.optionCounts}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />{" "}
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          interval={0}
                        />{" "}
                        <YAxis allowDecimals={false} />{" "}
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${value} відповідей`,
                            name,
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Кількість виборів" unit="">
                          {stat.optionCounts.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ fontStyle: "italic", mt: 2 }}>
                  Немає даних для побудови діаграми (можливо, ще ніхто не обрав
                  варіанти).
                </Typography>
              )}
            </>
          )}
        </Paper>
      ))}
    </div>
  );
};

export default QuestionnaireStatistics;
