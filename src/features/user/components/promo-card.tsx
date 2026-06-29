import { Box, Button, Grid, IconButton, Stack, Typography } from "@mui/material";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import { useState } from "react";

export default function PromoCards() {
  const [copied, setCopied] = useState(false);
  const code = "SWIFT-7829-VTU";

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Grid container spacing={2.5}>
      {/* Upgrade to Reseller */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box
          sx={{
            bgcolor: "#0a0f1e",
            borderRadius: 3,
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
            minHeight: 160,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.05)" }} />
          <Box sx={{ position: "absolute", right: 10, top: 10, width: 70, height: 70, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />

          <Box>
            <Box sx={{ bgcolor: "rgba(85,88,227,0.25)", borderRadius: 1.5, p: 0.75, width: 36, height: 36, display: "grid", placeItems: "center", mb: 1.5 }}>
              <LayersRoundedIcon sx={{ fontSize: 20, color: "#93c5fd" }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 16, mb: 0.5 }}>Upgrade to Reseller</Typography>
            <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
              Unlock wholesale prices and massive discounts on all services.
            </Typography>
          </Box>

          <Button
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ alignSelf: "flex-start", mt: 2, color: "#93c5fd", fontWeight: 700, textTransform: "none", p: 0, "&:hover": { bgcolor: "transparent", color: "white" } }}
          >
            Get Started
          </Button>
        </Box>
      </Grid>

      {/* Refer & Earn */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box
          sx={{
            bgcolor: "#1e3a8a",
            borderRadius: 3,
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
            minHeight: 160,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ position: "absolute", right: -30, bottom: -30, width: 140, height: 140, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)" }} />

          <Box>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.12)", borderRadius: 1.5, p: 0.75, width: 36, height: 36, display: "grid", placeItems: "center", mb: 1.5 }}>
              <PeopleAltRoundedIcon sx={{ fontSize: 20, color: "#bfdbfe" }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 16, mb: 0.5 }}>Refer &amp; Earn</Typography>
            <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              Earn commission every time a friend completes their first purchase.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 2 }}>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2, px: 2, py: 0.75, border: "1px solid rgba(255,255,255,0.15)" }}>
              <Typography sx={{ fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>{code}</Typography>
            </Box>
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1.5, border: "1px solid rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}
            >
              {copied
                ? <CheckRoundedIcon sx={{ fontSize: 16, color: "#86efac" }} />
                : <ContentCopyRoundedIcon sx={{ fontSize: 16, color: "white" }} />}
            </IconButton>
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );
}
