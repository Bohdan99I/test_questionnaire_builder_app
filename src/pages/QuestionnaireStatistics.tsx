import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../lib/store';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const QuestionnaireStatistics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useStore();

  const questionnaire = state.questionnaires.find(q => q.id === id);
  const questions = state.questions
    .filter(q => q.questionnaire_id === id)
    .sort((a, b) => a.order - b.order);
  const responses = state.responses.filter(r => r.questionnaire_id === id);

  const averageTimeSeconds = useMemo(() => {
    if (responses.length === 0) return 0;
    const totalTime = responses.reduce((sum, r) => sum + (r.time_taken_seconds || 0), 0);
    return Math.round(totalTime / responses.length);
  }, [responses]);

  const questionStatistics = useMemo(() => {
    return questions.map(question => {
      const answers = state.answers.filter(a => a.question_id === question.id);
      
      if (question.question_type === 'text') {
        return {
          question: question.question_text,
          type: question.question_type,
          totalAnswers: answers.length,
          answers: answers.map(a => a.answer_text).filter(Boolean),
        };
      }

      const options = state.questionOptions
        .filter(o => o.question_id === question.id)
        .sort((a, b) => a.order - b.order);

      const optionCounts = options.map(option => {
        const count = answers.filter(a => 
          a.selected_options?.includes(option.id)
        ).length;

        return {
          name: option.option_text,
          value: count,
        };
      });

      return {
        question: question.question_text,
        type: question.question_type,
        totalAnswers: answers.length,
        optionCounts,
      };
    });
  }, [questions, state.answers, state.questionOptions]);

  if (!questionnaire) {
    return <Typography>Опитувальник не знайдено</Typography>;
  }

  return (
    <div>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate('/')}
        >
          Назад до каталогу
        </Button>
        <Typography variant="h4" component="h1">
          Статистика опитувальника
        </Typography>
      </Box>

      <Typography variant="h5" gutterBottom>
        {questionnaire.title}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Загальна статистика
              </Typography>
              <Typography variant="body1">
                Всього відповідей: {responses.length}
              </Typography>
              <Typography variant="body1">
                Середній час проходження: {Math.floor(averageTimeSeconds / 60)} хв {averageTimeSeconds % 60} сек
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {questionStatistics.map((stat, index) => (
        <Paper key={index} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {stat.question}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Всього відповідей: {stat.totalAnswers}
          </Typography>

          {stat.type === 'text' ? (
            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {stat.answers.map((answer, i) => (
                <Typography key={i} variant="body2" sx={{ mb: 1 }}>
                  • {answer}
                </Typography>
              ))}
            </Box>
          ) : (
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                {stat.type === 'single_choice' ? (
                  <PieChart>
                    <Pie
                      data={stat.optionCounts}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {stat.optionCounts.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <BarChart data={stat.optionCounts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Box>
          )}
        </Paper>
      ))}
    </div>
  );
};

export default QuestionnaireStatistics;