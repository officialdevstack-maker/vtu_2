import { BookOpenCheck } from "lucide-react";
import { PageHeader, Card, EmptyState } from "../../../user/components/shared-ui";

const ExamPage = () => {
  return (
    <div className="space-y-5">
      <PageHeader title="Exam" description="Configure exam pin products and provider pricing" />
      <Card>
        <EmptyState
          icon={BookOpenCheck}
          title="Exam pin configuration coming soon"
          description="Provider plans and pricing controls for exam pins will appear here."
        />
      </Card>
    </div>
  );
};

export default ExamPage;
