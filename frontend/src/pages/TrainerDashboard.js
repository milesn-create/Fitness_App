import React, { useState, useEffect } from 'react';
import { workoutAPI, bookingAPI, getFileUrl } from '../api';
import { useAuth } from '../AuthContext';

const today = new Date().toISOString().slice(0, 16);

const localDateKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const toDatetimeLocalValue = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

const formatWorkoutWhen = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} ${time}`;
};

export default function TrainerDashboard() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [tab, setTab] = useState('workouts');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', starts_at: '', duration: 60, capacity: 12, photoFile: null });
  const [filterDate, setFilterDate] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  const load = async () => {
    const res = await workoutAPI.list({ trainer_id: user.id, include_past: 'true' });
    setWorkouts(res.data || []);
  };

  const buildClientSummary = () => {
    const map = new Map();
    workouts.forEach((w) => {
      (w.bookings || [])
        .filter((b) => b.status === 'active')
        .forEach((b) => {
          const key = String(b.user_id);
          if (!map.has(key)) {
            map.set(key, {
              userId: key,
              name: b.user?.name || 'Клиент',
              bookings: 0,
              attended: 0,
              pendingMark: [],
            });
          }
          const row = map.get(key);
          row.bookings += 1;
          if (b.attended) row.attended += 1;
          const ended = new Date(w.starts_at).getTime() + w.duration * 60000 <= Date.now();
          if (ended && !b.attended && b.user) {
            row.pendingMark.push({ bookingId: b.id, title: w.title, startsAt: w.starts_at });
          }
        });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  };

  const handleMarkAttended = async (bookingId) => {
    try {
      await bookingAPI.markAttended(bookingId);
      showMsg('Посещение отмечено');
      load();
    } catch (e) {
      showMsg(e.response?.data?.error || 'Не удалось отметить', 'error');
    }
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const resetForm = () => {
    setForm({ title: '', description: '', starts_at: '', duration: 60, capacity: 12, photoFile: null });
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.starts_at) < new Date()) {
      showMsg('Нельзя указать дату и время в прошлом', 'error');
      return;
    }
    try {
      const data = {
        title: form.title,
        description: form.description,
        starts_at: new Date(form.starts_at).toISOString(),
        duration: +form.duration,
        capacity: +form.capacity,
      };
      let workout;
      if (editing) {
        await workoutAPI.update(editing, data);
        workout = { id: editing };
        showMsg('Тренировка обновлена');
      } else {
        const res = await workoutAPI.create(data);
        workout = res.data;
        showMsg('Тренировка создана');
      }
      if (form.photoFile && workout?.id) {
        await workoutAPI.uploadPhoto(workout.id, form.photoFile);
      }
      resetForm();
      load();
    } catch (e) { showMsg(e.response?.data?.error || 'Ошибка', 'error'); }
  };

  const handleEdit = (w) => {
    setEditing(w.id);
    setForm({
      title: w.title,
      description: w.description || '',
      starts_at: toDatetimeLocalValue(w.starts_at),
      duration: w.duration,
      capacity: w.capacity,
      photoFile: null,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить тренировку?')) return;
    await workoutAPI.delete(id);
    showMsg('Тренировка удалена');
    load();
  };
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatTime = (d) =>
    new Date(d).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', hour12: false });

  const displayedWorkouts = filterDate
    ? workouts.filter((w) => localDateKey(w.starts_at) === filterDate)
    : workouts;

  return (
    <div className="container page">
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="layout-sidebar">
        <div className="sidebar trainer-sidebar">
          <span className={`sidebar-item ${tab === 'workouts' ? 'active' : ''}`} onClick={() => { setTab('workouts'); resetForm(); }}>Мои тренировки</span>
          <span className={`sidebar-item ${tab === 'clients' ? 'active' : ''}`} onClick={() => setTab('clients')}>Мои клиенты</span>
        </div>

        <div>
          {tab === 'workouts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card trainer-workouts-header">
                <div className="trainer-section-head">
                  <div className="trainer-section-actions" style={{ marginLeft: 'auto' }}>
                    <button className="btn btn-sm" onClick={resetForm}>+ Добавить тренировку</button>
                    <input
                      type="date"
                      className="trainer-date-filter"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      title="Фильтр по дате"
                    />
                    {filterDate && (
                      <button type="button" className="btn btn-sm" onClick={() => setFilterDate('')}>
                        Сбросить
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {displayedWorkouts.length === 0 ? (
                <div className="card" style={{ color: '#888' }}>
                  {workouts.length === 0 ? 'Тренировок пока нет' : 'На выбранную дату тренировок нет'}
                </div>
              ) : (
                <div className="trainer-workouts-list">
                  {displayedWorkouts.map((w) => {
                    const activeBookings = (w.bookings || []).filter((b) => b.status === 'active');
                    const active = activeBookings.length;
                    const isFull = active >= w.capacity;
                    const bookedCount = Math.min(active, w.capacity);
                    const freeCount = Math.max(0, w.capacity - bookedCount);
                    const start = new Date(w.starts_at);
                    const end = new Date(start.getTime() + w.duration * 60000);
                    const isPast = start < new Date();
                    const ended = end <= new Date();
                    const pendingAttendance = ended
                      ? activeBookings.filter((b) => !b.attended)
                      : [];
                    const statusText = isPast ? 'Прошла' : isFull ? 'Мест нет' : 'Открыта';
                    return (
                      <div key={w.id} className={`trainer-workout-item${isPast ? ' past' : ''}`}>
                        <div className="trainer-workout-photo">
                          {w.photo ? (
                            <img src={getFileUrl(w.photo)} alt="" />
                          ) : (
                            'Фото'
                          )}
                        </div>

                        <div className="trainer-workout-main">
                          <div className="trainer-workout-title">{w.title}</div>
                          <div className="trainer-workout-datetime">
                            {formatDate(start)} {formatTime(start)} — {formatTime(end)}
                          </div>
                        </div>

                        <div className="trainer-workout-seats">
                          Занято {bookedCount}/{w.capacity}
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            Свободно {freeCount}
                          </div>
                        </div>
                        <div className={`trainer-workout-status ${isPast ? 'full' : isFull ? 'full' : 'open'}`}>
                          {statusText}
                        </div>

                        <div className="trainer-workout-actions">
                          <button className="btn btn-sm" disabled={isPast} onClick={() => handleEdit(w)}>Редакт.</button>
                          <button className="btn btn-sm btn-danger" disabled={isPast} onClick={() => handleDelete(w.id)}>Удалить</button>
                        </div>

                        {pendingAttendance.length > 0 && (
                          <div className="trainer-attendance">
                            {pendingAttendance.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                className="btn btn-sm btn-attend"
                                onClick={() => handleMarkAttended(b.id)}
                              >
                                {b.user?.name || 'Клиент'} · {formatWorkoutWhen(w.starts_at)} — отметить
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="card trainer-form-card">
                <h2 className="trainer-form-title">
                  {editing ? 'Редактировать тренировку' : 'Новая тренировка'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="trainer-form-grid">
                    <div className="form-group">
                      <label>Название</label>
                      <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Йога" required />
                    </div>
                    <div className="form-group">
                      <label>Дата и время</label>
                      <input
                        type="datetime-local"
                        value={form.starts_at}
                        min={today}
                        onChange={e => setForm({ ...form, starts_at: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Длительность (мин)</label>
                      <input
                        type="number"
                        value={form.duration}
                        onChange={e => setForm({ ...form, duration: e.target.value })}
                        min={15}
                        required
                      />
                    </div>
                  </div>

                  <div className="trainer-form-grid">
                    <div className="form-group">
                      <label>Мест всего</label>
                      <input
                        type="number"
                        value={form.capacity}
                        onChange={e => setForm({ ...form, capacity: e.target.value })}
                        min={1}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Фото тренировки</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => setForm({ ...form, photoFile: e.target.files[0] })}
                        className="trainer-file-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Описание</label>
                      <input
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Краткое описание"
                      />
                    </div>
                  </div>

                  <div className="trainer-form-footer">
                    <button className="btn" type="submit">Сохранить тренировку</button>
                    {editing && <button className="btn" type="button" onClick={resetForm}>Отмена</button>}
                  </div>
                </form>
              </div>
            </div>
          )}

          {tab === 'clients' && (
            <div className="card">
              <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Мои клиенты</h2>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                Каждый клиент показан один раз. «Посещено» отмечает тренер после завершения тренировки.
              </p>
              {(() => {
                const clients = buildClientSummary();
                if (clients.length === 0) {
                  return <p style={{ color: '#888' }}>Клиентов пока нет</p>;
                }
                return (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Клиент</th>
                        <th>Записей</th>
                        <th>Посещено</th>
                        <th>Отметить посещение</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr key={c.userId}>
                          <td style={{ fontWeight: 500 }}>{c.name}</td>
                          <td>{c.bookings}</td>
                          <td>{c.attended}</td>
                          <td>
                            {c.pendingMark.length === 0 ? (
                              <span style={{ color: '#888', fontSize: 13 }}>—</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {c.pendingMark.map((p) => (
                                  <button
                                    key={p.bookingId}
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() => handleMarkAttended(p.bookingId)}
                                  >
                                    {p.title} · {formatWorkoutWhen(p.startsAt)} · отметить
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}
        </div>
      </div>
      <div className="page-footer">Контакты • © 2026 FitCenter</div>
    </div>
  );
}
