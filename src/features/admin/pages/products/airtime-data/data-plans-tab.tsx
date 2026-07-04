import { Database, Plus } from "lucide-react";
import { Card, Button } from "../../../../user/components/shared-ui";
import { Toolbar, SearchInput, SelectFilter, TableShell } from "./shared";

const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];
const TYPES = ["VTU", "SME", "CG", "Gift"];

export function DataPlansTab() {
  return (
    <Card className="overflow-hidden">
      <Toolbar>
        <SearchInput placeholder="Search plans…" />
        <SelectFilter placeholder="All networks" options={NETWORKS} />
        <SelectFilter placeholder="All types" options={TYPES} />
        <Button size="sm">
          <Plus className="w-3.5 h-3.5" />
          Add plan
        </Button>
      </Toolbar>
      <TableShell
        heads={[
          { label: "Plan name" },
          { label: "Network" },
          { label: "Size" },
          { label: "Type" },
          { label: "Price (₦)", align: "right" },
          { label: "Validity" },
          { label: "Status" },
          { label: "Actions", align: "center" },
        ]}
        emptyIcon={Database}
        emptyTitle="No data plans added"
        emptyDescription="Add data plan bundles per network and type to make them available for purchase."
      />
    </Card>
  );
}
