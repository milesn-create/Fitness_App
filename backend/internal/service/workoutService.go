package service

import (
	"errors"
	"fitness-app/internal/models"
	"fitness-app/pkg/util"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WorkoutInput struct {
	Title       string
	Description string
	StartsAt    time.Time
	Duration    int
	Capacity    int
	TrainerID   string
}

type WorkoutService struct {
	db *gorm.DB
}

func NewWorkoutService(db *gorm.DB) *WorkoutService {
	return &WorkoutService{db: db}
}

func (s *WorkoutService) resolveTrainerID(callerRole, callerID string, input WorkoutInput) (uuid.UUID, error) {
	if callerRole == string(models.RoleAdmin) {
		if input.TrainerID == "" {
			return uuid.Nil, ErrTrainerRequired
		}
		trainerID, err := uuid.Parse(input.TrainerID)
		if err != nil {
			return uuid.Nil, ErrInvalidTrainer
		}
		var trainer models.User
		if err := s.db.First(&trainer, "id = ? AND role = ?", trainerID, models.RoleTrainer).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return uuid.Nil, ErrInvalidTrainer
			}
			return uuid.Nil, fmt.Errorf("find trainer: %w", err)
		}
		return trainerID, nil
	}
	return uuid.Parse(callerID)
}

func (s *WorkoutService) List(date, trainerID string, includePast bool) ([]models.Workout, error) {
	var workouts []models.Workout
	query := s.db.Preload("Trainer").Preload("Bookings", func(db *gorm.DB) *gorm.DB {
		return db.Where("status = ?", models.BookingActive).Preload("User")
	})

	if date != "" {
		query = query.Where("starts_at >= ?::date AND starts_at < (?::date + interval '1 day')", date, date)
	}
	if trainerID != "" {
		query = query.Where("trainer_id = ?", trainerID)
	}
	if !includePast {
		query = query.Where("starts_at >= ?", time.Now())
	}

	if err := query.Order("starts_at asc").Find(&workouts).Error; err != nil {
		return nil, fmt.Errorf("list workouts: %w", err)
	}
	return workouts, nil
}

func (s *WorkoutService) GetByID(id string) (models.Workout, error) {
	var workout models.Workout
	if err := s.db.Preload("Trainer").Preload("Bookings.User").
		First(&workout, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.Workout{}, ErrNotFound
		}
		return models.Workout{}, fmt.Errorf("find workout: %w", err)
	}
	return workout, nil
}

func (s *WorkoutService) Create(callerRole, callerID string, input WorkoutInput) (models.Workout, error) {
	if err := util.ValidateWorkoutStartsAt(input.StartsAt); err != nil {
		return models.Workout{}, ErrWorkoutInPast
	}

	trainerID, err := s.resolveTrainerID(callerRole, callerID, input)
	if err != nil {
		return models.Workout{}, err
	}

	workout := models.Workout{
		TrainerID:   trainerID,
		Title:       input.Title,
		Description: input.Description,
		StartsAt:    input.StartsAt,
		Duration:    input.Duration,
		Capacity:    input.Capacity,
	}
	if err := s.db.Create(&workout).Error; err != nil {
		return models.Workout{}, fmt.Errorf("create workout: %w", err)
	}
	if err := s.db.Preload("Trainer").First(&workout, "id = ?", workout.ID).Error; err != nil {
		return models.Workout{}, fmt.Errorf("reload workout: %w", err)
	}
	return workout, nil
}

func (s *WorkoutService) Update(callerRole, callerID, workoutID string, input WorkoutInput) (models.Workout, error) {
	var workout models.Workout
	if err := s.db.First(&workout, "id = ?", workoutID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.Workout{}, ErrNotFound
		}
		return models.Workout{}, fmt.Errorf("find workout: %w", err)
	}
	if callerRole != string(models.RoleAdmin) && workout.TrainerID.String() != callerID {
		return models.Workout{}, ErrForbidden
	}

	if err := util.ValidateWorkoutStartsAt(input.StartsAt); err != nil {
		return models.Workout{}, ErrWorkoutInPast
	}

	updates := models.Workout{
		Title:       input.Title,
		Description: input.Description,
		StartsAt:    input.StartsAt,
		Duration:    input.Duration,
		Capacity:    input.Capacity,
	}
	if callerRole == string(models.RoleAdmin) && input.TrainerID != "" {
		trainerID, err := s.resolveTrainerID(callerRole, callerID, input)
		if err != nil {
			return models.Workout{}, err
		}
		updates.TrainerID = trainerID
	}

	if err := s.db.Model(&workout).Updates(updates).Error; err != nil {
		return models.Workout{}, fmt.Errorf("update workout: %w", err)
	}
	if err := s.db.Preload("Trainer").First(&workout, "id = ?", workout.ID).Error; err != nil {
		return models.Workout{}, fmt.Errorf("reload workout: %w", err)
	}
	return workout, nil
}

