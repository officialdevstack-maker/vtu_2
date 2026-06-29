import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";

const NETWORKS = [
  { label: "MTN", color: "#facc15", text: "#111827" },
  { label: "Airtel", color: "#ef4444", text: "#fff" },
  { label: "Glo", color: "#22c55e", text: "#fff" },
  { label: "9mobile", color: "#064e3b", text: "#fff" },
];

const PLANS = [
  { size: "500MB", duration: "1 Day", price: "₦150", type: "SME" },
  { size: "1GB", duration: "1 Day", price: "₦250", type: "SME" },
  { size: "2GB", duration: "30 Days", price: "₦500", type: "SME" },
  { size: "3GB", duration: "30 Days", price: "₦750", type: "SME" },
  { size: "5GB", duration: "30 Days", price: "₦1,250", type: "Gifting" },
  { size: "10GB", duration: "30 Days", price: "₦2,200", type: "Gifting" },
];

const RECENT = [
  { provider: "MTN", number: "0806****123", plan: "2GB — 30 Days", amount: "₦500", status: "Success", date: "May 24, 2024" },
  { provider: "Airtel", number: "0901****882", plan: "5GB — 30 Days", amount: "₦1,250", status: "Success", date: "May 23, 2024" },
  { provider: "Glo", number: "0805****001", plan: "1GB — 1 Day", amount: "₦250", status: "Failed", date: "May 22, 2024" },
];

const STATUS: Record<string, { bg: string; color: string }> = {
  Success: { bg: "#ecfdf5", color: "#059669" },
  Pending: { bg: "#fffbeb", color: "#d97706" },
  Failed: { bg: "#fef2f2", color: "#dc2626" },
};

export default function BuyDataPage() {
  return (
    <Stack spacing={3}>
      {/* Page header */}
      <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { md: "center" }, gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 20, color: "#0f172a" }}>Buy Data</Typography>
          <Typography variant="body2" color="text.secondary">Purchase data bundles at the best rates.</Typography>
        </Box>
        <Card sx={{ px: 2.5, py: 1.5, minWidth: { xs: "100%", md: 260 }, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: "#ecfdf5", color: "#059669", display: "grid", placeItems: "center" }}>
                <AccountBalanceWalletRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Wallet balance</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 15 }}>₦45,250.00</Typography>
              </Box>
            </Stack>
            <IconButton size="small" sx={{ bgcolor: "#ecfdf5", color: "#059669", borderRadius: 1.5 }}>
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Card>
      </Stack>

      <Grid container spacing={2.5}>
        {/* Left: form */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            {/* Network + phone */}
            <Card sx={{ p: 3, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 1.5 }}>Select network provider</Typography>
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                {NETWORKS.map((net, i) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={net.label}>
                    <Button
                      fullWidth
                      variant={i === 0 ? "contained" : "outlined"}
                      sx={{
                        height: 80, borderRadius: 2.5, boxShadow: "none",
                        bgcolor: i === 0 ? "#f0fdf4" : "white",
                        borderColor: i === 0 ? "#059669" : "#e9eef6",
                        color: "#0f172a",
                        "&:hover": { bgcolor: "#f0fdf4", borderColor: "#059669", boxShadow: "none" },
                      }}
                    >
                      <Stack spacing={0.75} sx={{ alignItems: "center" }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: "50%", bgcolor: net.color, color: net.text, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 900 }}>
                          {net.label.charAt(0)}
                        </Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{net.label}</Typography>
                      </Stack>
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField select fullWidth label="Data type" defaultValue="sme">
                    <MenuItem value="sme">SME Data</MenuItem>
                    <MenuItem value="gifting">Gifting Data</MenuItem>
                    <MenuItem value="corporate">Corporate Gifting</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Phone number" placeholder="e.g. 08012345678" />
                </Grid>
              </Grid>
            </Card>

            {/* Data plans grid */}
            <Card sx={{ p: 3, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 2 }}>Choose a data plan</Typography>
              <Grid container spacing={1.5}>
                {PLANS.map((plan, i) => (
                  <Grid size={{ xs: 6, sm: 4 }} key={`${plan.size}-${plan.price}`}>
                    <Box
                      sx={{
                        border: `1px solid ${i === 2 ? "#059669" : "#e9eef6"}`,
                        bgcolor: i === 2 ? "#f0fdf4" : "white",
                        borderRadius: 2.5,
                        p: 2,
                        cursor: "pointer",
                        "&:hover": { borderColor: "#059669", bgcolor: "#f0fdf4" },
                        transition: "all 0.15s",
                      }}
                    >
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 0.75 }}>
                        <Box sx={{ bgcolor: "#ecfdf5", color: "#059669", borderRadius: 1.5, p: 0.75, display: "grid", placeItems: "center" }}>
                          <WifiRoundedIcon sx={{ fontSize: 16 }} />
                        </Box>
                        <Chip label={plan.type} size="small" sx={{ height: 18, fontSize: 10, bgcolor: "#f1f5f9", color: "#64748b", fontWeight: 700 }} />
                      </Stack>
                      <Typography sx={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{plan.size}</Typography>
                      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{plan.duration}</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#059669", mt: 0.5 }}>{plan.price}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>

            {/* Recent table */}
            <Card sx={{ p: 3, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Recent Data Purchases</Typography>
                  <Typography variant="body2" color="text.secondary">Your last purchases</Typography>
                </Box>
                <Button size="small" sx={{ textTransform: "none", fontWeight: 700 }}>View all</Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { fontSize: 11, fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.6, borderBottom: "1px solid #f1f5f9" } }}>
                      <TableCell>Provider</TableCell>
                      <TableCell>Number</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {RECENT.map((row) => {
                      const st = STATUS[row.status];
                      return (
                        <TableRow key={`${row.provider}-${row.number}`} sx={{ "& td": { py: 1.6, borderColor: "#f8fafc" } }}>
                          <TableCell><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.provider}</Typography></TableCell>
                          <TableCell><Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "monospace" }}>{row.number}</Typography></TableCell>
                          <TableCell><Typography sx={{ fontSize: 12 }}>{row.plan}</Typography></TableCell>
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
              {[["Network", "MTN"], ["Data type", "SME"], ["Plan", "—"], ["Service charge", "₦0.00"]].map(([label, value]) => (
                <Stack key={label} direction="row" sx={{ justifyContent: "space-between", mb: 1.5 }}>
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{label}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{value}</Typography>
                </Stack>
              ))}
              <Box sx={{ height: 1, bgcolor: "#f1f5f9", my: 2 }} />
              <Button fullWidth variant="contained" startIcon={<BoltRoundedIcon />} disableElevation sx={{ py: 1.4, fontWeight: 700, textTransform: "none", borderRadius: 2, mb: 1.5 }}>
                Buy now
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
