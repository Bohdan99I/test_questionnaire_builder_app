import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  Box,
} from "@mui/material";
import { Edit, Play, Trash2 } from "lucide-react";

const QuestionnaireCatalog = () => {
  return (
    <div>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Questionnaire Catalog
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Sample card - will be replaced with actual data */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Sample Questionnaire
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                A sample description of the questionnaire
              </Typography>
              <Typography variant="body2">Questions: 5</Typography>
              <Typography variant="body2">Completions: 12</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" startIcon={<Edit size={16} />}>
                Edit
              </Button>
              <Button
                size="small"
                color="primary"
                startIcon={<Play size={16} />}
              >
                Run
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<Trash2 size={16} />}
              >
                Delete
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default QuestionnaireCatalog;
