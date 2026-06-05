CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'client',
    avatar VARCHAR,
    bio TEXT,
    experience VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR NOT NULL,
    description TEXT,
    photo VARCHAR,
    starts_at TIMESTAMP NOT NULL,
    duration INT NOT NULL,
    capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    workout_id UUID NOT NULL REFERENCES workouts(id),
    status VARCHAR NOT NULL DEFAULT 'active',
    attended BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Глеб Тарнов',        'admin@fitcenter.ru',   '$2b$12$emTZsbHbdXwPGgPVR.Vwm.ODY2C/Wkzyz.Np6P5qKOGKwTNTVcURm', 'admin',   '2026-01-10 10:00:00'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Анна Петрова',        'anna@fitcenter.ru',    '$2b$12$emTZsbHbdXwPGgPVR.Vwm.ODY2C/Wkzyz.Np6P5qKOGKwTNTVcURm', 'trainer', '2026-01-12 10:00:00'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Игорь Смирнов',       'igor@fitcenter.ru',    '$2b$12$emTZsbHbdXwPGgPVR.Vwm.ODY2C/Wkzyz.Np6P5qKOGKwTNTVcURm', 'trainer', '2026-01-12 11:00:00'),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Мария Козлова',       'maria@fitcenter.ru',   '$2b$12$emTZsbHbdXwPGgPVR.Vwm.ODY2C/Wkzyz.Np6P5qKOGKwTNTVcURm', 'trainer', '2026-01-15 10:00:00'),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'Анастасия Минеева',   'client1@example.com',  '$2b$12$emTZsbHbdXwPGgPVR.Vwm.ODY2C/Wkzyz.Np6P5qKOGKwTNTVcURm', 'client',  '2026-02-01 10:00:00'),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'Дмитрий Воронов',     'client2@example.com',  '$2b$12$emTZsbHbdXwPGgPVR.Vwm.ODY2C/Wkzyz.Np6P5qKOGKwTNTVcURm', 'client',  '2026-02-05 10:00:00'),
  ('a1b2c3d4-0007-0007-0007-000000000007', 'Екатерина Лебедева',  'client3@example.com',  '$2b$12$emTZsbHbdXwPGgPVR.Vwm.ODY2C/Wkzyz.Np6P5qKOGKwTNTVcURm', 'client',  '2026-02-10 10:00:00'),
  ('a1b2c3d4-0008-0008-0008-000000000008', 'Сергей Ковалёв',       'client4@example.com',  '$2b$12$emTZsbHbdXwPGgPVR.Vwm.ODY2C/Wkzyz.Np6P5qKOGKwTNTVcURm', 'client',  '2026-02-12 10:00:00')
ON CONFLICT DO NOTHING;

UPDATE users SET name = 'Глеб Тарнов' WHERE email = 'admin@fitcenter.ru';

UPDATE users SET
  bio = 'Сертифицированный инструктор по хатха-йоге. Помогает новичкам освоить базовые асаны и дыхательные практики.',
  experience = '8 лет'
WHERE email = 'anna@fitcenter.ru';

UPDATE users SET
  bio = 'Мастер спорта по функциональному тренингу. Специализируется на кроссфите и силовых программах.',
  experience = '10 лет'
WHERE email = 'igor@fitcenter.ru';

UPDATE users SET
  bio = 'Инструктор по пилатесу и стретчингу. Работает над осанкой, гибкостью и укреплением мышц кора.',
  experience = '6 лет'
WHERE email = 'maria@fitcenter.ru';

