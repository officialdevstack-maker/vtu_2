import { Layers, Plus } from "lucide-react";
import { Card, Button } from "../../../../user/components/shared-ui";
import { Toolbar, SelectFilter, TableShell } from "./shared";

const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];

export function TypeTab() {
  return (
    <Card className="overflow-hidden">
      <Toolbar>
        <SelectFilter placeholder="All networks" options={NETWORKS} />
        <div className="flex-1" />
        <Button size="sm">
          <Plus className="w-3.5 h-3.5" />
          Add type
        </Button>
      </Toolbar>
      <TableShell
        heads={[
          { label: "Type name" },
          { label: "Network" },
          { label: "Description" },
          { label: "Status" },
          { label: "Actions", align: "center" },
        ]}
        emptyIcon={Layers}
        emptyTitle="No network types configured"
        emptyDescription="Types define how a network is sold — e.g. VTU, SME, CG, or Gift."
      />
    </Card>
  );
}
