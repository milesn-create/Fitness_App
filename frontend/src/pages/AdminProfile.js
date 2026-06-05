import React, { useState, useEffect } from 'react';
import { adminAPI, userAPI, getFileUrl } from '../api';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminProfile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [name, setName] = useState(user?.name?.split(' ')[0] || '');
  const [surname, setSurname] = useState(user?.name?.split(' ')[1] || '');
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    adminAPI.stats().then(r => setStats(r.data));
  }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
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
    } catch {
      showMsg('Ошибка загрузки', 'error');
    }
  };

  return (
    <div className="container page">
      <h1 className="page-title">Личный кабинет</h1>

      <div className="layout-sidebar">
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
              <span className="badge badge-admin">Администратор</span>
            </div>
          </div>

          <div className="sidebar">
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
              <span className="sidebar-item">Изменить фото</span>
            </label>
            <span className="sidebar-item" onClick={() => navigate('/admin')}>Панель администратора</span>
            <span className="sidebar-item" style={{ color: '#993c1d' }} onClick={() => { logout(); navigate('/login'); }}>
              Выйти
            </span>
          </div>
        </div>

        <div>
          {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

          {stats && (
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 0 }}>
                {[
                  { value: stats.total_bookings, label: 'Всего записей' },
                  { value: stats.total_workouts, label: 'Тренировок' },
                  { value: stats.total_trainers, label: 'Тренеров' },
                  { value: stats.total_clients, label: 'Клиентов' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#f5f4f0', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Редактировать профиль</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Имя</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Глеб" />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input value={surname} onChange={e => setSurname(e.target.value)} placeholder="Тарнов" />
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
