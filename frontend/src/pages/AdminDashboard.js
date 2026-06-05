import React, { useState, useEffect } from 'react';
import { adminAPI, workoutAPI } from '../api';
import { useAuth } from '../AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import { mapAuthError } from '../errors';

const roleLabel = { client: 'Клиент', trainer: 'Тренер', admin: 'Администратор' };

const localDateKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const emptyNewUser = () => ({
  firstName: '',
  surname: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'client',
});

const todayDatetimeLocal = new Date().toISOString().slice(0, 16);

const emptyWorkoutForm = () => ({
  title: '',
  description: '',
  starts_at: '',
  duration: 60,
  capacity: 12,
  trainer_id: '',
  photoFile: null,
});

const toDatetimeLocalValue = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [filterRole, setFilterRole] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState(null);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [workoutForm, setWorkoutForm] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const trainers = users.filter(u => u.role === 'trainer');

  const tab = location.pathname === '/admin/users' ? 'users'
    : location.pathname === '/admin/workouts' ? 'workouts'
    : location.pathname === '/admin/schedule' ? 'schedule'
    : location.pathname === '/admin/stats' ? 'stats'
    : 'dashboard';

  const loadData = () => {
    adminAPI.stats().then(r => setStats(r.data));
    adminAPI.users().then(r => setUsers(r.data || []));
    workoutAPI.list({ include_past: 'true' }).then(r => setWorkouts(r.data || []));
  };

  useEffect(() => { loadData(); }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.updateUser(editUser.id, {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
      });
      setUsers(prev => prev.map(u => u.id === editUser.id ? res.data : u));
      setEditUser(null);
      showMsg('Пользователь обновлён');
    } catch (err) {
      showMsg(mapAuthError(err, 'Не удалось обновить пользователя'), 'error');
    }
  };

  const handleDelete = async (id, role) => {
    const extra = role === 'trainer'
      ? ' Также будут удалены все тренировки этого тренера и связанные записи.'
      : '';
    if (!window.confirm(`Удалить пользователя?${extra}`)) return;
    try {
      await adminAPI.deleteUser(id);
      setUsers(prev => prev.filter(u => String(u.id) !== String(id)));
      loadData();
      showMsg('Пользователь удалён');
    } catch (err) {
      showMsg(err.response?.data?.error || 'Не удалось удалить пользователя', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newUser.password !== newUser.confirmPassword) {
      showMsg('Пароли не совпадают', 'error');
      return;
    }
    if (newUser.password.length < 8) {
      showMsg('Пароль должен быть не короче 8 символов', 'error');
      return;
    }
    try {
      const res = await adminAPI.createUser({
        name: `${newUser.firstName} ${newUser.surname}`.trim(),
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });
      setUsers(prev => [res.data, ...prev]);
      setNewUser(null);
      showMsg('Пользователь создан');
    } catch (err) {
      showMsg(mapAuthError(err, 'Ошибка создания пользователя'), 'error');
    }
  };

  const exportUsers = (list) => {
    const headers = ['Имя', 'Email', 'Роль', 'Регистрация'];
    const rows = list.map(u => [
      u.name,
      u.email,
      roleLabel[u.role] || u.role,
      new Date(u.created_at).toLocaleDateString('ru'),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fitcenter_users_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showMsg('Экспорт выполнен');
  };

  const filteredUsers = filterRole ? users.filter(u => u.role === filterRole) : users;

  const resetWorkoutForm = () => {
    setEditingWorkoutId(null);
    setWorkoutForm(null);
  };

  const startNewWorkout = () => {
    setEditingWorkoutId(null);
    setWorkoutForm({
      ...emptyWorkoutForm(),
      trainer_id: trainers[0]?.id || '',
    });
    navigate('/admin/workouts');
  };

  const startEditWorkout = (w) => {
    setEditingWorkoutId(w.id);
    setWorkoutForm({
      title: w.title,
      description: w.description || '',
      starts_at: toDatetimeLocalValue(w.starts_at),
      duration: w.duration,
      capacity: w.capacity,
      trainer_id: w.trainer_id || w.trainer?.id || '',
      photoFile: null,
    });
    navigate('/admin/workouts');
  };

  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    if (!workoutForm.trainer_id) {
      showMsg('Выберите тренера', 'error');
      return;
    }
    if (new Date(workoutForm.starts_at) < new Date()) {
      showMsg('Нельзя указать дату и время в прошлом', 'error');
      return;
    }
    try {
      const data = {
        title: workoutForm.title,
        description: workoutForm.description,
        starts_at: new Date(workoutForm.starts_at).toISOString(),
        duration: +workoutForm.duration,
        capacity: +workoutForm.capacity,
        trainer_id: workoutForm.trainer_id,
      };
      let workoutId = editingWorkoutId;
      if (editingWorkoutId) {
        await workoutAPI.update(editingWorkoutId, data);
        showMsg('Тренировка обновлена');
      } else {
        const res = await workoutAPI.create(data);
        workoutId = res.data?.id;
        showMsg('Тренировка создана');
      }
      if (workoutForm.photoFile && workoutId) {
        await workoutAPI.uploadPhoto(workoutId, workoutForm.photoFile);
      }
      resetWorkoutForm();
      loadData();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Ошибка сохранения тренировки', 'error');
    }
  };

  const scheduleWorkouts = workouts
    .filter(w => {
      if (!scheduleDate) return new Date(w.starts_at) >= new Date();
      return localDateKey(w.starts_at) === scheduleDate;
    })
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

  const UsersTable = ({ list, showDelete = true }) => (
    <table className="table">
      <thead>
        <tr><th>Имя</th><th>Email</th><th>Роль</th><th>Регистрация</th><th>Действия</th></tr>
      </thead>
      <tbody>
        {list.length === 0 ? (
          <tr><td colSpan={5} style={{ color: '#888', textAlign: 'center', padding: 24 }}>Пользователей не найдено</td></tr>
        ) : list.map(u => (
          <tr key={u.id}>
            <td style={{ fontWeight: 500 }}>{u.name}</td>
            <td style={{ color: '#666' }}>{u.email}</td>
            <td><span className={`badge badge-${u.role}`}>{roleLabel[u.role]}</span></td>
            <td style={{ color: '#666', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString('ru')}</td>
            <td>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm" onClick={() => setEditUser(u)}>Изм.</button>
                {showDelete && String(u.id) !== String(user?.id) && (
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id, u.role)}>Удалить</button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="container page">
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="layout-sidebar">
        <div className="sidebar">
          <span className={`sidebar-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('/admin')}>Дашборд</span>
          <span className={`sidebar-item ${tab === 'workouts' ? 'active' : ''}`} onClick={() => navigate('/admin/workouts')}>Тренировки</span>
          <span className={`sidebar-item ${tab === 'users' ? 'active' : ''}`} onClick={() => navigate('/admin/users')}>Пользователи</span>
          <span className={`sidebar-item ${tab === 'schedule' ? 'active' : ''}`} onClick={() => navigate('/admin/schedule')}>Расписание</span>
          <span className={`sidebar-item ${tab === 'stats' ? 'active' : ''}`} onClick={() => navigate('/admin/stats')}>Статистика</span>
          <span className="sidebar-item" style={{ color: '#993c1d' }} onClick={() => { logout(); navigate('/login'); }}>Выйти</span>
        </div>

        <div>
          {newUser && (
            <form onSubmit={handleCreateUser} className="card" style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Новый пользователь</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Имя</label>
                  <input value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} placeholder="Анастасия" required />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input value={newUser.surname} onChange={e => setNewUser({ ...newUser, surname: e.target.value })} placeholder="Минеева" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="you@example.com" required />
                </div>
                <div className="form-group">
                  <label>Роль</label>
                  <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                    <option value="client">Клиент</option>
                    <option value="trainer">Тренер</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Пароль</label>
                  <PasswordInput
                    value={newUser.password}
                    minLength={8}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Минимум 8 символов"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Повторите пароль</label>
                  <PasswordInput
                    value={newUser.confirmPassword}
                    onChange={e => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn" type="submit">Создать</button>
                <button className="btn" type="button" onClick={() => setNewUser(null)}>Отмена</button>
              </div>
            </form>
          )}

          {editUser && (
            <form onSubmit={handleUpdate} style={{ background: '#f5f4f0', padding: 16, borderRadius: 10, marginBottom: 16, border: '1px solid #e8e6e0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Имя</label>
                  <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Email</label>
                  <input type="email" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Роль</label>
                  <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                    <option value="client">Клиент</option>
                    <option value="trainer">Тренер</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm" type="submit">Сохранить</button>
                  <button className="btn btn-sm" type="button" onClick={() => setEditUser(null)}>Отмена</button>
                </div>
              </div>
            </form>
          )}

          {tab === 'dashboard' && stats && (
            <>
              <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Дашборд</h2>
              <div className="stats-grid">
                {[
                  { value: stats.total_bookings, label: 'Всего записей' },
                  { value: stats.total_workouts, label: 'Тренировок' },
                  { value: stats.total_trainers, label: 'Тренеров' },
                  { value: stats.total_clients, label: 'Клиентов' },
                ].map((s, i) => (
                  <div key={i} className="stat-card">
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600 }}>Управление пользователями</h2>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-sm" onClick={() => { navigate('/admin/users'); setNewUser(emptyNewUser()); }}>+ Добавить пользователя</button>
                    <button className="btn btn-sm" onClick={() => navigate('/admin/users')}>Фильтр по роли</button>
                    <button className="btn btn-sm" onClick={() => exportUsers(users)}>Экспорт</button>
                  </div>
                </div>
                <UsersTable list={users.slice(0, 5)} showDelete={false} />
              </div>
            </>
          )}

          {tab === 'workouts' && workoutForm && (
            <form onSubmit={handleWorkoutSubmit} className="card" style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>
                {editingWorkoutId ? 'Редактировать тренировку' : 'Новая тренировка'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Название</label>
                  <input value={workoutForm.title} onChange={e => setWorkoutForm({ ...workoutForm, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Тренер</label>
                  <select value={workoutForm.trainer_id} onChange={e => setWorkoutForm({ ...workoutForm, trainer_id: e.target.value })} required>
                    <option value="">Выберите тренера</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Дата и время</label>
                  <input
                    type="datetime-local"
                    value={workoutForm.starts_at}
                    min={todayDatetimeLocal}
                    onChange={e => setWorkoutForm({ ...workoutForm, starts_at: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Длительность (мин)</label>
                  <input type="number" min={15} value={workoutForm.duration}
                    onChange={e => setWorkoutForm({ ...workoutForm, duration: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Мест всего</label>
                  <input type="number" min={1} value={workoutForm.capacity}
                    onChange={e => setWorkoutForm({ ...workoutForm, capacity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Фото</label>
                  <input type="file" accept="image/*"
                    onChange={e => setWorkoutForm({ ...workoutForm, photoFile: e.target.files[0] })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Описание</label>
                  <input value={workoutForm.description}
                    onChange={e => setWorkoutForm({ ...workoutForm, description: e.target.value })} placeholder="Краткое описание" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn">Сохранить</button>
                <button type="button" className="btn" onClick={resetWorkoutForm}>Отмена</button>
              </div>
            </form>
          )}

          {tab === 'workouts' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 17, fontWeight: 600 }}>Все тренировки</h2>
                <button type="button" className="btn btn-sm" onClick={startNewWorkout} disabled={trainers.length === 0}>
                  + Добавить тренировку
                </button>
              </div>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
                Создание, редактирование и удаление тренировок любого тренера.
              </p>
              {trainers.length === 0 && (
                <p style={{ color: '#993c1d', fontSize: 13, marginBottom: 12 }}>Сначала добавьте тренера в разделе «Пользователи».</p>
              )}
              {workouts.length === 0 ? (
                <p style={{ color: '#888' }}>Тренировок пока нет</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Название</th><th>Тренер</th><th>Дата и время</th><th>Записано</th><th>Статус</th><th></th></tr>
                  </thead>
                  <tbody>
                    {workouts.map(w => {
                      const active = (w.bookings || []).filter(b => b.status === 'active').length;
                      const isFull = active >= w.capacity;
                      const isPast = new Date(w.starts_at) < new Date();
                      const bookedCount = Math.min(active, w.capacity);
                      const freeCount = Math.max(0, w.capacity - bookedCount);
                      return (
                        <tr key={w.id}>
                          <td style={{ fontWeight: 500 }}>{w.title}</td>
                          <td>{w.trainer?.name || '—'}</td>
                          <td style={{ color: '#666', fontSize: 13 }}>
                            {new Date(w.starts_at).toLocaleString('ru', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', hour12: false,
                            })}
                          </td>
                          <td>
                            Занято {bookedCount}/{w.capacity}
                            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Свободно {freeCount}</div>
                          </td>
                          <td>
                            <span className={`badge ${isPast ? 'badge-cancelled' : isFull ? 'badge-full' : 'badge-open'}`}>
                              {isPast ? 'Прошла' : isFull ? 'Мест нет' : 'Открыта'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button type="button" className="btn btn-sm" onClick={() => startEditWorkout(w)}>
                                Изм.
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={async () => {
                                  if (!window.confirm(`Удалить тренировку «${w.title}»?`)) return;
                                  try {
                                    await workoutAPI.delete(w.id);
                                    showMsg('Тренировка удалена');
                                    loadData();
                                  } catch (err) {
                                    showMsg(err.response?.data?.error || 'Не удалось удалить', 'error');
                                  }
                                }}
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'users' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 17, fontWeight: 600 }}>Пользователи</h2>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-sm" onClick={() => setNewUser(emptyNewUser())}>+ Добавить пользователя</button>
                  <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14 }}>
                    <option value="">Все роли</option>
                    <option value="client">Клиенты</option>
                    <option value="trainer">Тренеры</option>
                    <option value="admin">Администраторы</option>
                  </select>
                  <button className="btn btn-sm" onClick={() => exportUsers(filteredUsers)}>Экспорт</button>
                </div>
              </div>
              <UsersTable list={filteredUsers} />
            </div>
          )}

          {tab === 'schedule' && (
            <div className="card">
              <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Расписание центра</h2>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
                Предстоящие тренировки всех тренеров — для контроля загрузки и планирования.
              </p>
              <div className="filters" style={{ marginBottom: 20 }}>
                <label>Дата:</label>
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                <button className="btn btn-sm" onClick={() => setScheduleDate('')}>Показать все</button>
              </div>
              {scheduleWorkouts.length === 0 ? (
                <p style={{ color: '#888' }}>Тренировок не найдено</p>
              ) : (
                <div className="booking-list">
                  {scheduleWorkouts.map(w => {
                    const active = (w.bookings || []).filter(b => b.status === 'active').length;
                    const bookedCount = Math.min(active, w.capacity);
                    const freeCount = Math.max(0, w.capacity - bookedCount);
                    const dt = new Date(w.starts_at);
                    return (
                      <div key={w.id} className="booking-item">
                        <div className="booking-title">{w.title}</div>
                        <div className="booking-date">
                          {dt.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}{' '}
                          {dt.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        <div style={{ fontSize: 13, color: '#666' }}>{w.trainer?.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          Занято {bookedCount}/{w.capacity}
                          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Свободно {freeCount}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'stats' && stats && (
            <div className="card">
              <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Статистика посещаемости</h2>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: 24 }}>
                <div className="stat-card">
                  <div className="stat-value">{stats.total_bookings}</div>
                  <div className="stat-label">Активных записей</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.total_workouts}</div>
                  <div className="stat-label">Всего тренировок</div>
                </div>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Загруженность тренеров</h3>
              <table className="table">
                <thead>
                  <tr><th>Тренер</th><th>Тренировок</th><th>Активных записей</th></tr>
                </thead>
                <tbody>
                  {(stats.trainer_load || []).map((t, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{t.trainer_name}</td>
                      <td>{t.workouts}</td>
                      <td>{t.bookings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="page-footer">Контакты • © 2026 FitCenter</div>
    </div>
  );
}
