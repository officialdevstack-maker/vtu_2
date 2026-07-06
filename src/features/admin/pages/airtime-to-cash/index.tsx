import { PageHeader } from "../../../user/components/shared-ui";
import { AirtimeToCashRequestsTab } from "./requests-tab";

const AirtimeToCashPage = () => {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Airtime to Cash"
        description="Review customer airtime-to-cash submissions. Configure the destination number and rate per network under Products > Airtime & Data > Networks."
      />

      <AirtimeToCashRequestsTab />
    </div>
  );
};

export default AirtimeToCashPage;
