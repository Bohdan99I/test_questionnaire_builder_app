import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import Layout from "./components/Layout";
import QuestionnaireCatalog from "./pages/QuestionnaireCatalog";
import QuestionnaireBuilder from "./pages/QuestionnaireBuilder";
import QuestionnaireRun from "./pages/QuestionnaireRun";
import Auth from "./pages/Auth";
import { StoreProvider } from "./lib/store";
import { AuthProvider, useAuth } from "./lib/auth";

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <AuthProvider>
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
        </AuthProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}

export default App;
