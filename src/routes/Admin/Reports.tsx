import { AdminOpsScope } from './OpsScope';
import { Reports } from '../Ops/Reports';

export function AdminReports() {
  return (
    <AdminOpsScope
      title="Reports"
      description="Quarterly KPIs, on-time arrivals, and visit volume by service."
    >
      <Reports />
    </AdminOpsScope>
  );
}
