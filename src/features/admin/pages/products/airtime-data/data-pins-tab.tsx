import { Hash, Upload } from "lucide-react";
import { Card, Button } from "../../../../user/components/shared-ui";
import { Toolbar, SelectFilter, TableShell } from "./shared";

const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];
const STATUSES = ["Available", "Used", "Expired"];

export function DataPinsTab() {
  return (
    <Card className="overflow-hidden">
      <Toolbar>
        <SelectFilter placeholder="All networks" options={NETWORKS} />
        <SelectFilter placeholder="All plans" options={[]} />
        <SelectFilter placeholder="All statuses" options={STATUSES} />
        <div className="flex-1" />
        <Button size="sm">
          <Upload className="w-3.5 h-3.5" />
          Upload pins
        </Button>
      </Toolbar>
      <TableShell
        heads={[
          { label: "Token / Serial" },
          { label: "Network" },
          { label: "Plan" },
          { label: "Status" },
          { label: "Batch ID" },
          { label: "Uploaded" },
          { label: "Actions", align: "center" },
        ]}
        emptyIcon={Hash}
        emptyTitle="No data pins in inventory"
        emptyDescription="Upload a PIN batch to stock the data PIN inventory."
      />
    </Card>
  );
}
