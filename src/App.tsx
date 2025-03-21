import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import Layout from "./components/Layout";
import QuestionnaireCatalog from "./pages/QuestionnaireCatalog";
import QuestionnaireBuilder from "./pages/QuestionnaireBuilder";
import QuestionnaireRun from "./pages/QuestionnaireRun";
import { StoreProvider } from "./lib/store";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<QuestionnaireCatalog />} />
              <Route path="/create" element={<QuestionnaireBuilder />} />
              <Route path="/edit/:id" element={<QuestionnaireBuilder />} />
              <Route path="/run/:id" element={<QuestionnaireRun />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </StoreProvider>
    </ThemeProvider>
  );
}

export default App;


