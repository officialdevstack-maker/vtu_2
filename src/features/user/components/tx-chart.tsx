import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";

const DATA_SETS: Record<string, { day: string; value: number }[]> = {
  "7": [
    { day: "Mon", value: 80 }, { day: "Tue", value: 120 }, { day: "Wed", value: 95 },
    { day: "Thu", value: 210 }, { day: "Fri", value: 160 }, { day: "Sat", value: 300 }, { day: "Sun", value: 240 },
  ],
  "30": [
    { day: "1", value: 60 }, { day: "5", value: 80 }, { day: "10", value: 100 },
    { day: "15", value: 150 }, { day: "20", value: 200 }, { day: "25", value: 280 },
    { day: "28", value: 350 }, { day: "30", value: 480 },
  ],
  "90": [
    { day: "Jan", value: 320 }, { day: "Feb", value: 410 }, { day: "Mar", value: 390 },
  ],
};

const PERIODS = ["7", "30", "90"] as const;
const PERIOD_LABELS: Record<string, string> = { "7": "7 days", "30": "30 days", "90": "90 days" };

const KPI = [
  { label: "Total Volume", value: "₦482K", change: "+14.1%", up: true },
  { label: "Success Rate", value: "98.2%", change: "+0.4%", up: true },
  { label: "Transactions", value: "1,284", change: "+8.2%", up: true },
];

export default function TransactionChart() {
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");

  return (
    <Card sx={{ borderRadius: 3, border: "1px solid #e9eef6", boxShadow: "none" }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 2.5 }} spacing={1.5}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Transaction Trends</Typography>
            <Typography variant="body2" color="text.secondary">Spending activity over time</Typography>
          </Box>
          <Stack direction="row" spacing={0.5} sx={{ bgcolor: "#f1f5f9", p: 0.5, borderRadius: 2 }}>
            {PERIODS.map((p) => (
              <Chip
                key={p}
                label={PERIOD_LABELS[p]}
                onClick={() => setPeriod(p)}
                size="small"
                sx={{
                  fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 1.5,
                  bgcolor: period === p ? "white" : "transparent",
                  color: period === p ? "#0f172a" : "text.secondary",
                  boxShadow: period === p ? "0 1px 4px rgba(15,23,42,0.08)" : "none",
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            ))}
          </Stack>
        </Stack>

        {/* KPI row */}
        <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} spacing={2.5} sx={{ mb: 2.5, flexWrap: "wrap" }}>
          {KPI.map(({ label, value, change, up }) => (
            <Box key={label}>
              <Typography sx={{ fontSize: 11, color: "text.disabled", mb: 0.25 }}>{label}</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{value}</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: up ? "#059669" : "#dc2626" }}>{change}</Typography>
              </Stack>
            </Box>
          ))}
        </Stack>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={DATA_SETS[period]} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #e9eef6", boxShadow: "0 8px 24px rgba(15,23,42,0.1)", fontSize: 13 }}
              formatter={(value) => [`₦${Number(value ?? 0).toLocaleString()}`, "Volume"]}
              cursor={{ stroke: "#2563eb", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fill="url(#chartGrad)" dot={false} activeDot={{ r: 5, fill: "#2563eb" }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
