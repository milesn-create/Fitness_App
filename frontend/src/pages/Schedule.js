import React, { useState, useEffect } from 'react';
import { workoutAPI, bookingAPI, userAPI, getFileUrl } from '../api';
import { useAuth } from '../AuthContext';
import { mapBookingError } from '../errors';

const today = new Date().toISOString().split('T')[0];

function WorkoutCard({ workout, onBook, view }) {
  const { user } = useAuth();
  const active = workout.bookings?.filter(b => b.status === 'active') || [];
  const spotsLeft = workout.capacity - active.length;
  const isFull = spotsLeft <= 0;
  const bookedCount = Math.min(active.length, workout.capacity);
  const isBooked = active.some(b => String(b.user_id) === String(user?.id));
  const isPast = new Date(workout.starts_at) < new Date();

  const dt = new Date(workout.starts_at);
  const dateStr = dt.toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', hour12: false });

  const BookBtn = () => {
    // Используем обычный редирект, чтобы не зависеть от импорта Link
    if (!user) {
      return (
        <button
          className="btn btn-primary btn-full"
          onClick={() => { window.location.href = '/login'; }}
        >
          Войти для записи
        </button>
      );
    }
    if (user.role !== 'client') return null;
    return (
      <button className="btn btn-primary btn-full"
        disabled={isFull || isBooked || isPast}
        onClick={() => onBook(workout.id)}>
        {isBooked ? '✓ Вы записаны' : isFull ? 'Мест нет' : isPast ? 'Прошла' : 'Записаться'}
      </button>
    );
  };

  if (view === 'list') {
    return (
      <div className="workout-list-item">
        <div className="workout-list-photo">
          {workout.photo ? <img src={getFileUrl(workout.photo)} alt="" /> : 'Фото'}
        </div>
        <div className="workout-list-body">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{workout.title}</div>
          <div style={{ fontSize: 13, color: '#666' }}>📅 {dateStr} {timeStr} &nbsp;·&nbsp; ⏱ {workout.duration} мин &nbsp;·&nbsp; 👤 {workout.trainer?.name}</div>
          <div style={{ marginTop: 4 }}>
            <span className={`badge ${isFull ? 'badge-full' : 'badge-open'}`}>
              {isFull
                ? `Мест нет (занято ${bookedCount}/${workout.capacity})`
                : `Свободно ${spotsLeft} (занято ${bookedCount}/${workout.capacity})`}
            </span>
          </div>
        </div>
        <div className="workout-list-footer">
          <BookBtn />
        </div>
      </div>
    );
  }

  return (
    <div className="workout-card">
      <div className="workout-card-photo">
        {workout.photo ? <img src={getFileUrl(workout.photo)} alt={workout.title} /> : 'Фото тренировки'}
      </div>
      <div className="workout-card-body">
        <div className="workout-card-title">{workout.title}</div>
        <div className="workout-card-meta">📅 {dateStr} · {timeStr}</div>
        <div className="workout-card-meta">⏱ {workout.duration} мин</div>
        <div className="workout-card-meta">👤 {workout.trainer?.name}</div>
        <div className="workout-card-spots" style={{ color: isFull ? '#993c1d' : '#2d6a27' }}>
          {isFull
            ? `Мест нет (занято ${bookedCount}/${workout.capacity})`
            : `Свободно ${spotsLeft} (занято ${bookedCount}/${workout.capacity})`}
        </div>
        {workout.description && <div style={{ fontSize: 13, color: '#555', marginTop: 8 }}>{workout.description}</div>}
      </div>
      <div className="workout-card-footer"><BookBtn /></div>
    </div>
  );
}

export default function Schedule() {
  const [workouts, setWorkouts] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [date, setDate] = useState('');
  const [trainerID, setTrainerID] = useState('');
  const [showPast, setShowPast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (date) params.date = date;
      if (trainerID) params.trainer_id = trainerID;
      if (showPast) params.include_past = 'true';
      const res = await workoutAPI.list(params);
      setWorkouts(res.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { userAPI.trainers().then(r => setTrainers(r.data || [])); }, []);

  const handleBook = async (id) => {
    try {
      await bookingAPI.book(id);
      setMsg({ text: 'Вы успешно записаны!', type: 'success' });
      load();
    } catch (e) {
      setMsg({ text: mapBookingError(e), type: 'error' });
    }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  return (
    <div className="container page">
      <h1 className="page-title page-title-center">Расписание тренировок</h1>

      <div className="filters">
        <label>Дата:</label>
        <input type="date" value={date} min={today}
          onChange={e => setDate(e.target.value)} />
        <label>Тренер:</label>
        <select value={trainerID} onChange={e => setTrainerID(e.target.value)}>
          <option value="">Все тренеры</option>
          {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="btn btn-sm" onClick={load}>Найти</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666', cursor: 'pointer' }}>
          <input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)} />
          Показать прошедшие
        </label>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : workouts.length === 0 ? (
        <div className="loading">Тренировок не найдено</div>
      ) : (
        <div className="workout-grid">
          {workouts.map(w => (
            <WorkoutCard key={w.id} workout={w} onBook={handleBook} view="grid" />
          ))}
        </div>
      )}

      <div className="page-footer">Контакты • © 2026 FitCenter</div>
    </div>
  );
}
