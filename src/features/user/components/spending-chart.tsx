import SimpleChart from "@/shared/components/simple-chart";
import { fmt } from "../data/mock";

export type SpendingChartPoint = {
  day: string;
  amount: number;
};

export default function SpendingChart({ data }: { data: SpendingChartPoint[] }) {
  return (
    <SimpleChart
      data={data.map((point) => ({ label: point.day, amount: point.amount }))}
      series={[{ key: "amount", label: "Spent", color: "#111827", fill: true }]}
      valueFormatter={fmt}
      height={180}
      ariaLabel="Spending over time"
    />
  );
}
