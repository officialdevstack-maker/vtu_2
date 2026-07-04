import { Megaphone } from "lucide-react";
import { PageHeader, Card, EmptyState } from "../../../user/components/shared-ui";

export default function CampaignsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Campaigns" description="Manage marketing campaigns and events" />
      <Card>
        <EmptyState
          icon={Megaphone}
          title="Campaign management coming soon"
          description="Creating and scheduling campaigns and events will appear here."
        />
      </Card>
    </div>
  );
}
