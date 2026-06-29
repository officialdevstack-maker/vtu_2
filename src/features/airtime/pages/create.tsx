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
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";

const NETWORKS = [
  { label: "MTN", color: "#facc15", text: "#111827" },
  { label: "Airtel", color: "#ef4444", text: "#fff" },
  { label: "Glo", color: "#22c55e", text: "#fff" },
  { label: "9mobile", color: "#064e3b", text: "#fff" },
];

const AMOUNTS = ["100", "200", "500", "1,000", "2,000", "5,000"];

const RECENT = [
  { provider: "MTN", number: "0806****123", amount: "₦1,000", status: "Success", date: "May 12, 10:24 AM" },
  { provider: "Airtel", number: "0901****882", amount: "₦5,000", status: "Success", date: "May 11, 04:15 PM" },
  { provider: "Glo", number: "0805****001", amount: "₦500", status: "Failed", date: "May 10, 09:30 AM" },
];

export default function CreateAirtime() {
  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { md: "center" }, gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 20, color: "#0f172a" }}>Buy Airtime</Typography>
          <Typography variant="body2" color="text.secondary">Top up your phone or send airtime instantly.</Typography>
        </Box>
        <Card sx={{ px: 2.5, py: 1.5, minWidth: { xs: "100%", md: 260 }, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: "#eff6ff", color: "#2563eb", display: "grid", placeItems: "center" }}>
                <AccountBalanceWalletRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Wallet balance</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 15 }}>₦45,250.00</Typography>
              </Box>
            </Stack>
            <IconButton size="small" sx={{ bgcolor: "#eff6ff", color: "#2563eb", borderRadius: 1.5 }}>
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Card>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            <Card sx={{ p: 3, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 1.5 }}>Select network provider</Typography>
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                {NETWORKS.map((network, index) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={network.label}>
                    <Button
                      fullWidth
                      variant={index === 0 ? "contained" : "outlined"}
                      sx={{
                        height: 86,
                        borderRadius: 2,
                        bgcolor: index === 0 ? "#eff6ff" : "white",
                        borderColor: index === 0 ? "#2563eb" : "#dbe3ef",
                        color: "#111827",
                        boxShadow: "none",
                        "&:hover": { bgcolor: "#f8fbff", boxShadow: "none" },
                      }}
                    >
                      <Stack spacing={0.8} sx={{ alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            bgcolor: network.color,
                            color: network.text,
                            display: "grid",
                            placeItems: "center",
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          {network.label.charAt(0)}
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>
                          {network.label}
                        </Typography>
                      </Stack>
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField select fullWidth label="Airtime type" defaultValue="prepaid">
                    <MenuItem value="prepaid">Prepaid</MenuItem>
                    <MenuItem value="postpaid">Postpaid</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Phone number" placeholder="e.g. 08012345678" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Amount" placeholder="Minimum ₦100" />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                {AMOUNTS.map((amount) => (
                  <Chip key={amount} label={`NGN ${amount}`} variant="outlined" sx={{ fontWeight: 800 }} />
                ))}
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Recent Airtime</Typography>
                  <Typography variant="body2" color="text.secondary">Your last purchases</Typography>
                </Box>
                <Button size="small" sx={{ textTransform: "none", fontWeight: 700 }}>View all</Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { fontWeight: 900, color: "text.secondary", fontSize: 12 } }}>
                      <TableCell>Provider</TableCell>
                      <TableCell>Number</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {RECENT.map((row) => (
                      <TableRow key={`${row.provider}-${row.number}`} sx={{ "& td": { borderColor: "#f1f5f9", py: 1.4 } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {row.provider}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.number}</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>{row.amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            color={row.status === "Success" ? "success" : "error"}
                            sx={{ height: 22, fontSize: 11, fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell align="right">{row.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <Card sx={{ borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none", overflow: "hidden" }}>
              {/* Dark header */}
              <Box sx={{ bgcolor: "#0a0f1e", px: 3, pt: 3, pb: 2.5, color: "white", position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: 0.8, textTransform: "uppercase", mb: 0.5 }}>Order Summary</Typography>
                <Typography sx={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>₦0.00</Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)", mt: 0.5 }}>Total amount to pay</Typography>
              </Box>
              {/* Details */}
              <Box sx={{ px: 3, py: 2.5 }}>
                {[
                  ["Network provider", "MTN"],
                  ["Airtime type", "Prepaid"],
                  ["Service charge", "₦0.00"],
                ].map(([label, value]) => (
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

            <Card sx={{ p: 2, borderRadius: 3, border: "1px solid #e9eef6", bgcolor: "#f8fafc" }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <HelpOutlineRoundedIcon sx={{ color: "#2563eb" }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    Need help?
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Support is available 24/7.
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
