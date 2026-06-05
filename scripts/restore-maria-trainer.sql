INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Мария Козлова', 'maria@fitcenter.ru', '$2b$12$emTZsbHbdXwPGgPVR.Vwm.ODY2C/Wkzyz.Np6P5qKOGKwTNTVcURm', 'trainer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

INSERT INTO workouts (id, trainer_id, title, description, photo, starts_at, duration, capacity) VALUES
  ('b1b2c3d4-0005-0005-0005-000000000005', 'a1b2c3d4-0004-0004-0004-000000000004', 'Пилатес',   'Укрепление мышц кора, улучшение осанки',    '/uploads/workouts/pilates.jpg',    NOW() + interval '1 day' + interval '14 hours', 60, 10),
  ('b1b2c3d4-0006-0006-0006-000000000006', 'a1b2c3d4-0004-0004-0004-000000000004', 'Стретчинг', 'Глубокая растяжка всех групп мышц',         '/uploads/workouts/stretching.jpg', NOW() + interval '2 days' + interval '9 hours',  45, 15)
ON CONFLICT (id) DO UPDATE SET
  trainer_id = EXCLUDED.trainer_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  photo = EXCLUDED.photo,
  starts_at = EXCLUDED.starts_at,
  duration = EXCLUDED.duration,
  capacity = EXCLUDED.capacity;

INSERT INTO bookings (id, user_id, workout_id, status) VALUES
  ('c1b2c3d4-0003-0003-0003-000000000003', 'a1b2c3d4-0005-0005-0005-000000000005', 'b1b2c3d4-0005-0005-0005-000000000005', 'cancelled'),
  ('c1b2c3d4-0005-0005-0005-000000000005', 'a1b2c3d4-0006-0006-0006-000000000006', 'b1b2c3d4-0005-0005-0005-000000000005', 'active'),
  ('c1b2c3d4-0007-0007-0007-000000000007', 'a1b2c3d4-0007-0007-0007-000000000007', 'b1b2c3d4-0006-0006-0006-000000000006', 'active')
ON CONFLICT (id) DO NOTHING;
