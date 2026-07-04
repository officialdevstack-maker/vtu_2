import { Mail } from "lucide-react";
import { PageHeader, Card, EmptyState } from "../../../user/components/shared-ui";

export default function WelcomePage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Welcome Messages" description="Configure messages sent to new users" />
      <Card>
        <EmptyState
          icon={Mail}
          title="Welcome message configuration coming soon"
          description="Editing the message new users receive will appear here."
        />
      </Card>
    </div>
  );
}
