import React, { useState, useEffect } from 'react';
import { bookingAPI, userAPI, getFileUrl } from '../api';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [name, setName] = useState(user?.name?.split(' ')[0] || '');
  const [surname, setSurname] = useState(user?.name?.split(' ')[1] || '');
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => { bookingAPI.my().then(r => setBookings(r.data || [])); }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Отменить запись?')) return;
    await bookingAPI.cancel(id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await userAPI.updateProfile({ name: `${name} ${surname}`.trim() });
    setUser(prev => ({ ...prev, name: `${name} ${surname}`.trim() }));
    showMsg('Профиль сохранён');
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await userAPI.uploadAvatar(file);
      setUser(prev => ({ ...prev, avatar: res.data.avatar }));
      showMsg('Фото обновлено');
    } catch { showMsg('Ошибка загрузки', 'error'); }
  };

  const totalBookings = bookings.length;
  const upcoming = bookings.filter(b =>
    b.status === 'active' && new Date(b.workout?.starts_at) > new Date()
  ).length;
  const visited = bookings.filter(b => b.attended).length;

  const roleLabel = { client: 'Клиент', trainer: 'Тренер', admin: 'Администратор' };

  return (
    <div className="container page">
      <h1 className="page-title">Личный кабинет</h1>

      <div className="layout-sidebar">
        {/* Sidebar */}
        <div>
          <div className="card" style={{ textAlign: 'center', marginBottom: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div
                  className="avatar avatar-lg"
                  style={!user?.avatar ? { background: '#fff', border: '2px solid #e8e6e0' } : undefined}
                >
                  {user?.avatar ? <img src={getFileUrl(user.avatar)} alt="" /> : 'Фото'}
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{user?.name}</div>
            <div style={{ marginBottom: 12 }}>
              <span className={`badge badge-${user?.role}`}>{roleLabel[user?.role]}</span>
            </div>
          </div>

          <div className="sidebar">
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
              <span className="sidebar-item">Изменить фото</span>
            </label>
            <span className="sidebar-item active">Мои записи</span>
            <span className="sidebar-item" style={{ color: '#993c1d' }} onClick={() => { logout(); navigate('/register'); }}>Выйти</span>
          </div>
        </div>

        {/* Content */}
        <div>
          {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

            <div className="card">
              {/* Stats row (как в макете) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { value: totalBookings, label: 'Всего записей' },
                  { value: upcoming, label: 'Предстоящих' },
                  { value: visited, label: 'Посещено (отметка тренера)' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#f5f4f0', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Мои записи</h2>
              {bookings.length === 0 ? (
                <p style={{ color: '#888' }}>Записей пока нет</p>
              ) : (
                <div className="booking-list">
                  {bookings.map(b => {
                    const dt = new Date(b.workout?.starts_at);
                    const isPast = dt < new Date();
                    const statusLabel = b.status === 'cancelled'
                      ? 'Отменена'
                      : b.attended
                        ? 'Посещена'
                        : isPast
                          ? 'Прошла'
                          : 'Активна';
                    const statusClass = b.status === 'cancelled'
                      ? 'cancelled'
                      : b.attended
                        ? 'active'
                        : isPast
                          ? 'cancelled'
                          : 'active';

                    const datePart = dt.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
                    const timePart = dt.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', hour12: false });

                    const canCancel = b.status === 'active' && !isPast;

                    return (
                      <div key={b.id} className="booking-item">
                        <div className="booking-title">{b.workout?.title}</div>
                        <div className="booking-date">{`${datePart} ${timePart}`}</div>
                        <div>
                          <span className={`badge badge-${statusClass}`}>{statusLabel}</span>
                        </div>
                        <div className="booking-actions">
                          {canCancel ? (
                            <button className="btn btn-sm btn-danger" onClick={() => handleCancel(b.id)}>
                              Отменить
                            </button>
                          ) : (
                            <span className="booking-dash">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Редактировать профиль</h2>
              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Имя</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Анастасия" />
                  </div>
                  <div className="form-group">
                    <label>Фамилия</label>
                    <input value={surname} onChange={e => setSurname(e.target.value)} placeholder="Минеева" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Email</label>
                    <input value={user?.email} disabled />
                  </div>
                  <div className="form-group">
                    <label>Телефон</label>
                    <input placeholder="+7 999 123-45-67" />
                  </div>
                </div>
                <button className="btn" type="submit">Сохранить</button>
              </form>
            </div>
        </div>
      </div>

      <div className="page-footer">Контакты • © 2026 FitCenter</div>
    </div>
  );
}
