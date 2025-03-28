import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
} from "@mui/material";
import { useAuth } from "../lib/auth";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!validateEmail(email)) {
        throw new Error("Введіть коректну email адресу");
      }

      if (!validatePassword(password)) {
        throw new Error("Пароль повинен містити мінімум 6 символів");
      }

      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка автентифікації");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h1" gutterBottom align="center">
              {isSignUp ? "Реєстрація" : "Вхід"}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                error={!!error && !validateEmail(email)}
                helperText={
                  !!error && !validateEmail(email)
                    ? "Введіть коректну email адресу"
                    : ""
                }
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                error={!!error && !validatePassword(password)}
                helperText={
                  !!error && !validatePassword(password)
                    ? "Пароль повинен містити мінімум 6 символів"
                    : ""
                }
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                {isSignUp ? "Зареєструватися" : "Увійти"}
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
              >
                {isSignUp
                  ? "Вже маєте акаунт? Увійти"
                  : "Немає акаунту? Зареєструватися"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Auth;
