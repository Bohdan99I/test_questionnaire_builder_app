import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import { ClipboardList } from "lucide-react";
import { useAuth } from "../lib/auth";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
    handleClose();
  };

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

          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/">
                Каталог
              </Button>
              <Button color="inherit" component={RouterLink} to="/create">
                Створити новий
              </Button>
              <Avatar
                onClick={handleMenu}
                sx={{
                  ml: 2,
                  cursor: "pointer",
                  bgcolor: "secondary.main",
                }}
              >
                {user.email?.[0].toUpperCase()}
              </Avatar>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleSignOut}>Вийти</MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" component={RouterLink} to="/auth">
              Увійти
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ py: 4 }}>{children}</Box>
      </Container>
    </>
  );
};

export default Layout;
