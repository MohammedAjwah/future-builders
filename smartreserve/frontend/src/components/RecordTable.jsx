export default function RecordTable({ records }) {
  return (
    <div className="card overflow">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Restaurant</th>
            <th>Type</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Time</th>
            <th>Guests</th>
            <th>Status</th>
            <th>Delivery</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.id}</td>
              <td>{record.restaurantName}</td>
              <td>{record.type}</td>
              <td>{record.customerName || "-"}</td>
              <td>{record.customerPhone || "-"}</td>
              <td>{record.bookingTime || "-"}</td>
              <td>{record.guestCount || "-"}</td>
              <td>{record.status}</td>
              <td>{record.externalDeliveryStatus}</td>
              <td>{record.createdAt}</td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan="10">No records yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
