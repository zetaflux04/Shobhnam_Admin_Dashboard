import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CalendarCheck, IndianRupee, Landmark, Music2, Users, UserCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentBookings = data?.recentBookings || [];
  const bookingTrend = data?.bookingTrend || [];

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, color: 'var(--info)', iconBg: 'rgba(59,130,246,0.12)' },
    { label: 'Total Artists', value: stats.totalArtists ?? 0, icon: Music2, color: 'var(--accent)', iconBg: 'var(--accent-glow)' },
    { label: 'Pending Applications', value: stats.pendingArtistsCount ?? 0, icon: UserCheck, color: 'var(--warning)', iconBg: 'rgba(245,158,11,0.12)', to: '/artists?status=PENDING' },
    { label: 'Pending Bank Verifications', value: stats.pendingBankVerificationsCount ?? 0, icon: Landmark, color: 'var(--warning)', iconBg: 'rgba(245,158,11,0.12)', to: '/bank-verifications' },
    { label: 'Live Artists', value: stats.liveArtistsCount ?? 0, icon: UserCheck, color: 'var(--success)', iconBg: 'rgba(16,185,129,0.12)', to: '/artists?status=APPROVED' },
    { label: 'Total Bookings', value: stats.totalBookings ?? 0, icon: CalendarCheck, color: 'var(--success)', iconBg: 'rgba(16,185,129,0.12)' },
    { label: 'Total Revenue', value: `₹${(stats.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'var(--warning)', iconBg: 'rgba(245,158,11,0.12)' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="ph-title">Dashboard</h1>
          <p className="ph-desc">Overview of your platform</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, color, iconBg, to }) => {
          const content = (
            <>
              <div className="stat-icon" style={{ '--icon-bg': iconBg, '--icon-color': color }}>
                <Icon size={22} />
              </div>
              <div className="stat-info">
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
              </div>
            </>
          );
          const Wrapper = to ? Link : 'div';
          const wrapperProps = to ? { to, className: 'stat-card-link' } : { style: { display: 'contents' } };
          return (
            <div key={label} className="stat-card" style={{ '--accent-color': color }}>
              <Wrapper {...wrapperProps}>{content}</Wrapper>
            </div>
          );
        })}
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Booking Trend (Last 7 Days)</div>
              <div className="card-subtitle">Daily bookings</div>
            </div>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            {bookingTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bookingTrend}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--accent)" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <BarChart3 size={48} />
                <p>No booking data yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Bookings</div>
              <div className="card-subtitle">Latest 5</div>
            </div>
          </div>
          <div className="card-body">
            {recentBookings.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Artist</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b._id}>
                        <td className="td-main">{b.user?.name || '-'}</td>
                        <td>{b.artist?.name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <CalendarCheck size={40} />
                <p>No recent bookings</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
