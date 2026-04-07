export default function BookingTable({ bookings }) {
  return (
    <div className="card overflow">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Restaurant</th>
            <th>Customer</th>
            <th>Time</th>
            <th>Guests</th>
            <th>Table</th>
            <th>Status</th>
            <th>Connector Response</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>{booking.id}</td>
              <td>{booking.restaurantName}</td>
              <td>{booking.customerName}</td>
              <td>{booking.bookingTime}</td>
              <td>{booking.guestCount}</td>
              <td>{booking.table}</td>
              <td>{booking.status}</td>
              <td>
                <pre className="mini-pre">
                  {JSON.stringify(booking.connectorResponse || {}, null, 2)}
                </pre>
              </td>
              <td>{booking.createdAt}</td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan="9">No bookings yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
