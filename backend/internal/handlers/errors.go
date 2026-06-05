package handlers

import (
	"errors"
	"fitness-app/internal/service"
	"net/http"
)

func statusFromError(err error) (int, string) {
	switch {
	case errors.Is(err, service.ErrNotFound):
		return http.StatusNotFound, "Not found"
	case errors.Is(err, service.ErrInvalidCredentials):
		return http.StatusUnauthorized, "Invalid credentials"
	case errors.Is(err, service.ErrEmailExists):
		return http.StatusConflict, "Email already exists"
	case errors.Is(err, service.ErrTrainerRegistrationNotAllowed):
		return http.StatusBadRequest, "Trainer registration is not allowed"
	case errors.Is(err, service.ErrForbidden):
		return http.StatusForbidden, "Forbidden"
	case errors.Is(err, service.ErrTrainerRequired):
		return http.StatusBadRequest, "Выберите тренера"
	case errors.Is(err, service.ErrInvalidTrainer):
		return http.StatusBadRequest, "Укажите корректного тренера"
	case errors.Is(err, service.ErrAlreadyBooked):
		return http.StatusConflict, "Already booked"
	case errors.Is(err, service.ErrWorkoutPast):
		return http.StatusBadRequest, "Workout past"
	case errors.Is(err, service.ErrNoAvailableSpots):
		return http.StatusConflict, "No available spots"
	case errors.Is(err, service.ErrTimeConflict):
		return http.StatusConflict, "Time conflict"
	case errors.Is(err, service.ErrInvalidRole):
		return http.StatusBadRequest, "Invalid role"
	case errors.Is(err, service.ErrCannotDeleteSelf):
		return http.StatusBadRequest, "Нельзя удалить свой аккаунт"
	case errors.Is(err, service.ErrBookingNotActive):
		return http.StatusBadRequest, "Можно отметить только активную запись"
	case errors.Is(err, service.ErrWorkoutInPast):
		return http.StatusBadRequest, "Нельзя создать тренировку в прошлом"
	default:
		return http.StatusInternalServerError, "Internal server error"
	}
}
