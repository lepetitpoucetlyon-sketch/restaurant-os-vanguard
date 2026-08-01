import { KitchenDashboard } from '@/modules/ops';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function KitchenPage() {
  return <KitchenDashboard />;
}

export default withPageGuard(KitchenPage, "kitchen");
