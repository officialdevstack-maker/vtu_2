import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

export default function WalletCard() {
  return (
    <Box
      sx={{
        bgcolor: "#0D1117",
        borderRadius: 2,
        p: { xs: 3, md: 3.5 },
        color: "white",
        minHeight: 240,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, bgcolor: "#5558E3" }} />

      <Box>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Box>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.38)",
                letterSpacing: 1,
                textTransform: "uppercase",
                mb: 1,
              }}
            >
              Main balance
            </Typography>
            <Typography sx={{ fontSize: 38, fontWeight: 900, lineHeight: 1 }}>
              NGN 45,250
              <Typography component="span" sx={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                .00
              </Typography>
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.09)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <AccountBalanceWalletRoundedIcon sx={{ fontSize: 20, color: "rgba(255,255,255,0.65)" }} />
          </Box>
        </Stack>

        <Stack direction="row" spacing={3}>
          <Box>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", mb: 0.25 }}>Commission</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>NGN 1,200.50</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
          <Box>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", mb: 0.25 }}>Today's spend</Typography>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>NGN 8,420</Typography>
              <Chip
                icon={<TrendingUpRoundedIcon sx={{ fontSize: "14px !important" }} />}
                label="+12%"
                size="small"
                sx={{ height: 18, fontSize: 10, bgcolor: "rgba(5,150,105,0.2)", color: "#6ee7b7", fontWeight: 700 }}
              />
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1.25}>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          disableElevation
          sx={{ bgcolor: "#2563eb", color: "white", fontWeight: 700, textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#1d4ed8" } }}
        >
          Fund wallet
        </Button>
        <Button
          variant="outlined"
          endIcon={<ArrowOutwardRoundedIcon />}
          sx={{ borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)", fontWeight: 700, textTransform: "none", borderRadius: 2, "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.05)" } }}
        >
          Withdraw
        </Button>
      </Stack>
    </Box>
  );
}
