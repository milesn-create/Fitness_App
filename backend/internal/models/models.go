package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleClient  Role = "client"
	RoleTrainer Role = "trainer"
	RoleAdmin   Role = "admin"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name         string    `gorm:"not null" json:"name"`
	Email        string    `gorm:"unique;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Role         Role      `gorm:"not null;default:'client'" json:"role"`
	Avatar       string    `json:"avatar"`
	Bio          string    `json:"bio"`
	Experience   string    `json:"experience"`
	CreatedAt    time.Time `json:"created_at"`
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type TokenResponse struct {
	Token string `json:"token"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type Workout struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	TrainerID   uuid.UUID `gorm:"type:uuid;not null" json:"trainer_id"`
	Trainer     User      `gorm:"foreignKey:TrainerID" json:"trainer,omitempty"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	Photo       string    `json:"photo"`
	StartsAt    time.Time `gorm:"not null" json:"starts_at"`
	Duration    int       `gorm:"not null" json:"duration"`
	Capacity    int       `gorm:"not null" json:"capacity"`
	CreatedAt   time.Time `json:"created_at"`
	Bookings    []Booking `gorm:"foreignKey:WorkoutID" json:"bookings,omitempty"`
}

func (w *Workout) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}

type BookingStatus string

const (
	BookingActive    BookingStatus = "active"
	BookingCancelled BookingStatus = "cancelled"
)

type Booking struct {
	ID        uuid.UUID     `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID     `gorm:"type:uuid;not null" json:"user_id"`
	User      User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	WorkoutID uuid.UUID     `gorm:"type:uuid;not null" json:"workout_id"`
	Workout   Workout       `gorm:"foreignKey:WorkoutID" json:"workout,omitempty"`
	Status    BookingStatus `gorm:"not null;default:'active'" json:"status"`
	Attended  bool          `gorm:"not null;default:false" json:"attended"`
	CreatedAt time.Time     `json:"created_at"`
}

func (b *Booking) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}
