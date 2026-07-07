import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "../components/sidebar";
import Topbar from "../components/topbar";

const UserLayout = () => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 3,
          bgcolor: "background.default",
          minHeight: "100vh",
        }}
        className="w-[100vw]"
      >
        <Topbar onToggleSidebar={() => undefined} />
        <Outlet />
      </Box>
    </Box>
  );
};

export default UserLayout;
