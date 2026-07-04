import { Radio } from "lucide-react";
import { PageHeader, Card, EmptyState } from "../../../user/components/shared-ui";

export default function BroadcastPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Broadcast" description="Send messages to all users at once" />
      <Card>
        <EmptyState
          icon={Radio}
          title="Broadcast messaging coming soon"
          description="Composing and sending broadcast messages will appear here."
        />
      </Card>
    </div>
  );
}
