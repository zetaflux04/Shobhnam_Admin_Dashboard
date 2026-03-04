import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBookings = (page = 1) => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/bookings', { params })
      .then((res) => {
        const d = res.data.data;
        setBookings(d.bookings || []);
        setPagination(d.pagination || {});
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings(pagination.page);
  }, [pagination.page, statusFilter]);

  const statusBadge = (s) => {
    const map = {
      PENDING: 'badge-warning',
      CONFIRMED: 'badge-info',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
      REJECTED: 'badge-danger',
    };
    return <span className={`badge ${map[s] || 'badge-default'}`}>{s}</span>;
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '-');

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="ph-title">Bookings</h1>
          <p className="ph-desc">View and manage bookings</p>
        </div>
      </div>

      <div className="filters-row">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
              <span>Loading...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <p>No bookings found</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Artist</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b._id}>
                        <td className="td-main">{b.user?.name || '-'}</td>
                        <td>{b.artist?.name || '-'}</td>
                        <td>{formatDate(b.eventDetails?.date)}</td>
                        <td>₹{(b.pricing?.agreedPrice ?? 0).toLocaleString('en-IN')}</td>
                        <td>{statusBadge(b.status)}</td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/bookings/${b._id}`)}
                            title="View"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span className="pagination-info">
                  Showing {bookings.length} of {pagination.totalCount}
                </span>
                <div className="pagination-btns">
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
