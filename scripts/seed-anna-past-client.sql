INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES
  ('a1b2c3d4-0008-0008-0008-000000000008', 'Сергей Ковалёв', 'client4@example.com',
   '$2b$12$emTZsbHbdXwPGgPVR.Vwm.ODY2C/Wkzyz.Np6P5qKOGKwTNTVcURm', 'client', '2026-02-12 10:00:00')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, trainer_id, title, description, photo, starts_at, duration, capacity) VALUES
  ('b1b2c3d4-0013-0013-0013-000000000013', 'a1b2c3d4-0002-0002-0002-000000000002', 'Групповая йога',
   'Прошедшая тренировка Анны', '/uploads/workouts/hatha-yoga.jpg',
   NOW() - interval '2 days' + interval '18 hours', 60, 12)
ON CONFLICT DO NOTHING;

INSERT INTO bookings (id, user_id, workout_id, status, attended) VALUES
  ('c1b2c3d4-0011-0011-0011-000000000011', 'a1b2c3d4-0008-0008-0008-000000000008',
   'b1b2c3d4-0013-0013-0013-000000000013', 'active', false)
ON CONFLICT (id) DO NOTHING;
