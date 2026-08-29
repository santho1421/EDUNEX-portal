import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getAllUsers, deleteUserAccount } from '../../api/admin';
import { useToast } from '../../contexts/ToastContext';

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers(filter === 'all' ? null : filter);
      setUsers(res || []);
    } catch (err) {
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to completely delete this user account and all their data?')) {
      try {
        await deleteUserAccount(id);
        toast.success('User deleted');
        loadUsers();
      } catch (err) {
        toast.error('Failed to delete user');
      }
    }
  };

  return (
    <DashboardLayout title="Manage Platform Users" subtitle="View and manage students, colleges, and industries">
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>All Users</button>
          <button className={`btn ${filter === 'student' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('student')}>Students</button>
          <button className={`btn ${filter === 'college' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('college')}>Colleges</button>
          <button className={`btn ${filter === 'industry' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('industry')}>Industries</button>
        </div>

        {loading ? <div>Loading users...</div> : users.length === 0 ? <p>No users found.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: 'var(--space-3)', color: 'var(--text-muted)' }}>Name</th>
                  <th style={{ padding: 'var(--space-3)', color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ padding: 'var(--space-3)', color: 'var(--text-muted)' }}>Role</th>
                  <th style={{ padding: 'var(--space-3)', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name || (u.first_name ? `${u.first_name} ${u.last_name || ''}` : 'Unnamed User')}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{u.email || <span style={{ color: 'var(--text-muted)' }}>No Email (Incomplete Profile)</span>}</td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span className={`badge ${u.role === 'student' ? 'badge-violet' : u.role === 'college' ? 'badge-success' : u.role === 'admin' ? 'badge-danger' : 'badge-muted'}`}>
                        {u.role || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <button onClick={() => handleDelete(u.id)} className="btn btn-danger btn-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
