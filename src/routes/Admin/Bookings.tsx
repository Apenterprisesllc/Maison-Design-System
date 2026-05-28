import { AdminOpsScope } from './OpsScope';
import { BookingsTable } from '../Ops/BookingsTable';

export function AdminBookings() {
  return (
    <AdminOpsScope
      title="Bookings"
      description="Every booking for the selected property. Filter, search, and export."
    >
      <BookingsTable />
    </AdminOpsScope>
  );
}
