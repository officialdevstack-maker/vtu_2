import {
  Box,
  Card,
  Grid,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Person2Outlined as PersonOutlineIcon } from "@mui/icons-material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/shared/api/apiClient";
import { useNavigate } from "react-router-dom";

const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Name is required" }),
    login: z.string().min(1, { message: "Email or phone is required" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(1),
    acceptTerms: z.literal(true, { message: "You must accept the terms" }),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    try {
      // Attempt registration (backend must support /register)
      await apiClient.post("/register", {
        name: data.name,
        login: data.login,
        password: data.password,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2, bgcolor: "background.default" }}>
      <Card sx={{ width: "100%", maxWidth: 980, borderRadius: 3, overflow: "hidden", boxShadow: 2 }}>
        <Grid container>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: "none", md: "block" }, background: "linear-gradient(180deg,#f8fafc,#eef2ff)", minHeight: 360 }} />

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: { xs: 4, md: 6 } }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Create an account</Typography>
                <Typography variant="body2" color="text.secondary">Start using SwiftVTU to manage airtime, data, and bills.</Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <TextField fullWidth label="Full name" margin="normal" {...register("name")} error={!!errors.name} helperText={errors.name?.message} />

                <TextField
                  fullWidth
                  label="Email or phone"
                  margin="normal"
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
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  margin="normal"
                  type={showPassword ? "text" : "password"}
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
                          <IconButton size="small" onClick={() => setShowPassword(!showPassword)} aria-label="toggle password visibility">
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField fullWidth label="Confirm password" margin="normal" type={showPassword ? "text" : "password"} {...register("confirmPassword")} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />

                <FormControlLabel control={<Checkbox {...register("acceptTerms")} />} label={<Typography variant="body2">I agree to the terms and privacy policy</Typography>} sx={{ mt: 1 }} />

                <Button fullWidth type="submit" variant="contained" size="large" disableElevation sx={{ py: 1.5, mt: 2 }} disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}>
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Button>

                <Typography sx={{ textAlign: "center", mt: 2 }} variant="body2">
                  Already have an account? <a href="/login" style={{ color: 'var(--mui-palette-primary-main)', fontWeight: 700 }}>Login</a>
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}
