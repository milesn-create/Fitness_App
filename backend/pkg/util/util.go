package util

import (
	"errors"
	"strings"
	"time"

	"fitness-app/internal/models"

	"github.com/go-playground/validator/v10"
)

var errWorkoutInPast = errors.New("workout in past")
var errTrainerRequired = errors.New("trainer required")

func BindErrorMessage(err error) string {
	if err == nil {
		return "Проверьте правильность введённых данных"
	}
	var ve validator.ValidationErrors
	if !errors.As(err, &ve) {
		return "Проверьте правильность введённых данных"
	}
	for _, fe := range ve {
		field := strings.ToLower(fe.Field())
		switch fe.Tag() {
		case "required":
			switch field {
			case "email":
				return "Укажите email"
			case "password":
				return "Укажите пароль"
			case "name":
				return "Укажите имя"
			default:
				return "Заполните все обязательные поля"
			}
		case "email":
			return "Введите корректный email (например, name@example.com)"
		case "min":
			if field == "password" {
				return "Пароль должен быть не короче 8 символов"
			}
		}
	}
	return "Проверьте правильность введённых данных"
}

func workoutEnd(w models.Workout) time.Time {
	return w.StartsAt.Add(time.Duration(w.Duration) * time.Minute)
}

func WorkoutsOverlap(a, b models.Workout) bool {
	aEnd := workoutEnd(a)
	bEnd := workoutEnd(b)
	return a.StartsAt.Before(bEnd) && b.StartsAt.Before(aEnd)
}

func WorkoutStarted(w models.Workout, now time.Time) bool {
	return !now.Before(w.StartsAt)
}

func ValidateWorkoutStartsAt(startsAt time.Time) error {
	if startsAt.Before(time.Now()) {
		return errWorkoutInPast
	}
	return nil
}
