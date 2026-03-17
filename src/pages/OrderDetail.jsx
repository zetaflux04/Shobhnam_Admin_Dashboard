import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminArtistApi, adminOrderApi } from '../services/api';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [approvedArtists, setApprovedArtists] = useState([]);
  const [selectedArtistIdsByItem, setSelectedArtistIdsByItem] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingItemKey, setUpdatingItemKey] = useState('');

  const fetchOrder = () => {
    setLoading(true);
    adminOrderApi
      .getById(id)
      .then((res) => setOrder(res.data?.data || null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    adminArtistApi
      .listApproved()
      .then((res) => setApprovedArtists(res.data?.data?.artists || []))
      .catch(() => setApprovedArtists([]));
  }, [id]);

  const getAssignedArtistsForItem = (item) => {
    const assigned = Array.isArray(item?.assignedArtists) ? item.assignedArtists : [];
    const hasLegacy = item?.artist && !assigned.some((entry) => String(entry?.artist?._id || entry?.artist) === String(item.artist?._id || item.artist));
    if (!hasLegacy) return assigned;

    return [{ artist: item.artist, assignment: item.assignment }, ...assigned];
  };

  const toggleArtistSelection = (itemIndex, artistId) => {
    setSelectedArtistIdsByItem((prev) => {
      const current = Array.isArray(prev[itemIndex]) ? prev[itemIndex] : [];
      const exists = current.includes(artistId);
      return {
        ...prev,
        [itemIndex]: exists ? current.filter((id) => id !== artistId) : [...current, artistId],
      };
    });
  };

  const handleAssign = async (itemIndex) => {
    const artistIds = selectedArtistIdsByItem[itemIndex] || [];
    if (!artistIds.length) {
      toast.error('Select at least one artist first');
      return;
    }

    setUpdatingItemKey(`assign-${itemIndex}`);
    try {
      await adminOrderApi.assignArtistToItem(id, itemIndex, {
        artistIds,
        note: 'Assigned from order details',
      });
      toast.success('Artist(s) assigned to package');
      fetchOrder();
      setSelectedArtistIdsByItem((prev) => ({ ...prev, [itemIndex]: [] }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign artist');
    } finally {
      setUpdatingItemKey('');
    }
  };

  const handleUnassign = async (itemIndex, artistId) => {
    setUpdatingItemKey(`unassign-${itemIndex}-${artistId || 'all'}`);
    try {
      await adminOrderApi.unassignArtistFromItem(id, itemIndex, artistId ? { artistId } : {});
      toast.success(artistId ? 'Artist unassigned' : 'All artists unassigned');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign artist');
    } finally {
      setUpdatingItemKey('');
    }
  };

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

  if (!order) {
    return (
      <div className="page-content">
        <p>Order not found</p>
        <button className="btn btn-ghost" onClick={() => navigate('/orders')}>Back to Orders</button>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')} style={{ marginBottom: 8 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="ph-title">Order Details</h1>
          <p className="ph-desc">ID: {order._id}</p>
        </div>
      </div>

      <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">User</div>
          </div>
          <div className="card-body">
            <div className="detail-item">
              <div className="detail-label">Name</div>
              <div className="detail-value">{order.user?.name || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Phone</div>
              <div className="detail-value">{order.user?.phone || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">{order.user?.email || '-'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Payment</div>
          </div>
          <div className="card-body">
            <div className="detail-item">
              <div className="detail-label">Status</div>
              <div className="detail-value">{order.paymentStatus || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Total Amount</div>
              <div className="detail-value">₹{(order.totalAmount ?? 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Grand Total</div>
              <div className="detail-value">₹{(order.grandTotal ?? 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="card-title">Booked Packages</div>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Package</th>
                    <th>Date</th>
                    <th>Slot</th>
                    <th>Amount</th>
                    <th>Assigned Artist</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, itemIndex) => (
                    <tr key={`${order._id}-${itemIndex}`}>
                      <td className="td-main">{item.serviceName || '-'}</td>
                      <td>{item.packageTitle || '-'}</td>
                      <td>{item.date ? new Date(item.date).toLocaleDateString('en-IN') : '-'}</td>
                      <td>{item.slot || '-'}</td>
                      <td>₹{(item.price ?? 0).toLocaleString('en-IN')}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {getAssignedArtistsForItem(item).map((entry) => {
                            const assignedArtist = entry?.artist;
                            const assignedArtistId = assignedArtist?._id || assignedArtist;
                            return (
                              <span
                                key={`${order._id}-${itemIndex}-${assignedArtistId}`}
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  border: '1px solid #d0d7de',
                                  fontSize: 12,
                                  backgroundColor: '#f8fafc',
                                }}
                              >
                                {assignedArtist?.name || 'Assigned artist'}
                              </span>
                            );
                          })}
                          {getAssignedArtistsForItem(item).length === 0 && <span>-</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                            {approvedArtists.map((artist) => {
                              const assignedIds = getAssignedArtistsForItem(item).map((entry) =>
                                String(entry?.artist?._id || entry?.artist)
                              );
                              const isAlreadyAssigned = assignedIds.includes(String(artist._id));
                              const isSelected = (selectedArtistIdsByItem[itemIndex] || []).includes(artist._id);

                              return (
                                <label
                                  key={artist._id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    opacity: isAlreadyAssigned ? 0.55 : 1,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isAlreadyAssigned}
                                    onChange={() => toggleArtistSelection(itemIndex, artist._id)}
                                  />
                                  <span>{artist.name}</span>
                                </label>
                              );
                            })}
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={updatingItemKey === `assign-${itemIndex}`}
                            onClick={() => handleAssign(itemIndex)}
                          >
                            Assign Selected
                          </button>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {getAssignedArtistsForItem(item).map((entry) => {
                              const assignedArtist = entry?.artist;
                              const assignedArtistId = assignedArtist?._id || assignedArtist;
                              return (
                                <button
                                  key={`remove-${order._id}-${itemIndex}-${assignedArtistId}`}
                                  className="btn btn-ghost btn-sm"
                                  disabled={updatingItemKey === `unassign-${itemIndex}-${assignedArtistId}`}
                                  onClick={() => handleUnassign(itemIndex, assignedArtistId)}
                                >
                                  Remove {assignedArtist?.name || 'artist'}
                                </button>
                              );
                            })}
                            {getAssignedArtistsForItem(item).length > 1 && (
                              <button
                                className="btn btn-ghost btn-sm"
                                disabled={updatingItemKey === `unassign-${itemIndex}-all`}
                                onClick={() => handleUnassign(itemIndex)}
                              >
                                Unassign all
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
