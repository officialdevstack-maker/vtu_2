import { Sparkles } from "lucide-react";
import { PageHeader, Card, EmptyState } from "../../user/components/shared-ui";

const ServiceControlPage = () => {
  return (
    <div className="space-y-5">
      <PageHeader title="Service Control" description="Enable, disable, and monitor platform services" />
      <Card>
        <EmptyState
          icon={Sparkles}
          title="Service control coming soon"
          description="Live toggles for airtime, data, cable, and bill services will appear here."
        />
      </Card>
    </div>
  );
};

export default ServiceControlPage;
