import { Box, Card, CardContent, Chip, IconButton, Stack, Typography } from "@mui/material";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useState } from "react";

export default function AutoFundCard() {
  const [copied, setCopied] = useState(false);
  const acct = "1234567890";

  const handleCopy = () => {
    navigator.clipboard.writeText(acct).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card sx={{ height: "100%", borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
      <CardContent sx={{ p: 3, height: "100%" }}>
        <Stack sx={{ height: "100%", justifyContent: "space-between" }} spacing={2.5}>

          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Auto-Funding</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Transfer to top up instantly
              </Typography>
            </Box>
            <Box sx={{ bgcolor: "rgba(85,88,227,0.1)", color: "#5558E3", borderRadius: 2, p: 1.25, display: "grid", placeItems: "center" }}>
              <AccountBalanceRoundedIcon fontSize="small" />
            </Box>
          </Stack>

          <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #e9eef6", borderRadius: 2.5, p: 2 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.disabled", letterSpacing: 0.8, textTransform: "uppercase" }}>
                Monnify Bank
              </Typography>
              <Chip label="Active" size="small" sx={{ height: 18, fontSize: 10, bgcolor: "#ecfdf5", color: "#059669", fontWeight: 700 }} />
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: "#0f172a" }}>
                {acct}
              </Typography>
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{ bgcolor: "white", border: "1px solid #e9eef6", borderRadius: 1.5, "&:hover": { bgcolor: "#eff6ff" } }}
              >
                {copied ? <CheckRoundedIcon sx={{ fontSize: 16, color: "#059669" }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Stack>
          </Box>

          <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
            Transfers processed instantly. ₦50 fee applies.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
