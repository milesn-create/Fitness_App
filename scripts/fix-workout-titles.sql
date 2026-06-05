UPDATE workouts SET title = 'Йога вечерняя' WHERE title = 'Йога (прошла)';
UPDATE workouts SET title = 'Кроссфит утро' WHERE title IN ('Кроссфит (сегодня, прошло)', 'Кроссфит (сегодня, прошла)');
