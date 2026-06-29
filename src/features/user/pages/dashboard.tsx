import { Box, Card, Grid, Stack, Typography } from "@mui/material";
import WalletCard from "../components/wallet-card";
import AutoFundCard from "../components/auto-fund-card";
import TransactionChart from "../components/tx-chart";
import QuickServices from "../components/quick-services";
import PromoCards from "../components/promo-card";
import RecentTransactions from "../components/recent-transaction";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

const STATS = [
  { label: "Successful Orders",  value: "1,284", change: "+8.2%",  up: true,  icon: <CheckCircleRoundedIcon sx={{ fontSize: 16 }} /> },
  { label: "Monthly Volume",     value: "₦482K",  change: "+14.1%", up: true,  icon: <TrendingUpRoundedIcon  sx={{ fontSize: 16 }} /> },
  { label: "Pending Issues",     value: "7",       change: "−3 today", up: false, icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} /> },
];

export default function DashboardPage() {
  return (
    <Stack spacing={3}>
      {/* Single metrics bar — looks intentional, not templated */}
      <Card sx={{ borderRadius: 1 }}>
        <Grid container>
          {STATS.map((stat, i) => (
            <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
              <Box
                sx={{
                  p: 3,
                  borderRight:  { sm: i < 2 ? "1px solid #EEF2F6" : "none" },
                  borderBottom: { xs: i < 2 ? "1px solid #EEF2F6" : "none", sm: "none" },
                }}
              >
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>
                    {stat.label}
                  </Typography>
                  <Box sx={{ color: "text.disabled" }}>{stat.icon}</Box>
                </Stack>
                <Typography sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: "#0F172A" }}>
                  {stat.value}
                </Typography>
                <Typography sx={{ fontSize: 12, mt: 0.75, fontWeight: 700, color: stat.up ? "#10B981" : "#F59E0B" }}>
                  {stat.change}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* Wallet + auto-fund */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}><WalletCard /></Grid>
        <Grid size={{ xs: 12, lg: 4 }}><AutoFundCard /></Grid>
      </Grid>

      {/* Chart + quick services */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}><TransactionChart /></Grid>
        <Grid size={{ xs: 12, lg: 4 }}><QuickServices /></Grid>
      </Grid>

      <PromoCards />
      <RecentTransactions />
    </Stack>
  );
}
