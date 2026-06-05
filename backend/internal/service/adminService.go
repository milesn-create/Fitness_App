package service

import (
	"errors"
	"fitness-app/internal/models"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type CreateUserInput struct {
	Name     string
	Email    string
	Password string
	Role     models.Role
}

type UpdateUserInput struct {
	Name  string
	Email string
	Role  models.Role
}

type AdminStats struct {
	TotalBookings int64 `json:"total_bookings"`
	TotalWorkouts int64 `json:"total_workouts"`
	TotalTrainers int64 `json:"total_trainers"`
	TotalClients  int64 `json:"total_clients"`
	TrainerLoad   []struct {
		TrainerName string `json:"trainer_name"`
		Workouts    int64  `json:"workouts"`
		Bookings    int64  `json:"bookings"`
	} `json:"trainer_load"`
}

type AdminService struct {
	db *gorm.DB
}

func NewAdminService(db *gorm.DB) *AdminService {
	return &AdminService{db: db}
}

func (s *AdminService) ListTrainers() ([]models.User, error) {
	var trainers []models.User
	if err := s.db.Where("role = ?", models.RoleTrainer).Find(&trainers).Error; err != nil {
		return nil, fmt.Errorf("list trainers: %w", err)
	}
	return trainers, nil
}

func (s *AdminService) ListUsers() ([]models.User, error) {
	var users []models.User
	if err := s.db.Order("created_at desc").Find(&users).Error; err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	return users, nil
}

func (s *AdminService) CreateUser(input CreateUserInput) (models.User, error) {
	if input.Role != models.RoleClient && input.Role != models.RoleTrainer && input.Role != models.RoleAdmin {
		return models.User{}, ErrInvalidRole
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return models.User{}, fmt.Errorf("hash password: %w", err)
	}

	user := models.User{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(hash),
		Role:         input.Role,
	}
	if err := s.db.Create(&user).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "UNIQUE") {
			return models.User{}, ErrEmailExists
		}
		return models.User{}, fmt.Errorf("create user: %w", err)
	}
	return user, nil
}

func (s *AdminService) UpdateUser(userID string, input UpdateUserInput) (models.User, error) {
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.User{}, ErrNotFound
		}
		return models.User{}, fmt.Errorf("find user: %w", err)
	}

	updates := map[string]interface{}{"name": input.Name, "role": input.Role}
	if input.Email != "" {
		updates["email"] = input.Email
	}
	if err := s.db.Model(&user).Updates(updates).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "UNIQUE") {
			return models.User{}, ErrEmailExists
		}
		return models.User{}, fmt.Errorf("update user: %w", err)
	}
	if err := s.db.First(&user, "id = ?", user.ID).Error; err != nil {
		return models.User{}, fmt.Errorf("reload user: %w", err)
	}
	return user, nil
}

func (s *AdminService) DeleteUser(callerID, targetID string) error {
	if targetID == callerID {
		return ErrCannotDeleteSelf
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, "id = ?", targetID).Error; err != nil {
			return err
		}
		if user.Role == models.RoleTrainer {
			var workoutIDs []uuid.UUID
			if err := tx.Model(&models.Workout{}).Where("trainer_id = ?", user.ID).Pluck("id", &workoutIDs).Error; err != nil {
				return err
			}
			if len(workoutIDs) > 0 {
				if err := tx.Where("workout_id IN ?", workoutIDs).Delete(&models.Booking{}).Error; err != nil {
					return err
				}
				if err := tx.Where("trainer_id = ?", user.ID).Delete(&models.Workout{}).Error; err != nil {
					return err
				}
			}
		}
		if user.Role == models.RoleClient {
			if err := tx.Where("user_id = ?", user.ID).Delete(&models.Booking{}).Error; err != nil {
				return err
			}
		}
		return tx.Delete(&user).Error
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("delete user: %w", err)
	}
	return nil
}

func (s *AdminService) GetStats() (AdminStats, error) {
	var stats AdminStats
	s.db.Model(&models.Booking{}).Where("status = 'active'").Count(&stats.TotalBookings)
	s.db.Model(&models.Workout{}).Count(&stats.TotalWorkouts)
	s.db.Model(&models.User{}).Where("role = ?", models.RoleTrainer).Count(&stats.TotalTrainers)
	s.db.Model(&models.User{}).Where("role = ?", models.RoleClient).Count(&stats.TotalClients)
	if err := s.db.Raw(`
		SELECT u.name as trainer_name,
		       COUNT(DISTINCT w.id) as workouts,
		       COUNT(DISTINCT b.id) as bookings
		FROM users u
		LEFT JOIN workouts w ON w.trainer_id = u.id
		LEFT JOIN bookings b ON b.workout_id = w.id AND b.status = 'active'
		WHERE u.role = 'trainer'
		GROUP BY u.id, u.name
		ORDER BY bookings DESC
	`).Scan(&stats.TrainerLoad).Error; err != nil {
		return AdminStats{}, fmt.Errorf("trainer load stats: %w", err)
	}
	return stats, nil
}
