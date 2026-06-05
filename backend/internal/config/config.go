package config

import (
	"fitness-app/internal/models"
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Config struct {
	DB *gorm.DB
}

func Load() *Config {
	return &Config{
		DB: connectDB(),
	}
}

func connectDB() *gorm.DB {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
			env("DB_HOST", "localhost"),
			env("DB_USER", "postgres"),
			env("DB_PASSWORD", "postgres"),
			env("DB_NAME", "fitness"),
			env("DB_PORT", "5432"),
		)
	}

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}
	log.Println("Database connected successfully")
	migrateDB(database)
	return database
}

func migrateDB(database *gorm.DB) {
	if err := database.AutoMigrate(
		&models.User{},
		&models.Workout{},
		&models.Booking{},
	); err != nil {
		log.Fatal("Migration failed: ", err)
	}
	log.Println("Database migrated successfully")
}

func env(key, defaultValue string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultValue
}
