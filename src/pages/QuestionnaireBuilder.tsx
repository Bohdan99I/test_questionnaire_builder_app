import React from "react";
import { Box, Typography, TextField, Button, Paper } from "@mui/material";

const QuestionnaireBuilder = () => {
  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Questionnaire
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Questionnaire Name"
            name="name"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            multiline
            rows={4}
            name="description"
            label="Description"
            id="description"
          />
        </Box>
      </Paper>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" color="primary" size="large">
          Save Questionnaire
        </Button>
      </Box>
    </div>
  );
};

export default QuestionnaireBuilder;
