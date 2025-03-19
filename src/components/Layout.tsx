import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
} from "@mui/material";
import { ClipboardList } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <ClipboardList size={24} style={{ marginRight: "12px" }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            style={{ textDecoration: "none", color: "inherit", flexGrow: 1 }}
          >
            Questionnaire Builder
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">
            Catalog
          </Button>
          <Button color="inherit" component={RouterLink} to="/create">
            Create New
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ py: 4 }}>{children}</Box>
      </Container>
    </>
  );
};

export default Layout;
