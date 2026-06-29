import {
  Box,
  Card,
  Grid,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Person2Outlined as PersonOutlineIcon } from "@mui/icons-material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Link as RouterLink } from "react-router-dom";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import Stack from "@mui/material/Stack";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "../validators";
import { useAuth } from "@/shared/providers/auth";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [toggle, setToggle] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // 3. Initialize React Hook Form with Zod Resolver
  const {
    register,
    handleSubmit,

    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 4. Form Submission Handler
  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.login, data.password);
      console.log("Logged in successfully via Axios!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      // console.log(error.response);
    }
  };

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2, bgcolor: "background.default" }}>
      <Card sx={{ width: "100%", maxWidth: 980, borderRadius: 3, overflow: "hidden", boxShadow: 2 }}>
        <Grid container>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", justifyContent: "space-between", bgcolor: "#0f172a", p: 6, color: "white" }}>
            <Box>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 4 }}>
                <Box sx={{ bgcolor: "#2563eb", borderRadius: 2, width: 40, height: 40, display: "grid", placeItems: "center" }}>
                  <BoltRoundedIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "white" }}>SwiftVTU</Typography>
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 2 }}>
                VTU services,<br />simplified.
              </Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.62)", maxWidth: 280 }}>
                Recharge airtime, buy data, pay utility bills and more — all in one place.
              </Typography>
            </Box>
            <Stack direction="row" spacing={3} sx={{ mt: 4 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "white" }}>150K+</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.56)" }}>Customers</Typography>
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "white" }}>98.2%</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.56)" }}>Uptime</Typography>
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "white" }}>24/7</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.56)" }}>Support</Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Welcome Back</Typography>
                <Typography variant="body2" color="text.secondary">Securely access your SwiftVTU account</Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <TextField
                  fullWidth
                  label="Email or phone"
                  placeholder="you@company.com or 0801xxxxxxx"
                  variant="outlined"
                  margin="normal"
                  sx={{ mb: 2 }}
                  {...register("login")}
                  error={!!errors.login}
                  helperText={errors.login?.message}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      'aria-label': 'email or phone',
                    },
                  }}
                />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Password</Typography>
                  <Button component={RouterLink} to="/forgot-password" size="small" variant="text" sx={{ textTransform: "none" }}>Forgot password?</Button>
                </Box>

                <TextField
                  fullWidth
                  label="Password"
                  placeholder="Enter your password"
                  type={toggle ? "text" : "password"}
                  variant="outlined"
                  sx={{ mb: 2 }}
                  {...register("password")}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton edge="end" size="small" onClick={() => setToggle(!toggle)} aria-label="toggle password visibility">
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                      'aria-label': 'password',
                    },
                  }}
                />

                <FormControlLabel control={<Checkbox size="small" {...register("rememberMe")} />} label={<Typography variant="body2">Remember me for 30 days</Typography>} sx={{ mb: 3 }} />

                <Button fullWidth type="submit" variant="contained" size="large" disableElevation sx={{ py: 1.5, mb: 2 }} disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}>
                  {isSubmitting ? "Logging in..." : "Login to Account"}
                </Button>

                <Typography sx={{ textAlign: "center" }} variant="body2">
                  Don't have an account?{' '}
                  <RouterLink to="/register" style={{ color: 'var(--mui-palette-primary-main)', fontWeight: 700, textDecoration: 'none' }}>
                    Create an account
                  </RouterLink>
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default LoginForm;
