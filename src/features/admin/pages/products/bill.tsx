import { ReceiptText } from "lucide-react";
import { PageHeader, Card, EmptyState } from "../../../user/components/shared-ui";

const BillPage = () => {
  return (
    <div className="space-y-5">
      <PageHeader title="Bill" description="Configure bill payment products and provider pricing" />
      <Card>
        <EmptyState
          icon={ReceiptText}
          title="Bill payment configuration coming soon"
          description="Provider plans and pricing controls for bill payments will appear here."
        />
      </Card>
    </div>
  );
};

export default BillPage;
