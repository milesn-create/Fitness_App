import React, { useState, useEffect } from 'react';
import { workoutAPI, userAPI, getFileUrl } from '../api';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TrainerProfile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [name, setName] = useState(user?.name?.split(' ')[0] || '');
  const [surname, setSurname] = useState(user?.name?.split(' ')[1] || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [experience, setExperience] = useState(user?.experience || '');
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    workoutAPI.list({ trainer_id: user.id }).then(r => setWorkouts(r.data || []));
  }, [user.id]);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const fullName = `${name} ${surname}`.trim();
    const res = await userAPI.updateProfile({
      name: fullName,
      bio,
      experience,
    });
    setUser(prev => ({ ...prev, ...res.data }));
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

  const totalWorkouts = workouts.length;
  const uniqueClients = new Set(
    workouts.flatMap(w =>
      (w.bookings || [])
        .filter(b => b.status === 'active')
        .map(b => b.user_id)
    )
  ).size;

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
              <span className="badge badge-trainer">Тренер</span>
            </div>
          </div>

          <div className="sidebar">
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
              <span className="sidebar-item">Изменить фото</span>
            </label>
            <span className="sidebar-item" style={{ color: '#993c1d' }} onClick={() => { logout(); navigate('/register'); }}>
              Выйти
            </span>
          </div>
        </div>

        <div>
          {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { value: totalWorkouts, label: 'Всего тренировок' },
                { value: uniqueClients, label: 'Записавшихся клиентов' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#f5f4f0', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Редактировать профиль</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Имя</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Анна" />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input value={surname} onChange={e => setSurname(e.target.value)} placeholder="Петрова" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Email</label>
                  <input value={user?.email} disabled />
                </div>
                <div className="form-group">
                  <label>Опыт</label>
                  <input
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    placeholder="8 лет"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>О себе</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Кратко расскажите о себе и специализации"
                  rows={4}
                  style={{ width: '100%', resize: 'vertical' }}
                />
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
