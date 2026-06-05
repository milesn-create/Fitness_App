const AUTH_ERRORS = {
  'Invalid credentials': 'Неверный email или пароль',
  'Email already exists': 'Этот email уже зарегистрирован. Войдите или укажите другой адрес.',
  'Trainer registration is not allowed': 'Регистрация тренера доступна только через администратора.',
  'User not found': 'Пользователь с таким email не найден',
};

const BOOKING_ERRORS = {
  'Already booked': 'Вы уже записаны на эту тренировку',
  'No available spots': 'Свободных мест нет',
  'Workout past': 'Нельзя записаться: тренировка уже началась или прошла',
  'Time conflict': 'У вас уже есть запись на это же время. Сначала отмените другую тренировку.',
  'Workout not found': 'Тренировка не найдена',
};

export function mapAuthError(err, fallback = 'Произошла ошибка. Попробуйте ещё раз.') {
  const raw = err?.response?.data?.error;
  if (!raw) return fallback;
  if (AUTH_ERRORS[raw]) return AUTH_ERRORS[raw];
  if (raw.includes("Field validation for 'Email'") || raw.includes('email tag')) {
    return 'Введите корректный email (например, name@example.com)';
  }
  if (raw.includes('Password') && raw.includes('min')) return 'Пароль должен быть не короче 8 символов';
  if (raw.includes('Email') && raw.includes('required')) return 'Укажите email';
  if (raw.includes('Password') && raw.includes('required')) return 'Укажите пароль';
  if (raw.includes('Name') && raw.includes('required')) return 'Укажите имя';
  return raw;
}

export function mapBookingError(err, fallback = 'Не удалось записаться') {
  const raw = err?.response?.data?.error;
  if (!raw) return fallback;
  return BOOKING_ERRORS[raw] || raw;
}
