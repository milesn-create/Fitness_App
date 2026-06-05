import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import PasswordInput from '../components/PasswordInput';
import { mapAuthError } from '../errors';

export default function Auth({ defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({
    name: '', surname: '', email: '', password: '', confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const redirect = (user) => {
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'trainer') navigate('/trainer');
    else navigate('/profile');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(loginForm.email.trim(), loginForm.password);
      redirect(user);
    } catch (e) {
      setError(mapAuthError(e, 'Неверный email или пароль'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (regForm.password.length < 8) {
      setError('Пароль должен быть не короче 8 символов');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await register({
        name: `${regForm.name} ${regForm.surname}`.trim(),
        email: regForm.email.trim(),
        password: regForm.password,
        role: 'client',
      });
      redirect(user);
    } catch (e) {
      setError(mapAuthError(e, 'Не удалось зарегистрироваться'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page" style={{ maxWidth: 480 }}>
      <div className="auth-tabs">
        <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Войти</button>
        <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Регистрация</button>
      </div>

      <div className="card">
        {tab === 'login' ? (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>Вход в аккаунт</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Пароль</label>
                <PasswordInput
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <button className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Входим...' : 'Войти'}
              </button>
              <hr className="divider" />
              <p style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>
                Нет аккаунта?{' '}
                <span style={{ color: '#1a1a1a', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => setTab('register')}>Зарегистрироваться →</span>
              </p>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>Создать аккаунт</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Имя</label>
                  <input placeholder="Анастасия" value={regForm.name}
                    onChange={e => setRegForm({ ...regForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input placeholder="Минеева" value={regForm.surname}
                    onChange={e => setRegForm({ ...regForm, surname: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="name@example.com" value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Пароль</label>
                <PasswordInput
                  placeholder="Минимум 8 символов"
                  value={regForm.password}
                  onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label>Повторите пароль</label>
                <PasswordInput
                  placeholder="••••••••"
                  value={regForm.confirmPassword}
                  onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                Регистрация доступна только для клиентов. Аккаунт тренера создаёт администратор.
              </p>
              <button className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Создаём...' : 'Создать аккаунт'}
              </button>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' }}>
                Уже есть аккаунт?{' '}
                <span style={{ color: '#1a1a1a', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => setTab('login')}>Войти →</span>
              </p>
            </form>
          </>
        )}
      </div>

      <div className="page-footer">Контакты • © 2026 FitCenter</div>
    </div>
  );
}
