import { useEffect, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminBankVerificationApi } from '../services/api';

const statusOptions = ['PENDING', 'REJECTED', 'VERIFIED', 'NOT_SUBMITTED'];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN');
};

const maskAccountNumber = (value) => {
  const raw = String(value || '');
  if (raw.length <= 4) return raw || '-';
  return `${'*'.repeat(Math.max(raw.length - 4, 0))}${raw.slice(-4)}`;
};

export default function BankVerifications() {
  const [artists, setArtists] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  const fetchQueue = (page = 1) => {
    setLoading(true);
    adminBankVerificationApi
      .list({ page, limit: 10, search, status: statusFilter })
      .then((res) => {
        const data = res.data?.data || {};
        setArtists(data.artists || []);
        setPagination(data.pagination || {});
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load bank verifications');
        setArtists([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue(pagination.page);
  }, [pagination.page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchQueue(1);
  };

  const handleApprove = (artistId) => {
    adminBankVerificationApi
      .review(artistId, { status: 'VERIFIED' })
      .then(() => {
        toast.success('Bank verification approved');
        fetchQueue(pagination.page);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to approve'));
  };

  const handleReject = (artistId) => {
    const reason = window.prompt('Enter rejection reason');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    adminBankVerificationApi
      .review(artistId, { status: 'REJECTED', reason: reason.trim() })
      .then(() => {
        toast.success('Bank verification rejected');
        fetchQueue(pagination.page);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to reject'));
  };

  const statusBadge = (status) => {
    const map = {
      PENDING: 'badge-warning',
      VERIFIED: 'badge-success',
      REJECTED: 'badge-danger',
      NOT_SUBMITTED: 'badge-default',
    };
    return <span className={`badge ${map[status] || 'badge-default'}`}>{status}</span>;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="ph-title">Bank Verifications</h1>
          <p className="ph-desc">Review artist bank details for payouts</p>
        </div>
      </div>

      <form className="filters-row" onSubmit={handleSearch}>
        <div className="input-wrap" style={{ width: 280 }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input search-input"
            placeholder="Search by artist, phone, bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button type="submit" className="btn btn-primary">
          Search
        </button>
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
              <p>No bank verification records found</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Artist</th>
                      <th>Phone</th>
                      <th>Account holder</th>
                      <th>Bank</th>
                      <th>Account no.</th>
                      <th>IFSC</th>
                      <th>Submitted</th>
                      <th>PAN</th>
                      <th>Status</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artists.map((artist) => {
                      const bank = artist.bankDetails || {};
                      const verification = artist.bankVerification || {};
                      return (
                        <tr key={artist._id}>
                          <td className="td-main">{artist.name || '-'}</td>
                          <td>{artist.phone || '-'}</td>
                          <td>{bank.accountHolderName || '-'}</td>
                          <td>{bank.bankName || '-'}</td>
                          <td>{maskAccountNumber(bank.accountNumber)}</td>
                          <td>{bank.ifscCode || '-'}</td>
                          <td>{formatDate(verification.submittedAt)}</td>
                          <td>
                            {bank.panCardUrl ? (
                              <a href={bank.panCardUrl} target="_blank" rel="noreferrer">
                                View
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>{statusBadge(verification.status || 'NOT_SUBMITTED')}</td>
                          <td>{verification.rejectionReason || '-'}</td>
                          <td>
                            {verification.status === 'PENDING' ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-success btn-sm" onClick={() => handleApprove(artist._id)} title="Approve">
                                  <Check size={14} />
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleReject(artist._id)} title="Reject">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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
