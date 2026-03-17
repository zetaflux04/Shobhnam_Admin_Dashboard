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
  const [selectedArtistByItem, setSelectedArtistByItem] = useState({});
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

  const handleAssign = async (itemIndex) => {
    const artistId = selectedArtistByItem[itemIndex];
    if (!artistId) {
      toast.error('Select an artist first');
      return;
    }

    setUpdatingItemKey(`assign-${itemIndex}`);
    try {
      await adminOrderApi.assignArtistToItem(id, itemIndex, { artistId, note: 'Assigned from order details' });
      toast.success('Artist assigned to package');
      fetchOrder();
      setSelectedArtistByItem((prev) => ({ ...prev, [itemIndex]: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign artist');
    } finally {
      setUpdatingItemKey('');
    }
  };

  const handleUnassign = async (itemIndex) => {
    setUpdatingItemKey(`unassign-${itemIndex}`);
    try {
      await adminOrderApi.unassignArtistFromItem(id, itemIndex);
      toast.success('Artist unassigned');
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
                      <td>{item.artist?.name || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            value={selectedArtistByItem[itemIndex] || ''}
                            onChange={(e) => setSelectedArtistByItem((prev) => ({ ...prev, [itemIndex]: e.target.value }))}
                          >
                            <option value="">Select artist</option>
                            {approvedArtists.map((artist) => (
                              <option key={artist._id} value={artist._id}>
                                {artist.name}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={updatingItemKey === `assign-${itemIndex}`}
                            onClick={() => handleAssign(itemIndex)}
                          >
                            Assign
                          </button>
                          {item.artist && (
                            <button
                              className="btn btn-ghost btn-sm"
                              disabled={updatingItemKey === `unassign-${itemIndex}`}
                              onClick={() => handleUnassign(itemIndex)}
                            >
                              Unassign
                            </button>
                          )}
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
