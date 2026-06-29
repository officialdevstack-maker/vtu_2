import {
  Avatar,
  Card,
  CardContent,
  Chip,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import FlashOnRoundedIcon from "@mui/icons-material/FlashOnRounded";
import TvRoundedIcon from "@mui/icons-material/TvRounded";

const TRANSACTIONS = [
  {
    service: "MTN Data - 5GB",
    txId: "#TXN-902834-01",
    amount: "NGN 1,250",
    date: "May 24, 2024",
    status: "Success",
    icon: <WifiRoundedIcon fontSize="small" />,
    iconColor: "#ecfdf5",
    iconFg: "#059669",
  },
  {
    service: "Airtel Airtime",
    txId: "#TXN-902835-02",
    amount: "NGN 500",
    date: "May 24, 2024",
    status: "Success",
    icon: <PhoneAndroidRoundedIcon fontSize="small" />,
    iconColor: "#eff6ff",
    iconFg: "#2563eb",
  },
  {
    service: "IKEDC Prepaid",
    txId: "#TXN-902836-03",
    amount: "NGN 5,000",
    date: "May 23, 2024",
    status: "Pending",
    icon: <FlashOnRoundedIcon fontSize="small" />,
    iconColor: "#fffbeb",
    iconFg: "#d97706",
  },
  {
    service: "DStv Compact",
    txId: "#TXN-902837-04",
    amount: "NGN 12,500",
    date: "May 22, 2024",
    status: "Failed",
    icon: <TvRoundedIcon fontSize="small" />,
    iconColor: "#fef2f2",
    iconFg: "#dc2626",
  },
  {
    service: "Glo Data - 2GB",
    txId: "#TXN-902838-05",
    amount: "NGN 600",
    date: "May 21, 2024",
    status: "Success",
    icon: <WifiRoundedIcon fontSize="small" />,
    iconColor: "#ecfdf5",
    iconFg: "#059669",
  },
];

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  Success: { label: "Success", bg: "#ecfdf5", color: "#059669" },
  Pending: { label: "Pending", bg: "#fffbeb", color: "#d97706" },
  Failed: { label: "Failed", bg: "#fef2f2", color: "#dc2626" },
};

export default function RecentTransactions() {
  return (
    <Card
      sx={{
        borderRadius: 2.5,
        border: "1px solid #e5e7eb",
        boxShadow: "0 12px 36px rgba(15,23,42,0.06)",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <div>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Recent transactions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Latest activity across services
            </Typography>
          </div>
          <Link href="#" underline="hover" sx={{ fontSize: 13, fontWeight: 800, color: "primary.main" }}>
            View all
          </Link>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    color: "text.secondary",
                    fontWeight: 800,
                    fontSize: 12,
                    borderBottom: "1px solid #eef2f7",
                    pb: 1.5,
                  },
                }}
              >
                <TableCell>Service</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {TRANSACTIONS.map((tx) => {
                const status = STATUS[tx.status];

                return (
                  <TableRow
                    key={tx.txId}
                    sx={{
                      "&:last-child td": { border: 0 },
                      "& td": { py: 1.8, borderColor: "#f1f5f9" },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: tx.iconColor, color: tx.iconFg }}>
                          {tx.icon}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "#111827" }}>
                          {tx.service}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                        {tx.txId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        {tx.amount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {tx.date}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{
                          bgcolor: status.bg,
                          color: status.color,
                          fontSize: 11,
                          height: 24,
                          fontWeight: 800,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
