import { AdminOpsScope } from './OpsScope';
import { Residences } from '../Ops/Residences';

export function AdminProperties() {
  return (
    <AdminOpsScope
      title="Properties · Units"
      description="Manage the unit roster for each property: add, edit, pause, or remove residences and commercial suites."
    >
      <Residences />
    </AdminOpsScope>
  );
}
