import React from 'react';

export default function About() {
  return (
    <div className="container page">
      <h1 className="page-title">О нас</h1>

      <div className="about-hero">
        <img
          src="/uploads/workouts/crossfit.jpg"
          alt="Зал FitCenter"
          className="about-hero-img"
        />
        <div className="about-hero-overlay">
          <h2>FitCenter — ваш фитнес рядом с домом</h2>
          <p>Групповые тренировки, опытные тренеры и удобная онлайн-запись</p>
        </div>
      </div>

      <div className="about-grid">
        <div className="card">
          <h3>Кто мы</h3>
          <p>
            FitCenter — современный фитнес-центр для тех, кто хочет тренироваться регулярно
            без лишней бюрократии. У нас йога, силовые, кроссфит, пилатес и растяжка —
            для новичков и для тех, кто уже в спорте.
          </p>
          <p>
            Мы верим, что комфортная атмосфера и понятное расписание важнее громких обещаний.
            Поэтому всё расписание, запись и личный кабинет — в одном веб-приложении.
          </p>
        </div>

        <div className="card">
          <h3>Что вы получаете</h3>
          <ul className="about-list">
            <li>Актуальное расписание с фото тренировок и свободными местами</li>
            <li>Запись в один клик из личного кабинета клиента</li>
            <li>Кабинет тренера: свои занятия, клиенты, отметка посещений</li>
            <li>Панель администратора: пользователи, статистика, контроль центра</li>
          </ul>
        </div>

        <div className="card">
          <h3>Контакты</h3>
          <p><strong>Адрес:</strong> г. Москва, ул. Спортивная, 12</p>
          <p><strong>Телефон:</strong> +7 (495) 123-45-67</p>
          <p><strong>Email:</strong> hello@fitcenter.ru</p>
          <p><strong>Часы работы:</strong> ежедневно 07:00 — 23:00</p>
        </div>

      </div>

      <div className="about-cta-wrap">
        <div className="card about-cta">
          <h3>Начните сегодня</h3>
          <p>Зарегистрируйтесь как клиент, выберите тренировку в расписании и приходите на первое занятие.</p>
        </div>
      </div>

      <div className="page-footer">Контакты • © 2026 FitCenter</div>
    </div>
  );
}
