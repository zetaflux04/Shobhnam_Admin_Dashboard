import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const fetchReviews = (page = 1) => {
    setLoading(true);
    api.get('/admin/reviews', { params: { page, limit: 10 } })
      .then((res) => {
        const d = res.data.data;
        setReviews(d.reviews || []);
        setPagination(d.pagination || {});
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews(pagination.page);
  }, [pagination.page]);

  const handleDelete = (id) => {
    if (!confirm('Delete this review?')) return;
    api.delete(`/admin/reviews/${id}`)
      .then(() => {
        toast.success('Review deleted');
        fetchReviews(pagination.page);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const Stars = ({ rating }) => (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} className={i <= rating ? 'star' : 'star star-empty'} />
      ))}
    </div>
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="ph-title">Reviews</h1>
          <p className="ph-desc">Manage user reviews</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
              <span>Loading...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="empty-state">
              <Star size={48} />
              <p>No reviews yet</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Artist</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r._id}>
                        <td className="td-main">{r.user?.name || '-'}</td>
                        <td>{r.artist?.name || '-'}</td>
                        <td><Stars rating={r.rating} /></td>
                        <td style={{ maxWidth: 200 }}>{r.comment || '-'}</td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>
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
                  Showing {reviews.length} of {pagination.totalCount}
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
