import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getFileUrl } from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isActive = (path) => location.pathname === path ? 'active' : '';
  const isTrainerSection = location.pathname.startsWith('/trainer');
  const adminPanelPaths = ['/admin', '/admin/users', '/admin/workouts', '/admin/schedule', '/admin/stats'];
  const isAdminPanel = adminPanelPaths.includes(location.pathname);

  const profileLink = user?.role === 'trainer'
    ? '/trainer/profile'
    : user?.role === 'admin'
      ? '/admin/profile'
      : '/profile';

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderLinks = () => {
    if (user?.role === 'trainer') {
      return (
        <>
          <Link to="/" className={isActive('/') && !isTrainerSection ? 'active' : ''}>
            Расписание тренировок
          </Link>
          <Link to="/trainer" className={isTrainerSection ? 'active' : ''}>
            Кабинет тренера
          </Link>
        </>
      );
    }

    if (user?.role === 'admin') {
      return (
        <>
          <Link to="/" className={isActive('/') ? 'active' : ''}>
            Расписание
          </Link>
          <Link to="/admin" className={isAdminPanel ? 'active' : ''}>
            Панель администратора
          </Link>
        </>
      );
    }

    return (
      <>
        <Link to="/" className={isActive('/')}>Расписание</Link>
        <Link to="/trainers" className={isActive('/trainers')}>Тренеры</Link>
        <Link to="/about" className={isActive('/about')}>О нас</Link>
      </>
    );
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">FitCenter</Link>
      {user?.role === 'admin' && <span className="navbar-role-badge admin">Администратор</span>}
      {user?.role === 'trainer' && <span className="navbar-role-badge trainer">Тренер</span>}

      <div className="navbar-links">{renderLinks()}</div>

      <div className="navbar-user">
        {user ? (
          <>
            <span style={{ fontSize: 14, color: '#555' }}>{user.name}</span>
            <Link to={profileLink}>
              <div className="avatar avatar-sm">
                {user.avatar ? <img src={getFileUrl(user.avatar)} alt="" /> : initials}
              </div>
            </Link>
            <button className="btn btn-sm" type="button" onClick={handleLogout}>Выйти</button>
          </>
        ) : (
          !isAuthPage && (
            <>
              <Link to="/login"><button className="btn btn-sm">Войти</button></Link>
              <Link to="/register"><button className="btn btn-sm btn-primary">Регистрация</button></Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}
