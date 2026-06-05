package service

import (
	"errors"
	"fitness-app/internal/models"
	"fitness-app/pkg/jwtutil"
	"fmt"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

func (s *AuthService) Register(req *models.RegisterRequest) (string, models.User, error) {
	if req.Role != "" && req.Role != string(models.RoleClient) {
		return "", models.User{}, ErrTrainerRegistrationNotAllowed
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return "", models.User{}, fmt.Errorf("hash password: %w", err)
	}

	user := models.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         models.RoleClient,
	}

	if err := s.db.Create(&user).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "UNIQUE") {
			return "", models.User{}, ErrEmailExists
		}
		return "", models.User{}, fmt.Errorf("create user: %w", err)
	}

	token, err := jwtutil.GenerateToken(user)
	if err != nil {
		return "", models.User{}, fmt.Errorf("generate token: %w", err)
	}

	return token, user, nil
}

func (s *AuthService) Login(req *models.LoginRequest) (string, models.User, error) {
	var user models.User
	if err := s.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", models.User{}, ErrInvalidCredentials
		}
		return "", models.User{}, fmt.Errorf("find user: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return "", models.User{}, ErrInvalidCredentials
	}

	token, err := jwtutil.GenerateToken(user)
	if err != nil {
		return "", models.User{}, fmt.Errorf("generate token: %w", err)
	}

	return token, user, nil
}

func (s *AuthService) GetUserByID(userID string) (models.User, error) {
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.User{}, ErrNotFound
		}
		return models.User{}, fmt.Errorf("find user: %w", err)
	}
	return user, nil
}
