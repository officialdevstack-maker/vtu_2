import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { useState } from "react";

export default function Topbar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 3.5,
        flexWrap: "wrap",
      }}
    >
      {/* Left: greeting */}
      <Box>
        <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
          {greeting}, John 👋
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Here's what's happening with your account today.
        </Typography>
      </Box>

      {/* Right: actions */}
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search…"
          sx={{
            display: { xs: "none", lg: "flex" },
            width: 220,
            "& .MuiOutlinedInput-root": {
              bgcolor: "white",
              borderRadius: 2,
              fontSize: 13,
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          disableElevation
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 2, whiteSpace: "nowrap" }}
        >
          Fund Wallet
        </Button>

        <IconButton
          sx={{ bgcolor: "white", border: "1px solid #e5e7eb", borderRadius: 2, width: 38, height: 38 }}
        >
          <Badge variant="dot" color="error">
            <NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} />
          </Badge>
        </IconButton>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", cursor: "pointer", py: 0.5, px: 1, borderRadius: 2, "&:hover": { bgcolor: "#f1f5f9" } }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: "#1e3a8a", fontSize: 13, fontWeight: 800 }}>JD</Avatar>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>John Doe</Typography>
            <Chip label="Admin" size="small" sx={{ height: 16, fontSize: 10, bgcolor: "#eff6ff", color: "#2563eb", fontWeight: 700 }} />
          </Box>
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        </Stack>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} sx={{ mt: 1 }}>
          <MenuItem dense>Profile</MenuItem>
          <MenuItem dense>Settings</MenuItem>
          <Divider />
          <MenuItem dense sx={{ color: "error.main" }}>Logout</MenuItem>
        </Menu>
      </Stack>
    </Box>
  );
}
