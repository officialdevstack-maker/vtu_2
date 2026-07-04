import { FileText } from "lucide-react";
import { PageHeader, Card, EmptyState } from "../../../user/components/shared-ui";

export default function TemplatePage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Templates" description="Manage notification templates" />
      <Card>
        <EmptyState
          icon={FileText}
          title="Template management coming soon"
          description="Creating and editing notification templates will appear here."
        />
      </Card>
    </div>
  );
}
