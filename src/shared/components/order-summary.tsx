import { Box, Typography, Button, Divider, Stack } from "@mui/material";
import FlashOnRoundedIcon from "@mui/icons-material/FlashOnRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

interface Props {
  network: string;
  airtimeType: string;
  amount: number;
}

const LABEL: Record<string, string> = {
  mtn: "MTN",
  airtel: "Airtel",
  glo: "Glo",
  "9mobile": "9mobile",
};

export default function OrderSummary({ network, airtimeType, amount }: Props) {
  const rows = [
    { label: "Network Provider", value: LABEL[network] ?? "—" },
    { label: "Airtime Type", value: airtimeType || "—" },
    { label: "Service Charge", value: "₦0.00" },
  ];

  return (
    <Box
      sx={{
        background: "#111827",
        borderRadius: 3,
        p: 3,
        color: "white",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
        Order Summary
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        {rows.map(({ label, value }) => (
          <Stack
            key={label}
            direction="row"
            sx={{ justifyContent: "space-between" }}
          >
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)", mb: 2 }} />

      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="body2" sx={{ opacity: 0.75 }}>
          Total Amount
        </Typography>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
        >
          ₦{amount > 0 ? amount.toLocaleString() + ".00" : "0.00"}
        </Typography>
      </Stack>

      <Button
        fullWidth
        variant="contained"
        startIcon={<FlashOnRoundedIcon />}
        disabled={amount <= 0}
        sx={{
          bgcolor: "white",
          color: "#111827",
          fontWeight: 700,
          py: 1.4,
          fontSize: 15,
          "&:hover": { bgcolor: "grey.100" },
          "&.Mui-disabled": {
            bgcolor: "rgba(255,255,255,0.3)",
            color: "rgba(255,255,255,0.5)",
          },
        }}
      >
        Buy Now
      </Button>

      <Stack
        direction="row"
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mt: 1.5,
        }}
        spacing={0.5}
      >
        <LockOutlinedIcon sx={{ fontSize: 13, opacity: 0.6 }} />
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          Encrypted Secure Payment
        </Typography>
      </Stack>
    </Box>
  );
}
