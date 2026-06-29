import { Box, Card, CardActionArea, Grid, Typography } from "@mui/material";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import FlashOnRoundedIcon from "@mui/icons-material/FlashOnRounded";
import TvRoundedIcon from "@mui/icons-material/TvRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LocalAtmRoundedIcon from "@mui/icons-material/LocalAtmRounded";

const SERVICES = [
  { label: "Airtime",     icon: <PhoneAndroidRoundedIcon sx={{ fontSize: 20 }} /> },
  { label: "Data",        icon: <WifiRoundedIcon          sx={{ fontSize: 20 }} /> },
  { label: "Electricity", icon: <FlashOnRoundedIcon       sx={{ fontSize: 20 }} /> },
  { label: "Cable TV",    icon: <TvRoundedIcon            sx={{ fontSize: 20 }} /> },
  { label: "Education",   icon: <SchoolRoundedIcon        sx={{ fontSize: 20 }} /> },
  { label: "Transfer",    icon: <LocalAtmRoundedIcon      sx={{ fontSize: 20 }} /> },
];

export default function QuickServices() {
  return (
    <Card sx={{ height: "100%" }}>
      <Box sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 0.25 }}>Quick Services</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Tap to get started</Typography>

        <Grid container spacing={1}>
          {SERVICES.map(({ label, icon }) => (
            <Grid size={{ xs: 4 }} key={label}>
              <CardActionArea
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid #EEF2F6",
                  bgcolor: "white",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                  textAlign: "center",
                  "&:hover": { borderColor: "#5558E3", "& .svc-icon": { color: "#5558E3" } },
                  transition: "border-color 0.12s",
                }}
              >
                <Box className="svc-icon" sx={{ color: "#94A3B8", lineHeight: 0, transition: "color 0.12s" }}>
                  {icon}
                </Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#374151", lineHeight: 1.2 }}>
                  {label}
                </Typography>
              </CardActionArea>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Card>
  );
}
