import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { adminArtistApi, adminBookingApi } from '../services/api';
import toast from 'react-hot-toast';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvedArtists, setApprovedArtists] = useState([]);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const getAssignedArtists = (bookingData) => {
    const entries = Array.isArray(bookingData?.assignedArtists) ? bookingData.assignedArtists.filter((entry) => entry?.artist) : [];
    if (entries.length) return entries;
    if (bookingData?.artist) return [{ artist: bookingData.artist, assignedAt: bookingData.assignment?.assignedAt, source: bookingData.assignment?.source }];
    return [];
  };

  const fetchBooking = () => {
    setLoading(true);
    api.get(`/admin/bookings/${id}`)
      .then((res) => setBooking(res.data.data))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBooking();
    adminArtistApi.listApproved()
      .then((res) => setApprovedArtists(res.data?.data?.artists || []))
      .catch(() => setApprovedArtists([]));
  }, [id]);

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-center">
          <div className="spinner" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="page-content">
        <p>Booking not found</p>
        <button className="btn btn-ghost" onClick={() => navigate('/bookings')}>Back to Bookings</button>
      </div>
    );
  }

  const statusBadge = (s) => {
    const map = { PENDING: 'badge-warning', CONFIRMED: 'badge-info', COMPLETED: 'badge-success', CANCELLED: 'badge-danger', REJECTED: 'badge-danger' };
    return <span className={`badge ${map[s] || 'badge-default'}`}>{s}</span>;
  };

  const handleAssignArtist = async () => {
    if (!selectedArtistId) {
      toast.error('Select an artist first');
      return;
    }
    setAssigning(true);
    try {
      await adminBookingApi.assignArtist(id, {
        artistId: selectedArtistId,
        note: 'Assigned from booking details',
      });
      toast.success('Artist assigned');
      fetchBooking();
      setSelectedArtistId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign artist');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignArtist = async () => {
    if (!booking?.artist?._id) return;
    setAssigning(true);
    try {
      await adminBookingApi.unassignArtist(id, { artistId: booking.artist._id });
      toast.success('Artist unassigned');
      fetchBooking();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign artist');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignSpecificArtist = async (artistId) => {
    if (!artistId) return;
    setAssigning(true);
    try {
      await adminBookingApi.unassignArtist(id, { artistId });
      toast.success('Artist unassigned');
      fetchBooking();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign artist');
    } finally {
      setAssigning(false);
    }
  };

  const assignedArtists = getAssignedArtists(booking);
  const assignedArtistIds = new Set(assignedArtists.map((entry) => String(entry.artist?._id || entry.artist)));
  const availableArtists = approvedArtists.filter((artist) => !assignedArtistIds.has(String(artist._id)));

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bookings')} style={{ marginBottom: 8 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="ph-title">Booking Details</h1>
          <p className="ph-desc">ID: {booking._id}</p>
        </div>
        <div>{statusBadge(booking.status)}</div>
      </div>

      <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">User</div>
          </div>
          <div className="card-body">
            <div className="detail-item">
              <div className="detail-label">Name</div>
              <div className="detail-value">{booking.user?.name || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Phone</div>
              <div className="detail-value">{booking.user?.phone || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">{booking.user?.email || '-'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Artist</div>
          </div>
          <div className="card-body">
            <div className="detail-item">
              <div className="detail-label">Primary Artist</div>
              <div className="detail-value">{booking.artist?.name || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Location</div>
              <div className="detail-value">{booking.artist?.location?.city || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Assigned At</div>
              <div className="detail-value">
                {booking.assignment?.assignedAt
                  ? new Date(booking.assignment.assignedAt).toLocaleString('en-IN')
                  : '-'}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Assignment Source</div>
              <div className="detail-value">{booking.assignment?.source || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Assigned Artists</div>
              <div className="detail-value">
                {assignedArtists.length === 0 ? (
                  '-'
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {assignedArtists.map((entry) => (
                      <div
                        key={entry.artist?._id || entry.artist}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div>{entry.artist?.name || 'Artist'}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>{entry.artist?.phone || ''}</div>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleUnassignSpecificArtist(entry.artist?._id || entry.artist)}
                          disabled={assigning}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <select value={selectedArtistId} onChange={(e) => setSelectedArtistId(e.target.value)}>
                <option value="">Select approved artist</option>
                {availableArtists.map((artist) => (
                  <option key={artist._id} value={artist._id}>
                    {artist.name} ({artist.phone})
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleAssignArtist} disabled={assigning || availableArtists.length === 0}>
                  Add Artist
                </button>
                {booking.artist && (
                  <button className="btn btn-ghost btn-sm" onClick={handleUnassignArtist} disabled={assigning}>
                    Unassign Primary
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Event Details</div>
          </div>
          <div className="card-body">
            <div className="detail-item">
              <div className="detail-label">Date</div>
              <div className="detail-value">{booking.eventDetails?.date ? new Date(booking.eventDetails.date).toLocaleString('en-IN') : '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Type</div>
              <div className="detail-value">{booking.eventDetails?.type || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Audience Size</div>
              <div className="detail-value">{booking.eventDetails?.expectedAudienceSize || '-'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Location & Pricing</div>
          </div>
          <div className="card-body">
            <div className="detail-item">
              <div className="detail-label">Address</div>
              <div className="detail-value">{booking.location?.address || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">City</div>
              <div className="detail-value">{booking.location?.city || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Amount</div>
              <div className="detail-value">₹{(booking.pricing?.agreedPrice ?? 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
