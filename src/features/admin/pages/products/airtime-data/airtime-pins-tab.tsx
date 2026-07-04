import { KeyRound, Upload } from "lucide-react";
import { Card, Button } from "../../../../user/components/shared-ui";
import { Toolbar, SelectFilter, TableShell } from "./shared";

const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];
const STATUSES = ["Available", "Used", "Expired"];

export function AirtimePinsTab() {
  return (
    <Card className="overflow-hidden">
      <Toolbar>
        <SelectFilter placeholder="All networks" options={NETWORKS} />
        <SelectFilter placeholder="All statuses" options={STATUSES} />
        <div className="flex-1" />
        <Button size="sm">
          <Upload className="w-3.5 h-3.5" />
          Upload pins
        </Button>
      </Toolbar>
      <TableShell
        heads={[
          { label: "PIN" },
          { label: "Network" },
          { label: "Face value (₦)", align: "right" },
          { label: "Status" },
          { label: "Batch ID" },
          { label: "Uploaded" },
          { label: "Actions", align: "center" },
        ]}
        emptyIcon={KeyRound}
        emptyTitle="No airtime pins in inventory"
        emptyDescription="Upload a PIN batch to stock the airtime PIN inventory."
      />
    </Card>
  );
}
