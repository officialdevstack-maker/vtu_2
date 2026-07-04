import { Network, Plus } from "lucide-react";
import { Card, Button } from "../../../../user/components/shared-ui";
import { Toolbar, SearchInput, TableShell } from "./shared";

export function NetworkTab() {
  return (
    <Card className="overflow-hidden">
      <Toolbar>
        <SearchInput placeholder="Search networks…" />
        <Button size="sm">
          <Plus className="w-3.5 h-3.5" />
          Add network
        </Button>
      </Toolbar>
      <TableShell
        heads={[
          { label: "Network name" },
          { label: "Code" },
          { label: "Provider" },
          { label: "Status" },
          { label: "Actions", align: "center" },
        ]}
        emptyIcon={Network}
        emptyTitle="No networks configured"
        emptyDescription="Add a network to get started with airtime and data products."
      />
    </Card>
  );
}
