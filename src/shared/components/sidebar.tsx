import { useState } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Divider,
  Avatar,
  Drawer,
  IconButton,
  Stack,
  Chip,
  
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Local navigation stub — replace with your router
const redirect = (href: string) => { window.location.href = href; };



// ─── Types ─────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

// ─── Nav config ─────────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", icon: <DashboardRoundedIcon fontSize="small" />, href: "/dashboard" },
      { label: "Transactions", icon: <HistoryRoundedIcon fontSize="small" />, href: "/transactions" },
    ],
  },
  {
    heading: "Services",
    items: [
      { label: "Buy Airtime", icon: <PhoneAndroidRoundedIcon fontSize="small" />, href: "/airtime-purchase" },
      { label: "Buy Data", icon: <WifiRoundedIcon fontSize="small" />, href: "/purchase-data", badge: "Popular" },
      { label: "Utility Bills", icon: <ReceiptLongRoundedIcon fontSize="small" />, href: "/utility-bills" },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Settings", icon: <SettingsRoundedIcon fontSize="small" />, href: "/settings" },
    ],
  },
];

// ─── Wallet widget ───────────────────────────────────────────────────────────

function WalletWidget() {
  return (
    <Box
      sx={{
        mx: 1.5,
        mb: 2,
        borderRadius: 2.5,
        background: "#111827",
        p: 2,
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box sx={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, borderRadius: "50%", border: "20px solid rgba(255,255,255,0.07)", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", bottom: -30, right: 10, width: 60, height: 60, borderRadius: "50%", border: "15px solid rgba(255,255,255,0.05)", pointerEvents: "none" }} />

      <Stack direction="row" sx={{ alignItems:'center', mb:1 }} spacing={0.8}>
        <AccountBalanceWalletRoundedIcon sx={{ fontSize: 13, opacity: 0.75 }} />
        <Typography variant="caption" sx={{ opacity: 0.75, fontWeight: 500, fontSize: 11 }}>
          Wallet Balance
        </Typography>
      </Stack>

      <Typography variant="h6" fontWeight={800} letterSpacing="-0.5px" mb={0.5}>
        ₦45,250.00
      </Typography>

      <Stack direction="row" sx={{ alignItems:'center', mb:1.8 }} spacing={0.5}>
        <TrendingUpRoundedIcon sx={{ fontSize: 12, color: "#4ade80" }} />
        <Typography variant="caption" sx={{ color: "#4ade80", fontWeight: 600, fontSize: 11 }}>
          +₦2,100 this week
        </Typography>
      </Stack>

      <Button
        fullWidth
        size="small"
        startIcon={<AddRoundedIcon sx={{ fontSize: "14px !important" }} />}
        onClick={() => redirect("/fund-wallet")}  // replace redirect with your router push
        sx={{
          bgcolor: "rgba(255,255,255,0.15)",
          color: "white",
          fontWeight: 700,
          fontSize: 12,
          py: 0.6,
          borderRadius: 1.5,
          "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
        }}
      >
        Fund Wallet
      </Button>
    </Box>
  );
}

// ─── User profile footer ─────────────────────────────────────────────────────

function UserProfile() {
  return (
    <Box sx={{ px: 1.5, pb: 2 }}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems:"center",
          bgcolor: "grey.50",
          borderRadius: 2,
          p: 1.2,
        }}
      >
        <Avatar src="https://i.pravatar.cc/40?img=11" sx={{ width: 34, height: 34 }} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            John Doe
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
            Premium Account
          </Typography>
        </Box>
        <Chip
          label="PRO"
          size="small"
          sx={{
            height: 18,
            fontSize: 9,
            fontWeight: 800,
            bgcolor: "#111827",
            color: "white",
            letterSpacing: 0.5,
            flexShrink: 0,
          }}
        />
      </Stack>
    </Box>
  );
}

// ─── Shared nav body ────────────────────────────────────────────────────────

interface NavContentProps {
  currentHref: string;
  onNavigate?: (href: string) => void;
}

function NavContent({ currentHref, onNavigate }: NavContentProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, pt: 3, pb: 2.5 }}>
        <Typography variant="h6" sx={{ color: "#111827", fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1 }}>
          SwiftVTU
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Premium VTU Services
        </Typography>
      </Box>

      {/* Wallet */}
      <WalletWidget />

      {/* Nav groups */}
      <Box sx={{ flexGrow: 1, px: 0.5, overflowY: "auto" }}>
        {NAV_GROUPS.map((group, gi) => (
          <Box key={group.heading} mb={gi < NAV_GROUPS.length - 1 ? 0.5 : 0}>
            <Typography
              variant="caption"
              sx={{
                px: 2,
                mb: 0.75,
                display: "block",
                color: "text.disabled",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {group.heading}
            </Typography>
            <List disablePadding>
              {group.items.map(({ label, icon, href, badge }) => {
                const active = currentHref === href;
                return (
                  <ListItemButton
                    key={href}
                    selected={active}
                    onClick={() => { if (onNavigate) { onNavigate(href); } else { redirect(href); } }}
                    sx={{
                      borderRadius: 2,
                      mx: 1,
                      mb: 0.25,
                      py: 0.9,
                      "&.Mui-selected": {
                        bgcolor: "#111827",
                        color: "white",
                        "& .MuiListItemIcon-root": { color: "white" },
                        "&:hover": { bgcolor: "#111827" },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 34, color: active ? "white" : "text.secondary" }}>
                      {icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={label}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 500 }}
                    />
                    {badge && !active && (
                      <Chip
                        label={badge}
                        size="small"
                        sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: "rgb(17 24 39 / 0.1)", color: "#111827" }}
                      />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
            {gi < NAV_GROUPS.length - 1 && <Box mb={1.5} />}
          </Box>
        ))}
      </Box>

      <Divider sx={{ mx: 1.5, my: 1.5 }} />

      {/* User + logout */}
      <UserProfile />
      <Box sx={{ px: 1.5, mb: 2 }}>
        <ListItemButton
          onClick={() => redirect("/logout")}
          sx={{ borderRadius: 2, py: 0.9 }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: "error.main" }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Log out"
            primaryTypographyProps={{ sx: { fontSize: 14, fontWeight: 500, color: "error.main" } }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface SidebarProps {
  currentHref?: string;
  onNavigate?: (href: string) => void;
}

export default function Sidebar({ currentHref = "/dashboard", onNavigate }: SidebarProps) {
  const theme = useTheme<any>();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        {/* Mobile topbar */}
        <Box
          sx={{
            position: "fixed",
            top: 0, left: 0, right: 0,
            zIndex: theme.zIndex.appBar,
            height: 56,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "grey.100",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: "#111827" }} fontWeight={800} letterSpacing="-0.5px">
            SwiftVTU
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Avatar src="https://i.pravatar.cc/40?img=11" sx={{ width: 28, height: 28 }} />
            <IconButton size="small" onClick={() => setDrawerOpen(true)} sx={{ bgcolor: "grey.100", borderRadius: 1.5 }}>
              <MenuRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* Slide-in drawer */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: 280 } }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1.5, pr: 1.5 }}>
            <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ bgcolor: "grey.100", borderRadius: 1.5 }}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <NavContent currentHref={currentHref} onNavigate={(h) => { onNavigate?.(h); setDrawerOpen(false); }} />
          </Box>
        </Drawer>

        {/* Push page content below fixed bar */}
        <Box sx={{ height: 56 }} />
      </>
    );
  }

  // Desktop sticky sidebar
  return (
    <Box
      component="nav"
      sx={{
        width: 240,
        flexShrink: 0,
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "grey.100",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavContent currentHref={currentHref} onNavigate={onNavigate} />
    </Box>
  );
}
