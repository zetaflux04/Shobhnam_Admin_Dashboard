import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchCategories = () => {
    setLoading(true);
    api.get('/admin/categories/all')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Name is required');
      return;
    }
    api.post('/admin/categories', { name: newName.trim(), description: newDesc.trim() })
      .then(() => {
        toast.success('Category created');
        setModalOpen(false);
        setNewName('');
        setNewDesc('');
        fetchCategories();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const handleToggle = (id) => {
    api.patch(`/admin/categories/${id}/toggle`)
      .then(() => {
        toast.success('Category updated');
        fetchCategories();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const handleDelete = (id, name) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    api.delete(`/admin/categories/${id}`)
      .then(() => {
        toast.success('Category deleted');
        fetchCategories();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="ph-title">Categories</h1>
          <p className="ph-desc">Manage service categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
              <span>Loading...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <p>No categories yet</p>
              <button className="btn btn-primary" onClick={() => setModalOpen(true)}>Add first category</button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c._id}>
                      <td className="td-main">{c.name}</td>
                      <td>{c.description || '-'}</td>
                      <td>
                        <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className={`btn btn-sm ${c.isActive ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => handleToggle(c._id)}
                          >
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id, c.name)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Category</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramleela"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
