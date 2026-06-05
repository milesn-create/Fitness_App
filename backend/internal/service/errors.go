package service

import "errors"

var (
	ErrNotFound                        = errors.New("not found")
	ErrInvalidCredentials              = errors.New("invalid credentials")
	ErrEmailExists                     = errors.New("email already exists")
	ErrTrainerRegistrationNotAllowed   = errors.New("trainer registration is not allowed")
	ErrForbidden                       = errors.New("forbidden")
	ErrTrainerRequired                 = errors.New("trainer required")
	ErrInvalidTrainer                  = errors.New("invalid trainer")
	ErrAlreadyBooked                   = errors.New("already booked")
	ErrWorkoutPast                     = errors.New("workout past")
	ErrNoAvailableSpots                = errors.New("no available spots")
	ErrTimeConflict                    = errors.New("time conflict")
	ErrInvalidRole                     = errors.New("invalid role")
	ErrCannotDeleteSelf                = errors.New("cannot delete self")
	ErrBookingNotActive                = errors.New("booking not active")
	ErrWorkoutInPast                   = errors.New("workout in past")
)
