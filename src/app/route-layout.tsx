import { AuthProvider } from "@/shared/providers/auth";
import { theme } from "@/shared/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Outlet } from "react-router";

const RootLayout = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </div>
    </ThemeProvider>
  );
};

export default RootLayout;