func (s *WorkoutService) Delete(callerRole, callerID, workoutID string) error {
	var workout models.Workout
	if err := s.db.First(&workout, "id = ?", workoutID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("find workout: %w", err)
	}
	if callerRole != string(models.RoleAdmin) && workout.TrainerID.String() != callerID {
		return ErrForbidden
	}
	if err := s.db.Delete(&workout).Error; err != nil {
		return fmt.Errorf("delete workout: %w", err)
	}
	return nil
}

func (s *WorkoutService) UpdatePhoto(workoutID, photoPath string) (string, error) {
	var workout models.Workout
	if err := s.db.First(&workout, "id = ?", workoutID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", ErrNotFound
		}
		return "", fmt.Errorf("find workout: %w", err)
	}
	if err := s.db.Model(&workout).Update("photo", photoPath).Error; err != nil {
		return "", fmt.Errorf("update photo: %w", err)
	}
	return photoPath, nil
}

func (s *WorkoutService) Book(userIDStr, workoutIDStr string) (models.Booking, error) {
	workoutID, err := uuid.Parse(workoutIDStr)
	if err != nil {
		return models.Booking{}, fmt.Errorf("parse workout id: %w", err)
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return models.Booking{}, fmt.Errorf("parse user id: %w", err)
	}

	var existing models.Booking
	if err := s.db.Where("user_id = ? AND workout_id = ? AND status = 'active'", userID, workoutID).
		First(&existing).Error; err == nil {
		return models.Booking{}, ErrAlreadyBooked
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return models.Booking{}, fmt.Errorf("check existing booking: %w", err)
	}

	var workout models.Workout
	if err := s.db.Preload("Bookings", "status = 'active'").First(&workout, "id = ?", workoutID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.Booking{}, ErrNotFound
		}
		return models.Booking{}, fmt.Errorf("find workout: %w", err)
	}
	if util.WorkoutStarted(workout, time.Now()) {
		return models.Booking{}, ErrWorkoutPast
	}
	if len(workout.Bookings) >= workout.Capacity {
		return models.Booking{}, ErrNoAvailableSpots
	}

	var userBookings []models.Booking
	if err := s.db.Preload("Workout").Where("user_id = ? AND status = 'active'", userID).Find(&userBookings).Error; err != nil {
		return models.Booking{}, fmt.Errorf("list user bookings: %w", err)
	}
	for _, b := range userBookings {
		if b.WorkoutID != workoutID && util.WorkoutsOverlap(workout, b.Workout) {
			return models.Booking{}, ErrTimeConflict
		}
	}

	booking := models.Booking{UserID: userID, WorkoutID: workoutID, Status: models.BookingActive}
	if err := s.db.Create(&booking).Error; err != nil {
		return models.Booking{}, fmt.Errorf("create booking: %w", err)
	}
	if err := s.db.Preload("Workout.Trainer").First(&booking, "id = ?", booking.ID).Error; err != nil {
		return models.Booking{}, fmt.Errorf("reload booking: %w", err)
	}
	return booking, nil
}

func (s *WorkoutService) CancelBooking(callerRole, callerID, bookingID string) error {
	var booking models.Booking
	if err := s.db.First(&booking, "id = ?", bookingID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("find booking: %w", err)
	}
	if callerRole != string(models.RoleAdmin) && booking.UserID.String() != callerID {
		return ErrForbidden
	}
	if err := s.db.Model(&booking).Update("status", models.BookingCancelled).Error; err != nil {
		return fmt.Errorf("cancel booking: %w", err)
	}
	return nil
}

func (s *WorkoutService) MyBookings(userID string) ([]models.Booking, error) {
	var bookings []models.Booking
	if err := s.db.Preload("Workout.Trainer").Where("user_id = ?", userID).
		Order("created_at desc").Find(&bookings).Error; err != nil {
		return nil, fmt.Errorf("list bookings: %w", err)
	}
	return bookings, nil
}

func (s *WorkoutService) MarkAttended(callerRole, callerID, bookingID string) (models.Booking, error) {
	callerUUID, _ := uuid.Parse(callerID)
	var booking models.Booking
	if err := s.db.Preload("Workout").First(&booking, "id = ?", bookingID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.Booking{}, ErrNotFound
		}
		return models.Booking{}, fmt.Errorf("find booking: %w", err)
	}
	if callerRole != string(models.RoleAdmin) && booking.Workout.TrainerID != callerUUID {
		return models.Booking{}, ErrForbidden
	}
	if booking.Status != models.BookingActive {
		return models.Booking{}, ErrBookingNotActive
	}
	if err := s.db.Model(&booking).Update("attended", true).Error; err != nil {
		return models.Booking{}, fmt.Errorf("mark attended: %w", err)
	}
	booking.Attended = true
	return booking, nil
}
