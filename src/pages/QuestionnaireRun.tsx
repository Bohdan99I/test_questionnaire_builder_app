import React from "react";
import { Typography, Paper, Box, Button } from "@mui/material";

const QuestionnaireRun = () => {
  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Complete Questionnaire
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sample Question
        </Typography>
        {/* Question content will be dynamically rendered here */}
      </Paper>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
        <Button variant="outlined">Previous</Button>
        <Button variant="contained">Next</Button>
      </Box>
    </div>
  );
};

export default QuestionnaireRun;
