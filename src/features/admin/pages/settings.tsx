import { Settings } from "lucide-react";
import { PageHeader, Card, EmptyState } from "../../user/components/shared-ui";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Configure platform settings and preferences" />
      <Card>
        <EmptyState
          icon={Settings}
          title="Settings configuration coming soon"
          description="Platform-wide preferences and configuration will appear here."
        />
      </Card>
    </div>
  );
}
