import { Percent } from "lucide-react";
import { PageHeader, Card, EmptyState } from "../../../user/components/shared-ui";

export default function PromosPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Promotions" description="Create and manage promotional offers and discounts" />
      <Card>
        <EmptyState
          icon={Percent}
          title="Promotions management coming soon"
          description="Creating discounts and promotional offers will appear here."
        />
      </Card>
    </div>
  );
}
