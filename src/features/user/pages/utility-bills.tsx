import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import FlashOnRoundedIcon from "@mui/icons-material/FlashOnRounded";
import TvRoundedIcon from "@mui/icons-material/TvRounded";
import { useState } from "react";

const BILL_TABS = ["Electricity", "Cable TV"] as const;
type BillType = (typeof BILL_TABS)[number];

const ELECTRICITY_PROVIDERS = ["IKEDC", "EKEDC", "PHEDC", "AEDC", "EEDC"];
const CABLE_PROVIDERS = ["DStv", "GOtv", "StarTimes"];

const CABLE_PLANS: Record<string, { name: string; price: string }[]> = {
  DStv: [
    { name: "Padi", price: "₦2,500" }, { name: "Yanga", price: "₦3,500" },
    { name: "Confam", price: "₦6,200" }, { name: "Compact", price: "₦12,500" },
    { name: "Compact+", price: "₦19,800" }, { name: "Premium", price: "₦24,500" },
  ],
  GOtv: [
    { name: "Lite", price: "₦900" }, { name: "Max", price: "₦4,150" },
    { name: "Jolli", price: "₦2,460" }, { name: "Supa", price: "₦6,400" },
  ],
  StarTimes: [
    { name: "Nova", price: "₦900" }, { name: "Basic", price: "₦1,700" },
    { name: "Classic", price: "₦2,500" }, { name: "Super", price: "₦3,000" },
  ],
};

const RECENT = [
  { type: "Electricity", detail: "IKEDC — Token", amount: "₦5,000", status: "Success", date: "May 24, 2024" },
  { type: "Cable TV", detail: "DStv Compact", amount: "₦12,500", status: "Success", date: "May 22, 2024" },
  { type: "Electricity", detail: "EKEDC — Token", amount: "₦10,000", status: "Pending", date: "May 20, 2024" },
];

const STATUS: Record<string, { bg: string; color: string }> = {
  Success: { bg: "#ecfdf5", color: "#059669" },
  Pending: { bg: "#fffbeb", color: "#d97706" },
  Failed: { bg: "#fef2f2", color: "#dc2626" },
};

