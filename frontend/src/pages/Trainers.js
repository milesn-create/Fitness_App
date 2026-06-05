import React, { useEffect, useState } from 'react';
import { userAPI, getFileUrl } from '../api';

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.trainers()
      .then(r => setTrainers(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container page">
      <h1 className="page-title">Наши тренеры</h1>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : trainers.length === 0 ? (
        <div className="loading">Тренеры пока не добавлены</div>
      ) : (
        <div className="workout-grid">
          {trainers.map(t => (
            <div key={t.id} className="card" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div className="avatar avatar-lg">
                  {t.avatar ? <img src={getFileUrl(t.avatar)} alt={t.name} /> : 'Фото'}
                </div>
              </div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
              {t.experience && (
                <div style={{ fontSize: 12, color: '#993c1d', fontWeight: 500, marginBottom: 8 }}>
                  Опыт: {t.experience}
                </div>
              )}
              {t.bio ? (
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{t.bio}</div>
              ) : (
                <div style={{ fontSize: 13, color: '#999' }}>Информация о тренере скоро появится</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="page-footer">Контакты • © 2026 FitCenter</div>
    </div>
  );
}

