import { Cable } from "lucide-react";
import { PageHeader, Card, EmptyState } from "../../../user/components/shared-ui";

const CablePage = () => {
  return (
    <div className="space-y-5">
      <PageHeader title="Cable" description="Configure cable TV products and provider pricing" />
      <Card>
        <EmptyState
          icon={Cable}
          title="Cable configuration coming soon"
          description="Provider plans and pricing controls for cable TV will appear here."
        />
      </Card>
    </div>
  );
};

export default CablePage;
