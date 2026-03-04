import { useEffect, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = (page = 1) => {
    setLoading(true);
    api.get('/admin/users', { params: { page, limit: 10, search } })
      .then((res) => {
        const d = res.data.data;
        setUsers(d.users || []);
        setPagination(d.pagination || {});
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers(pagination.page);
  }, [pagination.page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchUsers(1);
  };

  const handleDelete = (id, name) => {
    if (!confirm(`Delete user "${name}"?`)) return;
    api.delete(`/admin/users/${id}`)
      .then(() => {
        toast.success('User deleted');
        fetchUsers(pagination.page);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to delete'));
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="ph-title">Users</h1>
          <p className="ph-desc">Manage platform users</p>
        </div>
      </div>

      <form className="filters-row" onSubmit={handleSearch}>
        <div className="input-wrap" style={{ width: 280 }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input search-input"
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
              <span>Loading...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>City</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td className="td-main">{u.name}</td>
                        <td>{u.phone}</td>
                        <td>{u.email || '-'}</td>
                        <td>{u.city || '-'}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(u._id, u.name)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span className="pagination-info">
                  Showing {users.length} of {pagination.totalCount}
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
