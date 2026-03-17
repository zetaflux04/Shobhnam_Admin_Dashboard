import { useEffect, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminOrderApi } from '../services/api';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 0 });
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = (page = 1) => {
    setLoading(true);
    adminOrderApi
      .list({ page, limit: 10, paymentStatus, search })
      .then((res) => {
        const d = res.data?.data || {};
        setOrders(d.orders || []);
        setPagination(d.pagination || {});
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders(pagination.page);
  }, [pagination.page, paymentStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchOrders(1);
  };

  const getPackages = (order) => {
    if (!Array.isArray(order.items) || order.items.length === 0) return '-';
    return order.items.map((item) => item.packageTitle).join(', ');
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="ph-title">Orders</h1>
          <p className="ph-desc">View all user orders and booked packages</p>
        </div>
      </div>

      <form className="filters-row" onSubmit={handleSearch}>
        <div className="input-wrap" style={{ width: 320 }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input search-input"
            placeholder="Search by service or package..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          <option value="">All payment status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
              <span>Loading...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <p>No orders found</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Packages</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td className="td-main">{order.user?.name || '-'}</td>
                        <td>{getPackages(order)}</td>
                        <td>{order.items?.length || 0}</td>
                        <td>₹{(order.grandTotal ?? 0).toLocaleString('en-IN')}</td>
                        <td>{order.paymentStatus || '-'}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/orders/${order._id}`)} title="View">
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
                  Showing {orders.length} of {pagination.totalCount}
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
