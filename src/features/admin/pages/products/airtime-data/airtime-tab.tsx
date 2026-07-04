import { PhoneCall, SlidersHorizontal } from "lucide-react";
import { Card, Button } from "../../../../user/components/shared-ui";
import { Toolbar, SelectFilter, TableShell } from "./shared";

const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];

export function AirtimeTab() {
  return (
    <Card className="overflow-hidden">
      <Toolbar>
        <SelectFilter placeholder="All networks" options={NETWORKS} />
        <div className="flex-1" />
        <Button size="sm">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Set discount
        </Button>
      </Toolbar>
      <TableShell
        heads={[
          { label: "Network" },
          { label: "Discount (%)", align: "right" },
          { label: "Min amount (₦)", align: "right" },
          { label: "Max amount (₦)", align: "right" },
          { label: "Enabled" },
          { label: "Last updated" },
          { label: "Actions", align: "center" },
        ]}
        emptyIcon={PhoneCall}
        emptyTitle="No airtime discounts configured"
        emptyDescription="Set a discount rate per network to control airtime pricing."
      />
    </Card>
  );
}
