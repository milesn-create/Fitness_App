ALTER TABLE workouts DROP CONSTRAINT IF EXISTS fk_workouts_trainer;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_user;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_workouts_bookings;
