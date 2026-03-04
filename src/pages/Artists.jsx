import { useEffect, useState } from 'react';
import { Check, Search, Trash2, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchArtists = (page = 1) => {
    setLoading(true);
    const params = { page, limit: 10, search };
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/artists', { params })
      .then((res) => {
        const d = res.data.data;
        setArtists(d.artists || []);
        setPagination(d.pagination || {});
      })
      .catch(() => setArtists([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchArtists(pagination.page);
  }, [pagination.page, search, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchArtists(1);
  };

  const handleApprove = (id) => {
    api.patch(`/admin/artists/${id}`, { status: 'APPROVED' })
      .then(() => {
        toast.success('Artist approved');
        fetchArtists(pagination.page);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const handleReject = (id) => {
    api.patch(`/admin/artists/${id}`, { status: 'REJECTED' })
      .then(() => {
        toast.success('Artist rejected');
        fetchArtists(pagination.page);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const handleDelete = (id, name) => {
    if (!confirm(`Delete artist "${name}"?`)) return;
    api.delete(`/admin/artists/${id}`)
      .then(() => {
        toast.success('Artist deleted');
        fetchArtists(pagination.page);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const statusBadge = (s) => {
    const map = { PENDING: 'badge-warning', APPROVED: 'badge-success', REJECTED: 'badge-danger' };
    return <span className={`badge ${map[s] || 'badge-default'}`}>{s}</span>;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="ph-title">Artists</h1>
          <p className="ph-desc">Manage artists and approvals</p>
        </div>
      </div>

      <form className="filters-row" onSubmit={handleSearch}>
        <div className="input-wrap" style={{ width: 240 }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input search-input"
            placeholder="Search by name, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
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
          ) : artists.length === 0 ? (
            <div className="empty-state">
              <p>No artists found</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Category</th>
                      <th>City</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artists.map((a) => (
                      <tr key={a._id}>
                        <td className="td-main">{a.name}</td>
                        <td>{a.phone}</td>
                        <td>{a.category || '-'}</td>
                        <td>{a.location?.city || '-'}</td>
                        <td>{statusBadge(a.status || 'PENDING')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {a.status !== 'APPROVED' && (
                              <button className="btn btn-success btn-sm" onClick={() => handleApprove(a._id)} title="Approve">
                                <Check size={14} />
                              </button>
                            )}
                            {a.status !== 'REJECTED' && (
                              <button className="btn btn-danger btn-sm" onClick={() => handleReject(a._id)} title="Reject">
                                <X size={14} />
                              </button>
                            )}
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a._id, a.name)} title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span className="pagination-info">
                  Showing {artists.length} of {pagination.totalCount}
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