INSERT INTO workouts (id, trainer_id, title, description, photo, starts_at, duration, capacity) VALUES
  ('b1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002', 'Йога для начинающих',    'Мягкая практика для новичков, улучшает гибкость и снимает стресс',  '/uploads/workouts/yoga-beginners.jpg',  NOW() + interval '1 day'  + interval '9 hours',  60, 12),
  ('b1b2c3d4-0002-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'Хатха-йога',             'Средний уровень, работа с дыханием и балансом',                      '/uploads/workouts/hatha-yoga.jpg',      NOW() + interval '2 days' + interval '11 hours', 75, 10),
  ('b1b2c3d4-0003-0003-0003-000000000003', 'a1b2c3d4-0003-0003-0003-000000000003', 'Кроссфит',               'Интенсивная функциональная тренировка для всего тела',               '/uploads/workouts/crossfit.jpg',        NOW() + interval '1 day'  + interval '11 hours', 60, 15),
  ('b1b2c3d4-0004-0004-0004-000000000004', 'a1b2c3d4-0003-0003-0003-000000000003', 'Силовая тренировка',     'Работа со свободными весами и тренажёрами',                          '/uploads/workouts/strength.jpg',        NOW() + interval '3 days' + interval '10 hours', 60, 12),
  ('b1b2c3d4-0005-0005-0005-000000000005', 'a1b2c3d4-0004-0004-0004-000000000004', 'Пилатес',                'Укрепление мышц кора, улучшение осанки',                             '/uploads/workouts/pilates.jpg',         NOW() + interval '1 day'  + interval '14 hours', 60, 10),
  ('b1b2c3d4-0006-0006-0006-000000000006', 'a1b2c3d4-0004-0004-0004-000000000004', 'Стретчинг',              'Глубокая растяжка всех групп мышц',                                  '/uploads/workouts/stretching.jpg',      NOW() + interval '2 days' + interval '9 hours',  45, 15),
  ('b1b2c3d4-0007-0007-0007-000000000007', 'a1b2c3d4-0002-0002-0002-000000000002', 'Йога продвинутый',       'Продвинутые асаны для опытных практикующих',                         '/uploads/workouts/yoga-advanced.jpg',   NOW() + interval '4 days' + interval '10 hours', 90,  8),
  ('b1b2c3d4-0008-0008-0008-000000000008', 'a1b2c3d4-0003-0003-0003-000000000003', 'Функциональный тренинг', 'Упражнения для развития силы и выносливости',                        '/uploads/workouts/functional.jpg',      NOW() + interval '5 days' + interval '12 hours', 60, 12)
ON CONFLICT DO NOTHING;

UPDATE workouts SET photo = '/uploads/workouts/yoga-beginners.jpg' WHERE title = 'Йога для начинающих';
UPDATE workouts SET photo = '/uploads/workouts/hatha-yoga.jpg' WHERE title = 'Хатха-йога';
UPDATE workouts SET photo = '/uploads/workouts/crossfit.jpg' WHERE title = 'Кроссфит';
UPDATE workouts SET photo = '/uploads/workouts/strength.jpg' WHERE title = 'Силовая тренировка';
UPDATE workouts SET photo = '/uploads/workouts/pilates.jpg' WHERE title = 'Пилатес';
UPDATE workouts SET photo = '/uploads/workouts/stretching.jpg' WHERE title = 'Стретчинг';
UPDATE workouts SET photo = '/uploads/workouts/yoga-advanced.jpg' WHERE title = 'Йога продвинутый';
UPDATE workouts SET photo = '/uploads/workouts/functional.jpg' WHERE title = 'Функциональный тренинг';

INSERT INTO bookings (id, user_id, workout_id, status) VALUES
  ('c1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0005-0005-0005-000000000005', 'b1b2c3d4-0001-0001-0001-000000000001', 'active'),
  ('c1b2c3d4-0002-0002-0002-000000000002', 'a1b2c3d4-0005-0005-0005-000000000005', 'b1b2c3d4-0003-0003-0003-000000000003', 'active'),
  ('c1b2c3d4-0003-0003-0003-000000000003', 'a1b2c3d4-0005-0005-0005-000000000005', 'b1b2c3d4-0005-0005-0005-000000000005', 'cancelled'),
  ('c1b2c3d4-0004-0004-0004-000000000004', 'a1b2c3d4-0006-0006-0006-000000000006', 'b1b2c3d4-0001-0001-0001-000000000001', 'active'),
  ('c1b2c3d4-0005-0005-0005-000000000005', 'a1b2c3d4-0006-0006-0006-000000000006', 'b1b2c3d4-0005-0005-0005-000000000005', 'active'),
  ('c1b2c3d4-0006-0006-0006-000000000006', 'a1b2c3d4-0007-0007-0007-000000000007', 'b1b2c3d4-0003-0003-0003-000000000003', 'active'),
  ('c1b2c3d4-0007-0007-0007-000000000007', 'a1b2c3d4-0007-0007-0007-000000000007', 'b1b2c3d4-0006-0006-0006-000000000006', 'active'),
  ('c1b2c3d4-0008-0008-0008-000000000008', 'a1b2c3d4-0006-0006-0006-000000000006', 'b1b2c3d4-0007-0007-0007-000000000007', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, trainer_id, title, description, photo, starts_at, duration, capacity) VALUES
  ('b1b2c3d4-0009-0009-0009-000000000009', 'a1b2c3d4-0002-0002-0002-000000000002', 'Йога вечерняя',           'Тренировка вчера',                    '/uploads/workouts/yoga-beginners.jpg', NOW() - interval '1 day',  60, 12),
  ('b1b2c3d4-0010-0010-0010-000000000010', 'a1b2c3d4-0003-0003-0003-000000000003', 'Кроссфит утро',           'Началась несколько часов назад',      '/uploads/workouts/crossfit.jpg',        date_trunc('day', NOW()) + interval '7 hours', 60, 15),
  ('b1b2c3d4-0011-0011-0011-000000000011', 'a1b2c3d4-0002-0002-0002-000000000002', 'Йога утро (слот A)',      'Одинаковое время с кроссфитом',       '/uploads/workouts/hatha-yoga.jpg',      NOW() + interval '2 days' + interval '10 hours', 60, 12),
  ('b1b2c3d4-0012-0012-0012-000000000012', 'a1b2c3d4-0003-0003-0003-000000000003', 'Кроссфит утро (слот A)',  'Одинаковое время с йогой',             '/uploads/workouts/crossfit.jpg',        NOW() + interval '2 days' + interval '10 hours', 60, 15),
  ('b1b2c3d4-0013-0013-0013-000000000013', 'a1b2c3d4-0002-0002-0002-000000000002', 'Групповая йога',          'Прошедшая тренировка Анны',            '/uploads/workouts/hatha-yoga.jpg',      NOW() - interval '2 days' + interval '18 hours', 60, 12)
ON CONFLICT DO NOTHING;

INSERT INTO bookings (id, user_id, workout_id, status, attended) VALUES
  ('c1b2c3d4-0009-0009-0009-000000000009', 'a1b2c3d4-0005-0005-0005-000000000005', 'b1b2c3d4-0009-0009-0009-000000000009', 'active', false),
  ('c1b2c3d4-0010-0010-0010-000000000010', 'a1b2c3d4-0006-0006-0006-000000000006', 'b1b2c3d4-0010-0010-0010-000000000010', 'active', false),
  ('c1b2c3d4-0011-0011-0011-000000000011', 'a1b2c3d4-0008-0008-0008-000000000008', 'b1b2c3d4-0013-0013-0013-000000000013', 'active', false)
ON CONFLICT DO NOTHING;
