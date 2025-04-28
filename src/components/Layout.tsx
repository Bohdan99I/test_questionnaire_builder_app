import React, { useState, useCallback, useMemo } from "react";
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
  IconButton,
  Tooltip,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  ClipboardList,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSignOut = useCallback(async () => {
    handleClose();
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [signOut, navigate, handleClose]);

  // отримання першої літери email для Аватара
  const avatarLetter = useMemo(() => {
    return user?.email?.trim() ? (
      user.email.trim()[0].toUpperCase()
    ) : (
      <UserIcon size={20} />
    );
  }, [user]);

  return (
    <>
      <AppBar position="static" elevation={1}>
        {" "}
        <Toolbar>

          {/* Логотип та Назва */}
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <ClipboardList size={24} style={{ marginRight: "12px" }} />
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: "none",
                color: "inherit",
                flexGrow: 1,
                "&:hover": {
                  opacity: 0.9,
                },
              }}
            >
              Questionnaire Builder
            </Typography>
          </Box>

          {/* Перемикач теми */}
          <Tooltip title={isDarkMode ? "Світла тема" : "Темна тема"}>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
              {" "}
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
          </Tooltip>

          {/* Секція користувача */}
          {user ? (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/"
                sx={{ display: { xs: "none", sm: "inline-flex" } }}
              >
                Каталог
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/create"
                sx={{ display: { xs: "none", sm: "inline-flex" } }}
              >
                Створити
              </Button>

              {/* Аватар та Меню Користувача */}
              <Tooltip title="Меню користувача">
                <IconButton
                  onClick={handleMenu}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-controls={open ? "account-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      cursor: "pointer",
                      bgcolor: "secondary.main",
                      fontSize: "0.875rem",
                    }}
                  >
                    {avatarLetter}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: "visible",
                    filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                    mt: 1.5,
                    "& .MuiAvatar-root": {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    "&::before": {
                      content: '""',
                      display: "block",
                      position: "absolute",
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: "background.paper",
                      transform: "translateY(-50%) rotate(45deg)",
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem disabled sx={{ opacity: 0.7 }}>
                  <ListItemText primary={user.email} />
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  <ListItemIcon>
                    <LogOut size={18} />
                  </ListItemIcon>
                  <ListItemText>Вийти</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" component={RouterLink} to="/auth">
              Увійти
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Основний контент сторінки */}
      <Container maxWidth="lg" sx={{ pt: 3, pb: 4 }}>
        {" "}
        {children}
      </Container>
    </>
  );
};

export default Layout;