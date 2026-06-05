package service

import (
	"errors"
	"fitness-app/internal/models"
	"fmt"

	"gorm.io/gorm"
)

type ProfileService struct {
	db *gorm.DB
}

func NewProfileService(db *gorm.DB) *ProfileService {
	return &ProfileService{db: db}
}

type ProfileUpdateInput struct {
	Name       string
	Bio        string
	Experience string
}

func (s *ProfileService) UpdateProfile(userID string, input ProfileUpdateInput) (models.User, error) {
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.User{}, ErrNotFound
		}
		return models.User{}, fmt.Errorf("find user: %w", err)
	}

	updates := map[string]interface{}{}
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if user.Role == models.RoleTrainer {
		updates["bio"] = input.Bio
		updates["experience"] = input.Experience
	}

	if len(updates) == 0 {
		return user, nil
	}

	if err := s.db.Model(&user).Updates(updates).Error; err != nil {
		return models.User{}, fmt.Errorf("update profile: %w", err)
	}

	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return models.User{}, fmt.Errorf("reload user: %w", err)
	}
	return user, nil
}

func (s *ProfileService) UpdateAvatar(userID, avatarPath string) (string, error) {
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", ErrNotFound
		}
		return "", fmt.Errorf("find user: %w", err)
	}

	if err := s.db.Model(&user).Update("avatar", avatarPath).Error; err != nil {
		return "", fmt.Errorf("update avatar: %w", err)
	}

	return avatarPath, nil
}
