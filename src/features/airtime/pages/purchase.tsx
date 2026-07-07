import { useState, type ChangeEvent } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Stack,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
} from "@mui/material";
import ContactPageOutlinedIcon from "@mui/icons-material/ContactPageOutlined";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import NetworkSelector from "@/shared/components/network-selector";
import AmountPresets from "../component/amount-preset";
import OrderSummary from "@/shared/components/order-summary";
import RecentAirtime from "../component/recent-airtime";
import WalletMini from "@/shared/components/wallet-mini";

export default function BuyAirtimePage() {
  const [network, setNetwork] = useState("mtn");
  const [airtimeType, setAirtimeType] = useState("Prepaid");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [preset, setPreset] = useState<number | null>(null);

  const handlePreset = (val: number) => {
    setPreset(val);
    setAmount(val);
  };

  const handleAmountChange = (val: string) => {
    const n = parseInt(val.replace(/\D/g, ""), 10) || 0;
    setAmount(n);
    setPreset(null);
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        p: 3,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Grid container spacing={3}>
        {/* Main content */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
              Buy Airtime
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Top up your phone or send airtime to loved ones instantly.
            </Typography>
          </Box>

          {/* Form Card */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              {/* Network selector */}
              <NetworkSelector selected={network} onChange={setNetwork} />

              {/* Airtime type + phone */}
              <Grid container spacing={2} sx={{ my: 2.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Airtime Type</InputLabel>
                    <Select
                      label="Airtime Type"
                      value={airtimeType}
                      onChange={(e: SelectChangeEvent<string>) =>
                        setAirtimeType(e.target.value)
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="Prepaid">Prepaid</MenuItem>
                      <MenuItem value="Postpaid">Postpaid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Phone Number"
                    placeholder="e.g. 08012345678"
                    value={phone}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPhone(e.target.value)
                    }
                    inputProps={{ maxLength: 11 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <ContactPageOutlinedIcon
                            fontSize="small"
                            color="action"
                          />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>

              {/* Amount input */}
              <Box sx={{ mt: 2.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: "block", fontWeight: 600 }}
                >
                  Enter Amount
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Minimum ₦100"
                  value={amount > 0 ? amount : ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleAmountChange(e.target.value)
                  }
                  sx={{
                    mb: 1.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      fontSize: 15,
                    },
                  }}
                />
                <AmountPresets selected={preset} onSelect={handlePreset} />
              </Box>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <RecentAirtime />
            </CardContent>
          </Card>
        </Grid>

        {/* Right Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            {/* Wallet balance */}
            <WalletMini />

            {/* Order Summary */}
            <OrderSummary
              network={network}
              airtimeType={airtimeType}
              amount={amount}
            />

            {/* Help card */}
            <Card sx={{ bgcolor: "secondary.main", boxShadow: "none" }}>
              <CardContent sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    sx={{
                      bgcolor: "white",
                      borderRadius: 2,
                      p: 0.8,
                      display: "flex",
                    }}
                  >
                    <HelpOutlineRoundedIcon color="primary" fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Need Help?
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Our support is available 24/7
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
