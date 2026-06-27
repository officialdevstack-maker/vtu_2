import {
  Box,
  Card,
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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "../validators";
import { useAuth } from "@/shared/providers/auth";


const LoginForm = () => {
  const [toggle, setToggle] = useState(false);

  const { login } = useAuth();

  // 3. Initialize React Hook Form with Zod Resolver
  const {
    register,
    handleSubmit,

    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 4. Form Submission Handler
  const onSubmit = (data: LoginFormData) => {
    console.log("Form Submitted Successfully:", data);
    // Add your API call/authentication logic here
    login()
  };

  return (
    <Box sx={{ maxWidth: 450, width: "100%", mx: "auto", my: 4 }}>
      <Card
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          border: "1px solid #eaeaea",
          borderTop: "4px solid #0047FF",
        }}
      >
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Securely access your SwiftVTU account
          </Typography>
        </Box>

        {/* Wrap form with handleSubmit */}
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {/* Email/Phone Field */}
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Email or Phone Number
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter email or phone"
            variant="outlined"
            margin="normal"
            sx={{ mt: 0, mb: 2 }}
            // Connect to React Hook Form
            {...register("emailOrPhone")}
            // Handle error state and helper text
            error={!!errors.emailOrPhone}
            helperText={errors.emailOrPhone?.message}
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

          {/* Password Field */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Password
            </Typography>
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: "pointer", fontWeight: 600 }}
            >
              Forgot password?
            </Typography>
          </Box>
          <TextField
            fullWidth
            type={toggle ? "text" : "password"}
            placeholder="••••••••"
            variant="outlined"
            sx={{ mt: 0, mb: 2 }}
            // Connect to React Hook Form
            {...register("password")}
            // Handle error state and helper text
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
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setToggle(!toggle)}
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControlLabel
            control={<Checkbox size="small" {...register("rememberMe")} />}
            label={
              <Typography variant="body2">Remember me for 30 days</Typography>
            }
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disableElevation
            sx={{ py: 1.5, mb: 3 }}
            // Disable button & show spinner when submitting
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
          >
            {isSubmitting ? "Logging in..." : "Login to Account"}
          </Button>

          <Typography sx={{ textAlign: "center" }} variant="body2">
            Don't have an account?{" "}
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: "pointer", fontWeight: "bold" }}
            >
              Create an account
            </Typography>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginForm;
