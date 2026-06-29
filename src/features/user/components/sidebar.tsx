import {
  Box,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardRoundedIcon fontSize="small" /> },
  { label: "Buy Airtime", path: "/airtime", icon: <PhoneAndroidRoundedIcon fontSize="small" /> },
  { label: "Buy Data", path: "/data", icon: <WifiRoundedIcon fontSize="small" /> },
  { label: "Utility Bills", path: "/bills", icon: <ReceiptLongRoundedIcon fontSize="small" /> },
  { label: "Transactions", path: "/transactions", icon: <LayersRoundedIcon fontSize="small" /> },
  { label: "Settings", path: "/settings", icon: <SettingsRoundedIcon fontSize="small" /> },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        bgcolor: "#0D1117",
        color: "white",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#5558E3", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <BoltRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.1, color: "white" }}>SwiftVTU</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Premium services</Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 2 }} />

      {/* Nav label */}
      <Typography variant="caption" sx={{ px: 3, pt: 2.5, pb: 1, color: "rgba(255,255,255,0.32)", fontWeight: 700, letterSpacing: 1, fontSize: 10, textTransform: "uppercase" }}>
        Main menu
      </Typography>

      {/* Nav items */}
      <List disablePadding sx={{ flexGrow: 1, px: 1.5 }}>
        {NAV_ITEMS.map(({ label, icon, path }) => {
          const active = location.pathname === path;
          return (
            <Tooltip key={label} title="" placement="right">
              <ListItemButton
                  selected={active}
                onClick={() => navigate(path)}
                sx={{
                  borderRadius: 1,
                  mb: 0.25,
                  py: 0.875,
                  pl: active ? "calc(12px - 2px)" : "12px",
                  pr: 1.5,
                  color: active ? "white" : "rgba(255,255,255,0.45)",
                  borderLeft: active ? "2px solid #5558E3" : "2px solid transparent",
                  transition: "all 0.12s",
                  "&.Mui-selected": {
                    bgcolor: "rgba(85,88,227,0.08)",
                    color: "white",
                    "& .MuiListItemIcon-root": { color: "#8B8FF8" },
                    "&:hover": { bgcolor: "rgba(85,88,227,0.12)" },
                  },
                  "&:hover:not(.Mui-selected)": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.8)" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>{icon}</ListItemIcon>
                <Typography sx={{ fontSize: 13.5, fontWeight: active ? 700 : 500 }}>{label}</Typography>
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 2 }} />

      {/* User account strip */}
      <Box sx={{ px: 2, py: 2 }}>
        <Box sx={{ bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2, p: 1.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: "rgba(85,88,227,0.2)", display: "grid", placeItems: "center" }}>
                <AccountCircleRoundedIcon fontSize="small" sx={{ color: "#A5B4FC" }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "white", lineHeight: 1.2 }}>John Doe</Typography>
              <Chip label="Admin" size="small" sx={{ height: 16, fontSize: 10, bgcolor: "rgba(85,88,227,0.2)", color: "#A5B4FC", fontWeight: 700, mt: 0.25 }} />
            </Box>
          </Stack>
          <ListItemButton onClick={() => {}} sx={{ borderRadius: 1.5, py: 0.6, px: 1, color: "#fca5a5", "&:hover": { bgcolor: "rgba(252,165,165,0.08)" } }}>
            <ListItemIcon sx={{ minWidth: 28, color: "inherit" }}><LogoutRoundedIcon sx={{ fontSize: 16 }} /></ListItemIcon>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Logout</Typography>
          </ListItemButton>
        </Box>
      </Box>
    </Box>
  );
}
