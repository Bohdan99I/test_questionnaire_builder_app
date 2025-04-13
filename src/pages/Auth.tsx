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
  CircularProgress,
  Link,
} from "@mui/material";
import { useAuth } from "../lib/auth";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // --- Покращені функції валідації ---
  const validateEmail = (emailInput: string): string | null => {
    if (!emailInput.trim()) {
      return "Email не може бути порожнім";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      return "Введіть коректну email адресу";
    }
    return null;
  };

  const validatePassword = (passwordInput: string): string | null => {
    if (!passwordInput) {
      return "Пароль не може бути порожнім";
    }
    if (passwordInput.length < 6) {
      return "Пароль повинен містити мінімум 6 символів";
    }
    return null;
  };

  // --- Обробка зміни полів з валідацією помилок ---
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEmail(newValue);
    // Скидаємо помилку поля при зміні, якщо вона була
    if (emailError) {
      setEmailError(validateEmail(newValue));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPassword(newValue);
    // Скидаємо помилку поля при зміні, якщо вона була
    if (passwordError) {
      setPasswordError(validatePassword(newValue));
    }
  };

  // --- Скидання помилок при зміні режиму ---
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    setIsLoading(false);
  };

  // --- Функція обробник відправки ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setIsLoading(true);

    // --- Валідація перед відправкою ---
    const currentEmailError = validateEmail(email);
    const currentPasswordError = validatePassword(password);

    setEmailError(currentEmailError);
    setPasswordError(currentPasswordError);

    if (currentEmailError || currentPasswordError) {
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password);
        console.log("Реєстрація успішна (або очікує підтвердження)");
      } else {
        await signIn(email, password);
        console.log("Вхід успішний");
      }
      navigate("/");
    } catch (err) {
      console.error("Помилка автентифікації:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Сталася невідома помилка автентифікації.";
      setGeneralError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Card sx={{ width: "100%" }}>
          {" "}
          {/* Займає всю ширину контейнера sm */}
          <CardContent>
            <Typography variant="h5" component="h1" gutterBottom align="center">
              {isSignUp ? "Реєстрація" : "Вхід"}
            </Typography>

            {/* Загальна помилка */}
            {generalError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {generalError}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                error={!!emailError}
                helperText={emailError || ""}
                disabled={isLoading}
                aria-describedby={emailError ? "email-error-text" : undefined}
              />
              {
                emailError && (
                  <span id="email-error-text" style={{ display: "none" }}>
                    {emailError}
                  </span>
                ) /* Для screen readers */
              }

              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                label="Пароль"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={handlePasswordChange}
                error={!!passwordError}
                helperText={passwordError || ""}
                disabled={isLoading}
                aria-describedby={
                  passwordError ? "password-error-text" : undefined
                }
              />
              {passwordError && (
                <span id="password-error-text" style={{ display: "none" }}>
                  {passwordError}
                </span>
              )}

              <Box sx={{ position: "relative", mt: 3, mb: 2 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                >
                  {isSignUp ? "Зареєструватися" : "Увійти"}
                </Button>
                {/* Індикатор завантаження поверх кнопки */}
                {isLoading && (
                  <CircularProgress
                    size={24}
                    sx={{
                      color: "primary.main",
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      marginTop: "-12px",
                      marginLeft: "-12px",
                    }}
                  />
                )}
              </Box>
              <Box textAlign="center">
                {" "}
                {/* Центрування тексту/посилання */}
                <Link
                  component="button"
                  variant="body2"
                  onClick={toggleMode}
                  disabled={isLoading}
                  sx={{ mt: 1 }}
                >
                  {isSignUp
                    ? "Вже маєте акаунт? Увійти"
                    : "Немає акаунту? Зареєструватися"}
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Auth;
