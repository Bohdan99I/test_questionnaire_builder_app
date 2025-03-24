import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import getTheme from "./theme";
import Layout from "./components/Layout";
import QuestionnaireCatalog from "./pages/QuestionnaireCatalog";
import QuestionnaireBuilder from "./pages/QuestionnaireBuilder";
import QuestionnaireRun from "./pages/QuestionnaireRun";
import Auth from "./pages/Auth";
import { StoreProvider } from "./lib/store";
import { AuthProvider, useAuth } from "./lib/auth";
import { ThemeProvider, useTheme } from "./lib/theme";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <QuestionnaireCatalog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <QuestionnaireBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <QuestionnaireBuilder />
                </ProtectedRoute>
              }
            />
            <Route path="/run/:id" element={<QuestionnaireRun />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}

export default App;
