import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { adminArtistApi, adminBookingApi } from '../services/api';

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvedArtists, setApprovedArtists] = useState([]);
  const [selectedArtistByBooking, setSelectedArtistByBooking] = useState({});
  const [assigningBookingId, setAssigningBookingId] = useState(null);

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

  useEffect(() => {
    adminArtistApi.listApproved()
      .then((res) => {
        setApprovedArtists(res.data?.data?.artists || []);
      })
      .catch(() => setApprovedArtists([]));
  }, []);

  const handleAssignArtist = async (bookingId) => {
    const artistId = selectedArtistByBooking[bookingId];
    if (!artistId) {
      toast.error('Select an artist first');
      return;
    }
    setAssigningBookingId(bookingId);
    try {
      await adminBookingApi.assignArtist(bookingId, {
        artistId,
        note: 'Assigned from bookings list',
      });
      toast.success('Artist assigned');
      fetchBookings(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign artist');
    } finally {
      setAssigningBookingId(null);
    }
  };

  const handleUnassignArtist = async (bookingId, artistId) => {
    if (!artistId) {
      toast.error('Artist is required');
      return;
    }
    setAssigningBookingId(bookingId);
    try {
      await adminBookingApi.unassignArtist(bookingId, { artistId });
      toast.success('Artist unassigned');
      fetchBookings(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign artist');
    } finally {
      setAssigningBookingId(null);
    }
  };

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
  const getAssignedArtists = (booking) => {
    const entries = Array.isArray(booking.assignedArtists) ? booking.assignedArtists.filter((entry) => entry?.artist) : [];
    if (entries.length) return entries;
    if (booking.artist) return [{ artist: booking.artist, assignedAt: booking.assignment?.assignedAt, source: booking.assignment?.source }];
    return [];
  };

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
                      <th>Assigned Artists</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Assignment</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b._id}>
                        {(() => {
                          const assignedArtists = getAssignedArtists(b);
                          const assignedArtistIds = new Set(
                            assignedArtists.map((entry) => String(entry.artist?._id || entry.artist))
                          );
                          const availableArtists = approvedArtists.filter((artist) => !assignedArtistIds.has(String(artist._id)));

                          return (
                            <>
                        <td className="td-main">{b.user?.name || '-'}</td>
                        <td>{assignedArtists.map((entry) => entry.artist?.name).filter(Boolean).join(', ') || '-'}</td>
                        <td>{formatDate(b.eventDetails?.date)}</td>
                        <td>₹{(b.pricing?.agreedPrice ?? 0).toLocaleString('en-IN')}</td>
                        <td>{statusBadge(b.status)}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {assignedArtists.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {assignedArtists.map((entry) => (
                                  <span
                                    key={`${b._id}-${entry.artist?._id || entry.artist}`}
                                    style={{
                                      border: '1px solid var(--border)',
                                      borderRadius: 999,
                                      padding: '4px 8px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                    }}
                                  >
                                    {entry.artist?.name || 'Artist'}
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => handleUnassignArtist(b._id, entry.artist?._id || entry.artist)}
                                      disabled={assigningBookingId === b._id}
                                    >
                                      Remove
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <select
                                value={selectedArtistByBooking[b._id] || ''}
                                onChange={(e) => setSelectedArtistByBooking((prev) => ({ ...prev, [b._id]: e.target.value }))}
                              >
                                <option value="">Select artist</option>
                                {availableArtists.map((artist) => (
                                  <option key={artist._id} value={artist._id}>
                                    {artist.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAssignArtist(b._id)}
                                disabled={assigningBookingId === b._id || availableArtists.length === 0}
                              >
                                Add Artist
                              </button>
                            </div>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/bookings/${b._id}`)}
                            title="View"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                            </>
                          );
                        })()}
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