export default function UtilityBillsPage() {
  const [tab, setTab] = useState<BillType>("Electricity");
  const [cableProvider, setCableProvider] = useState("DStv");
  const [selectedPlan, setSelectedPlan] = useState("");

  return (
    <Stack spacing={3}>
      {/* Page header */}
      <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { md: "center" }, gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 20, color: "#0f172a" }}>Utility Bills</Typography>
          <Typography variant="body2" color="text.secondary">Pay electricity bills and cable TV subscriptions instantly.</Typography>
        </Box>
        <Card sx={{ px: 2.5, py: 1.5, minWidth: { xs: "100%", md: 260 }, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: "#fffbeb", color: "#d97706", display: "grid", placeItems: "center" }}>
                <AccountBalanceWalletRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Wallet balance</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 15 }}>₦45,250.00</Typography>
              </Box>
            </Stack>
            <IconButton size="small" sx={{ bgcolor: "#fffbeb", color: "#d97706", borderRadius: 1.5 }}>
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Card>
      </Stack>

      <Grid container spacing={2.5}>
        {/* Left */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            <Card sx={{ borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none", overflow: "hidden" }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                  px: 3, pt: 1, borderBottom: "1px solid #f1f5f9",
                  "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: 14, minHeight: 44 },
                }}
              >
                <Tab label="Electricity" value="Electricity" icon={<FlashOnRoundedIcon sx={{ fontSize: 17 }} />} iconPosition="start" />
                <Tab label="Cable TV" value="Cable TV" icon={<TvRoundedIcon sx={{ fontSize: 17 }} />} iconPosition="start" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {tab === "Electricity" && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField select fullWidth label="Distribution company">
                        {ELECTRICITY_PROVIDERS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField select fullWidth label="Meter type" defaultValue="prepaid">
                        <MenuItem value="prepaid">Prepaid</MenuItem>
                        <MenuItem value="postpaid">Postpaid</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Meter number" placeholder="Enter meter number" />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Amount" placeholder="Minimum ₦1,000" />
                    </Grid>
                  </Grid>
                )}

                {tab === "Cable TV" && (
                  <Stack spacing={2.5}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField select fullWidth label="Provider" value={cableProvider} onChange={(e) => { setCableProvider(e.target.value); setSelectedPlan(""); }}>
                          {CABLE_PROVIDERS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Smart card / IUC number" placeholder="Enter your card number" />
                      </Grid>
                    </Grid>

                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Select subscription plan</Typography>
                    <Grid container spacing={1.5}>
                      {CABLE_PLANS[cableProvider].map((plan) => (
                        <Grid size={{ xs: 6, sm: 4 }} key={plan.name}>
                          <Box
                            onClick={() => setSelectedPlan(plan.name)}
                            sx={{
                              border: `1px solid ${selectedPlan === plan.name ? "#2563eb" : "#e9eef6"}`,
                              bgcolor: selectedPlan === plan.name ? "#eff6ff" : "white",
                              borderRadius: 2.5, p: 2, cursor: "pointer",
                              "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" },
                              transition: "all 0.15s",
                            }}
                          >
                            <Box sx={{ bgcolor: "#eff6ff", color: "#2563eb", borderRadius: 1.5, p: 0.75, display: "inline-grid", placeItems: "center", mb: 1 }}>
                              <TvRoundedIcon sx={{ fontSize: 16 }} />
                            </Box>
                            <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{plan.name}</Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#2563eb", mt: 0.25 }}>{plan.price}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Stack>
                )}
              </Box>
            </Card>

            {/* Recent */}
            <Card sx={{ p: 3, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Recent Bills</Typography>
                  <Typography variant="body2" color="text.secondary">Your last payments</Typography>
                </Box>
                <Button size="small" sx={{ textTransform: "none", fontWeight: 700 }}>View all</Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { fontSize: 11, fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.6, borderBottom: "1px solid #f1f5f9" } }}>
                      <TableCell>Type</TableCell>
                      <TableCell>Detail</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {RECENT.map((row, i) => {
                      const st = STATUS[row.status];
                      return (
                        <TableRow key={i} sx={{ "& td": { py: 1.6, borderColor: "#f8fafc" } }}>
                          <TableCell><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.type}</Typography></TableCell>
                          <TableCell><Typography sx={{ fontSize: 12, color: "text.secondary" }}>{row.detail}</Typography></TableCell>
                          <TableCell><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{row.amount}</Typography></TableCell>
                          <TableCell><Chip label={row.status} size="small" sx={{ height: 22, fontSize: 11, bgcolor: st.bg, color: st.color, fontWeight: 700 }} /></TableCell>
                          <TableCell align="right"><Typography sx={{ fontSize: 12, color: "text.secondary" }}>{row.date}</Typography></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Stack>
        </Grid>

        {/* Right: order summary */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none", overflow: "hidden" }}>
            <Box sx={{ bgcolor: "#0a0f1e", px: 3, pt: 3, pb: 2.5, color: "white", position: "relative", overflow: "hidden" }}>
              <Box sx={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: 0.8, textTransform: "uppercase", mb: 0.5 }}>Order Summary</Typography>
              <Typography sx={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>₦0.00</Typography>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)", mt: 0.5 }}>Total amount to pay</Typography>
            </Box>
            <Box sx={{ px: 3, py: 2.5 }}>
              {[["Bill type", tab], ["Provider", tab === "Cable TV" ? cableProvider : "—"], ["Plan / Type", selectedPlan || "—"], ["Service charge", "₦0.00"]].map(([label, value]) => (
                <Stack key={label} direction="row" sx={{ justifyContent: "space-between", mb: 1.5 }}>
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{label}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{value}</Typography>
                </Stack>
              ))}
              <Box sx={{ height: 1, bgcolor: "#f1f5f9", my: 2 }} />
              <Button fullWidth variant="contained" startIcon={<BoltRoundedIcon />} disableElevation sx={{ py: 1.4, fontWeight: 700, textTransform: "none", borderRadius: 2, mb: 1.5 }}>
                Pay now
              </Button>
              <Stack direction="row" spacing={0.75} sx={{ justifyContent: "center", alignItems: "center", color: "text.disabled" }}>
                <CreditCardRoundedIcon sx={{ fontSize: 14 }} />
                <Typography sx={{ fontSize: 11 }}>Encrypted &amp; secure payment</Typography>
              </Stack>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
