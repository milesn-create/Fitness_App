package transport

import (
	"fitness-app/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, h *handlers.Handler) {
	api := r.Group("/api")

	api.POST("/auth/register", h.Register)
	api.POST("/auth/login", h.Login)
	api.GET("/workouts", h.ListWorkouts)
	api.GET("/workouts/:id", h.GetWorkout)
	api.GET("/trainers", h.ListTrainers)

	protected := api.Group("/")
	protected.Use(AuthMiddleware())

	protected.GET("/auth/me", h.Me)
	protected.PUT("/profile", h.UpdateProfile)
	protected.POST("/profile/avatar", h.UploadAvatar)

	protected.GET("/bookings/my", h.MyBookings)
	protected.POST("/workouts/:id/book", h.Book)
	protected.PUT("/bookings/:id/cancel", h.CancelBooking)
	protected.PUT("/bookings/:id/attend", h.MarkAttended)

	trainer := protected.Group("/")
	trainer.Use(RequireRole("trainer", "admin"))
	trainer.POST("/workouts", h.CreateWorkout)
	trainer.PUT("/workouts/:id", h.UpdateWorkout)
	trainer.DELETE("/workouts/:id", h.DeleteWorkout)
	trainer.POST("/workouts/:id/photo", h.UploadWorkoutPhoto)

	adminRoutes := protected.Group("/admin")
	adminRoutes.Use(RequireRole("admin"))
	adminRoutes.GET("/users", h.ListUsers)
	adminRoutes.POST("/users", h.CreateUser)
	adminRoutes.PUT("/users/:id", h.UpdateUser)
	adminRoutes.DELETE("/users/:id", h.DeleteUser)
	adminRoutes.GET("/stats", h.GetStats)
}
