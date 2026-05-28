import { AdminOpsScope } from './OpsScope';
import { Pipeline } from '../Ops/Pipeline';

export function AdminPipeline() {
  return (
    <AdminOpsScope
      title="Pipeline"
      description="Drag bookings between stages. Confirm a booking to assign a person to the visit."
    >
      <Pipeline />
    </AdminOpsScope>
  );
}
