import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Loader2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const genderOptions = ['Male', 'Female', 'Other'];
const expertiseOptions = ['Ramleela artist', 'Classical singer', 'Instrumentalist'];
const ramleelaCharacters = ['Ram', 'Sita', 'Hanuman', 'Laxman'];
const experienceOptions = ['1 year', '3 years', '5 years', '10 years', '15 years'];

const UPLOAD_TIMEOUT = 120000;

export default function Artists() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const [artists, setArtists] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [loading, setLoading] = useState(true);

  // Create artist modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [expertise, setExpertise] = useState('');
  const [character, setCharacter] = useState('');
  const [experience, setExperience] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const [profilePhotoError, setProfilePhotoError] = useState(null);
  const [aadharCardUrl, setAadharCardUrl] = useState('');
  const [aadharCardFile, setAadharCardFile] = useState(null);
  const [uploadingAadharCard, setUploadingAadharCard] = useState(false);
  const [aadharCardError, setAadharCardError] = useState(null);
  const [serviceLocation, setServiceLocation] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    const status = searchParams.get('status');
    if (status && statusFilter !== status) setStatusFilter(status);
  }, [searchParams]);

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

  const requireCharacter = expertise.toLowerCase().includes('ramleela');
  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      phone.trim().length >= 10 &&
      gender &&
      expertise &&
      experience &&
      serviceLocation.trim().length > 0 &&
      profilePhotoUrl &&
      aadharCardUrl &&
      (!requireCharacter || character) &&
      !submitting
    );
  }, [fullName, phone, gender, expertise, experience, serviceLocation, profilePhotoUrl, aadharCardUrl, requireCharacter, character, submitting]);

  const resetModal = () => {
    setFullName('');
    setPhone('');
    setGender('');
    setExpertise('');
    setCharacter('');
    setExperience('');
    setProfilePhotoUrl('');
    setProfilePhotoFile(null);
    setProfilePhotoError(null);
    setAadharCardUrl('');
    setAadharCardFile(null);
    setAadharCardError(null);
    setServiceLocation('');
    setYoutubeLink('');
    setModalOpen(false);
  };

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoFile(file);
    setProfilePhotoError(null);
    setUploadingProfilePhoto(true);
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);
      const res = await api.post('/admin/upload-artist-profile-photo', formData, { timeout: UPLOAD_TIMEOUT });
      const url = res.data?.data?.fileSavedUrl;
      if (url) setProfilePhotoUrl(url);
    } catch (err) {
      setProfilePhotoError(err.response?.data?.message || 'Upload failed');
      setProfilePhotoUrl('');
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  const handleAadharChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAadharCardFile(file);
    setAadharCardError(null);
    setUploadingAadharCard(true);
    try {
      const formData = new FormData();
      formData.append('aadharCard', file);
      const res = await api.post('/admin/upload-artist-aadhar', formData, { timeout: UPLOAD_TIMEOUT });
      const url = res.data?.data?.fileSavedUrl;
      if (url) setAadharCardUrl(url);
    } catch (err) {
      setAadharCardError(err.response?.data?.message || 'Upload failed');
      setAadharCardUrl('');
    } finally {
      setUploadingAadharCard(false);
    }
  };

  const handleCreateArtist = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    api.post('/admin/artists', {
      fullName: fullName.trim(),
      phone: phone.trim(),
      gender,
      expertise,
      experience,
      ramleelaCharacter: requireCharacter ? character : undefined,
      serviceLocation: serviceLocation.trim(),
      youtubeLink: youtubeLink.trim() || undefined,
      profilePhoto: profilePhotoUrl,
      aadharCard: aadharCardUrl,
    })
      .then(() => {
        toast.success('Artist created');
        resetModal();
        fetchArtists(pagination.page);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to create artist'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="ph-title">Artists</h1>
          <p className="ph-desc">Manage artists and approvals</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Add Artist
        </button>
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
        <select value={statusFilter} onChange={(e) => {
          const v = e.target.value;
          setStatusFilter(v);
          setSearchParams(v ? { status: v } : {});
        }}>
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

      {modalOpen && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal modal-create-artist" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2 className="modal-title">Create Artist</h2>
              <button className="modal-close" onClick={resetModal}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleCreateArtist}>
              <div className="form-group">
                <label>Full name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10+ digits"
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                  <option value="">Select gender</option>
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Expertise *</label>
                <select
                  value={expertise}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExpertise(v);
                    if (!v.toLowerCase().includes('ramleela')) setCharacter('');
                  }}
                  required
                >
                  <option value="">Select expertise</option>
                  {expertiseOptions.map((ex) => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>
              {requireCharacter && (
                <div className="form-group">
                  <label>Ramleela character *</label>
                  <select value={character} onChange={(e) => setCharacter(e.target.value)} required>
                    <option value="">Select character</option>
                    {ramleelaCharacters.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Experience *</label>
                <select value={experience} onChange={(e) => setExperience(e.target.value)} required>
                  <option value="">Select experience</option>
                  {experienceOptions.map((ex) => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Profile photo *</label>
                <div className="file-upload-wrap">
                  <input
                    type="file"
                    id="profilePhoto"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    disabled={uploadingProfilePhoto}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="profilePhoto" className={`file-upload-btn ${profilePhotoUrl ? 'uploaded' : ''} ${profilePhotoError ? 'error' : ''}`}>
                    {uploadingProfilePhoto ? (
                      <><Loader2 size={16} className="spin" /> Uploading...</>
                    ) : profilePhotoUrl ? (
                      <><Check size={16} /> {profilePhotoFile?.name || 'Uploaded'}</>
                    ) : (
                      <><Upload size={16} /> Choose image</>
                    )}
                  </label>
                  {profilePhotoError && <span className="file-upload-error">{profilePhotoError}</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Aadhar card *</label>
                <div className="file-upload-wrap">
                  <input
                    type="file"
                    id="aadharCard"
                    accept="image/*,application/pdf"
                    onChange={handleAadharChange}
                    disabled={uploadingAadharCard}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="aadharCard" className={`file-upload-btn ${aadharCardUrl ? 'uploaded' : ''} ${aadharCardError ? 'error' : ''}`}>
                    {uploadingAadharCard ? (
                      <><Loader2 size={16} className="spin" /> Uploading...</>
                    ) : aadharCardUrl ? (
                      <><Check size={16} /> {aadharCardFile?.name || 'Uploaded'}</>
                    ) : (
                      <><Upload size={16} /> Choose image or PDF</>
                    )}
                  </label>
                  {aadharCardError && <span className="file-upload-error">{aadharCardError}</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Service location *</label>
                <input
                  type="text"
                  value={serviceLocation}
                  onChange={(e) => setServiceLocation(e.target.value)}
                  placeholder="e.g. City or address"
                  required
                />
              </div>
              <div className="form-group">
                <label>YouTube link (optional)</label>
                <input
                  type="text"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={resetModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                  {submitting ? <><Loader2 size={16} className="spin" /> Creating...</> : 'Create Artist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
