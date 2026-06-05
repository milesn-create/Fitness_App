INSERT INTO workouts (id, trainer_id, title, description, photo, starts_at, duration, capacity) VALUES
  ('b1b2c3d4-0009-0009-0009-000000000009', 'a1b2c3d4-0002-0002-0002-000000000002', 'Йога вечерняя',           'Тренировка вчера',                    '/uploads/workouts/yoga-beginners.jpg', NOW() - interval '1 day',  60, 12),
  ('b1b2c3d4-0010-0010-0010-000000000010', 'a1b2c3d4-0003-0003-0003-000000000003', 'Кроссфит утро',           'Началась несколько часов назад',      '/uploads/workouts/crossfit.jpg',        date_trunc('day', NOW()) + interval '7 hours', 60, 15),
  ('b1b2c3d4-0011-0011-0011-000000000011', 'a1b2c3d4-0002-0002-0002-000000000002', 'Йога утро (слот A)',      'Одинаковое время с кроссфитом',       '/uploads/workouts/hatha-yoga.jpg',      NOW() + interval '2 days' + interval '10 hours', 60, 12),
  ('b1b2c3d4-0012-0012-0012-000000000012', 'a1b2c3d4-0003-0003-0003-000000000003', 'Кроссфит утро (слот A)',  'Одинаковое время с йогой',             '/uploads/workouts/crossfit.jpg',        NOW() + interval '2 days' + interval '10 hours', 60, 15)
ON CONFLICT DO NOTHING;
