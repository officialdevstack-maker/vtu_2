import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

const NOTIFICATION_PREFS = [
  { label: "Transaction alerts", desc: "Get notified for every transaction", defaultOn: true },
  { label: "Low balance alert", desc: "Alert when balance falls below ₦1,000", defaultOn: true },
  { label: "Promotional emails", desc: "Receive offers and deals via email", defaultOn: false },
  { label: "Login notifications", desc: "Alert on new device login", defaultOn: true },
];

export default function SettingsPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: 20, color: "#0f172a" }}>Settings</Typography>
        <Typography variant="body2" color="text.secondary">Manage your account preferences and security.</Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            {/* Profile */}
            <Card sx={{ p: 3, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2.5 }}>
                <Box sx={{ bgcolor: "#eff6ff", color: "#2563eb", borderRadius: 2, p: 1, display: "grid", placeItems: "center" }}>
                  <PersonRoundedIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Profile Information</Typography>
                  <Typography variant="body2" color="text.secondary">Update your personal details</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: "#0a0f1e", fontSize: 22, fontWeight: 800 }}>JD</Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>John Doe</Typography>
                  <Typography variant="body2" color="text.secondary">john.doe@swiftvtu.com</Typography>
                  <Chip label="Admin" size="small" sx={{ mt: 0.5, height: 18, fontSize: 10, bgcolor: "#eff6ff", color: "#2563eb", fontWeight: 700 }} />
                </Box>
                <Box sx={{ ml: "auto !important" }}>
                  <Button variant="outlined" size="small" startIcon={<EditRoundedIcon />} sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}>
                    Edit photo
                  </Button>
                </Box>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="First name" defaultValue="John" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Last name" defaultValue="Doe" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Email address" defaultValue="john.doe@swiftvtu.com" type="email" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Phone number" defaultValue="08012345678" />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" disableElevation sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}>
                  Save changes
                </Button>
              </Box>
            </Card>

            {/* Password */}
            <Card sx={{ p: 3, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2.5 }}>
                <Box sx={{ bgcolor: "#fffbeb", color: "#d97706", borderRadius: 2, p: 1, display: "grid", placeItems: "center" }}>
                  <LockRoundedIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Change Password</Typography>
                  <Typography variant="body2" color="text.secondary">Keep your account secure</Typography>
                </Box>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Current password" type="password" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="New password" type="password" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Confirm new password" type="password" />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" disableElevation sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}>
                  Update password
                </Button>
              </Box>
            </Card>

            {/* Notifications */}
            <Card sx={{ p: 3, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2.5 }}>
                <Box sx={{ bgcolor: "#ecfdf5", color: "#059669", borderRadius: 2, p: 1, display: "grid", placeItems: "center" }}>
                  <NotificationsRoundedIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Notification Preferences</Typography>
                  <Typography variant="body2" color="text.secondary">Choose what you want to hear about</Typography>
                </Box>
              </Stack>

              <Stack spacing={0}>
                {NOTIFICATION_PREFS.map((pref, i) => (
                  <Box key={pref.label}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 1.75 }}>
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{pref.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{pref.desc}</Typography>
                      </Box>
                      <Switch defaultChecked={pref.defaultOn} size="small" />
                    </Stack>
                    {i < NOTIFICATION_PREFS.length - 1 && <Divider sx={{ borderColor: "#f1f5f9" }} />}
                  </Box>
                ))}
              </Stack>
            </Card>
          </Stack>
        </Grid>

        {/* Right sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5}>
            {/* Account overview */}
            <Card sx={{ borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none", overflow: "hidden" }}>
              <Box sx={{ bgcolor: "#0a0f1e", px: 3, pt: 3, pb: 2.5, color: "white" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: 0.8, textTransform: "uppercase", mb: 0.5 }}>Account Status</Typography>
                <Chip label="Active" sx={{ bgcolor: "#ecfdf5", color: "#059669", fontWeight: 700, fontSize: 12 }} />
              </Box>
              <Box sx={{ px: 3, py: 2.5 }}>
                {[["Account type", "Admin"], ["Member since", "Jan 2024"], ["Total transactions", "1,284"], ["Referral code", "SWIFT-7829"]].map(([label, value]) => (
                  <Stack key={label} direction="row" sx={{ justifyContent: "space-between", mb: 1.5 }}>
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{label}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{value}</Typography>
                  </Stack>
                ))}
              </Box>
            </Card>

            {/* Security */}
            <Card sx={{ p: 3, borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
                <Box sx={{ bgcolor: "#fef2f2", color: "#dc2626", borderRadius: 2, p: 1, display: "grid", placeItems: "center" }}>
                  <SecurityRoundedIcon />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Security</Typography>
              </Stack>
              <Stack spacing={0}>
                {[
                  { label: "Two-factor authentication", on: false },
                  { label: "Login email alerts", on: true },
                ].map((item, i, arr) => (
                  <Box key={item.label}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.label}</Typography>
                      <Switch defaultChecked={item.on} size="small" />
                    </Stack>
                    {i < arr.length - 1 && <Divider sx={{ borderColor: "#f1f5f9" }} />}
                  </Box>
                ))}
              </Stack>

              <Button fullWidth variant="outlined" color="error" sx={{ mt: 2, textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                Delete account
              </Button>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
