import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";
import { Box } from "@mui/material";
import Topbar from "./topbar";

const UserLayout = () => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F7F8FA" }}>
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ position: "sticky", top: 0, zIndex: 100, bgcolor: "#F7F8FA", borderBottom: "1px solid #EEF2F6", px: { xs: 2, md: 4 }, pt: 2.5, pb: 0 }}>
          <Topbar />
        </Box>
        <Box sx={{ px: { xs: 2, md: 4 }, py: 3, flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default UserLayout;
