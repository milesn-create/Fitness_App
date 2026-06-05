package app

import (
	"fitness-app/internal/config"
	"fitness-app/internal/handlers"
	"fitness-app/internal/service"
	"fitness-app/internal/transport"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type App struct {
	DB *gorm.DB
}

func NewApp(cfg *config.Config) *App {
	return &App{
		DB: cfg.DB,
	}
}

func (a *App) Run() {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", os.Getenv("FRONTEND_URL")},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.Static("/uploads", "./uploads")
	os.MkdirAll("./uploads/avatars", 0755)
	os.MkdirAll("./uploads/workouts", 0755)

	authService := service.NewAuthService(a.DB)
	profileService := service.NewProfileService(a.DB)
	workoutService := service.NewWorkoutService(a.DB)
	adminService := service.NewAdminService(a.DB)

	handler := handlers.NewHandler(authService, profileService, workoutService, adminService)
	transport.SetupRoutes(r, handler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server running on port %s", port)
	r.Run(":" + port)
}
