import {
  Avatar,
  Box,
  Card,
  Chip,
  Grid,
  InputAdornment,
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
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import FlashOnRoundedIcon from "@mui/icons-material/FlashOnRounded";
import TvRoundedIcon from "@mui/icons-material/TvRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";

const STATS = [
  { label: "Total Transactions", value: "1,284", icon: <TrendingUpRoundedIcon sx={{ fontSize: 18 }} />, bg: "#eff6ff", color: "#2563eb" },
  { label: "Successful", value: "1,241", icon: <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />, bg: "#ecfdf5", color: "#059669" },
  { label: "Pending", value: "36", icon: <HourglassTopRoundedIcon sx={{ fontSize: 18 }} />, bg: "#fffbeb", color: "#d97706" },
  { label: "Failed", value: "7", icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />, bg: "#fef2f2", color: "#dc2626" },
];

const TRANSACTIONS = [
  { service: "MTN Data — 5GB", txId: "#TXN-902834-01", amount: "₦1,250", type: "Data", date: "May 24, 2024", status: "Success", icon: <WifiRoundedIcon fontSize="small" />, iconBg: "#ecfdf5", iconFg: "#059669" },
  { service: "Airtel Airtime", txId: "#TXN-902835-02", amount: "₦500", type: "Airtime", date: "May 24, 2024", status: "Success", icon: <PhoneAndroidRoundedIcon fontSize="small" />, iconBg: "#eff6ff", iconFg: "#2563eb" },
  { service: "IKEDC Prepaid", txId: "#TXN-902836-03", amount: "₦5,000", type: "Electricity", date: "May 23, 2024", status: "Pending", icon: <FlashOnRoundedIcon fontSize="small" />, iconBg: "#fffbeb", iconFg: "#d97706" },
  { service: "DStv Compact", txId: "#TXN-902837-04", amount: "₦12,500", type: "Cable TV", date: "May 22, 2024", status: "Failed", icon: <TvRoundedIcon fontSize="small" />, iconBg: "#fef2f2", iconFg: "#dc2626" },
  { service: "Glo Data — 2GB", txId: "#TXN-902838-05", amount: "₦600", type: "Data", date: "May 21, 2024", status: "Success", icon: <WifiRoundedIcon fontSize="small" />, iconBg: "#ecfdf5", iconFg: "#059669" },
  { service: "MTN Airtime", txId: "#TXN-902839-06", amount: "₦1,000", type: "Airtime", date: "May 20, 2024", status: "Success", icon: <PhoneAndroidRoundedIcon fontSize="small" />, iconBg: "#eff6ff", iconFg: "#2563eb" },
  { service: "EKEDC Prepaid", txId: "#TXN-902840-07", amount: "₦3,000", type: "Electricity", date: "May 19, 2024", status: "Success", icon: <FlashOnRoundedIcon fontSize="small" />, iconBg: "#fffbeb", iconFg: "#d97706" },
  { service: "GOtv Max", txId: "#TXN-902841-08", amount: "₦4,150", type: "Cable TV", date: "May 18, 2024", status: "Success", icon: <TvRoundedIcon fontSize="small" />, iconBg: "#fef2f2", iconFg: "#dc2626" },
];

const STATUS: Record<string, { bg: string; color: string }> = {
  Success: { bg: "#ecfdf5", color: "#059669" },
  Pending: { bg: "#fffbeb", color: "#d97706" },
  Failed: { bg: "#fef2f2", color: "#dc2626" },
};

export default function TransactionsPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: 20, color: "#0f172a" }}>Transactions</Typography>
        <Typography variant="body2" color="text.secondary">A full history of all your service transactions.</Typography>
      </Box>

      {/* Stat chips */}
      <Grid container spacing={2}>
        {STATS.map((s) => (
          <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
            <Card sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>{s.label}</Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.value}</Typography>
                </Box>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: s.bg, color: s.color, display: "grid", placeItems: "center" }}>
                  {s.icon}
                </Box>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters + table */}
      <Card sx={{ borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
        <Box sx={{ p: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
            <TextField
              size="small"
              placeholder="Search by service or transaction ID…"
              sx={{ flexGrow: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> } }}
            />
            <TextField select size="small" defaultValue="all" sx={{ minWidth: 140, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}>
              <MenuItem value="all">All types</MenuItem>
              <MenuItem value="airtime">Airtime</MenuItem>
              <MenuItem value="data">Data</MenuItem>
              <MenuItem value="electricity">Electricity</MenuItem>
              <MenuItem value="cable">Cable TV</MenuItem>
            </TextField>
            <TextField select size="small" defaultValue="all" sx={{ minWidth: 140, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}>
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Stack>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontSize: 11, fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.6, borderBottom: "1px solid #f1f5f9", pb: 1.5 } }}>
                  <TableCell>Service</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {TRANSACTIONS.map((tx) => {
                  const st = STATUS[tx.status];
                  return (
                    <TableRow key={tx.txId} sx={{ "& td": { py: 1.8, borderColor: "#f8fafc" }, "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: tx.iconBg, color: tx.iconFg }}>{tx.icon}</Avatar>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{tx.service}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Chip label={tx.type} size="small" sx={{ height: 20, fontSize: 10, bgcolor: "#f1f5f9", fontWeight: 700 }} /></TableCell>
                      <TableCell><Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "monospace" }}>{tx.txId}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{tx.amount}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: 12, color: "text.secondary" }}>{tx.date}</Typography></TableCell>
                      <TableCell><Chip label={tx.status} size="small" sx={{ height: 22, fontSize: 11, bgcolor: st.bg, color: st.color, fontWeight: 700 }} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>
    </Stack>
  );
}
