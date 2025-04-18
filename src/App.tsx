import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import Layout from "./components/Layout";
import QuestionnaireCatalog from "./pages/QuestionnaireCatalog";
import QuestionnaireBuilder from "./pages/QuestionnaireBuilder";
import QuestionnaireRun from "./pages/QuestionnaireRun";
import QuestionnaireStatistics from "./pages/QuestionnaireStatistics";
import Auth from "./pages/Auth";
import { StoreProvider } from "./lib/store";
import { AuthProvider, useAuth } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" />;
  }
  return <>{children}</>;
};

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
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
          <Route
            path="/run/:id"
            element={
              <ProtectedRoute>
                <QuestionnaireRun />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics/:id"
            element={
              <ProtectedRoute>
                <QuestionnaireStatistics />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <AppContent />{" "}
        </AuthProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}

export default App;
