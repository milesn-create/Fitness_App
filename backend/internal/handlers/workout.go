package handlers

import (
	"errors"
	"fitness-app/internal/service"
	"fitness-app/pkg/util"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type WorkoutRequest struct {
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description"`
	StartsAt    time.Time `json:"starts_at" binding:"required"`
	Duration    int       `json:"duration" binding:"required"`
	Capacity    int       `json:"capacity" binding:"required"`
	TrainerID   string    `json:"trainer_id"`
}

func workoutInputFromRequest(req WorkoutRequest) service.WorkoutInput {
	return service.WorkoutInput{
		Title:       req.Title,
		Description: req.Description,
		StartsAt:    req.StartsAt,
		Duration:    req.Duration,
		Capacity:    req.Capacity,
		TrainerID:   req.TrainerID,
	}
}

func (h *Handler) ListWorkouts(c *gin.Context) {
	workouts, err := h.workout.List(
		c.Query("date"),
		c.Query("trainer_id"),
		c.Query("include_past") == "true",
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось загрузить тренировки"})
		return
	}
	c.JSON(http.StatusOK, workouts)
}

func (h *Handler) GetWorkout(c *gin.Context) {
	workout, err := h.workout.GetByID(c.Param("id"))
	if err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusNotFound {
			msg = "Workout not found"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, workout)
}

func (h *Handler) CreateWorkout(c *gin.Context) {
	var req WorkoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": util.BindErrorMessage(err)})
		return
	}

	workout, err := h.workout.Create(c.GetString("role"), c.GetString("user_id"), workoutInputFromRequest(req))
	if err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusInternalServerError {
			msg = "Не удалось создать тренировку"
		}
		if status == http.StatusBadRequest && errors.Is(err, service.ErrWorkoutInPast) {
			msg = "Нельзя создать тренировку в прошлом"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusCreated, workout)
}

func (h *Handler) UpdateWorkout(c *gin.Context) {
	var req WorkoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": util.BindErrorMessage(err)})
		return
	}

	workout, err := h.workout.Update(
		c.GetString("role"),
		c.GetString("user_id"),
		c.Param("id"),
		workoutInputFromRequest(req),
	)
	if err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusNotFound {
			msg = "Workout not found"
		}
		if status == http.StatusBadRequest && errors.Is(err, service.ErrWorkoutInPast) {
			msg = "Нельзя перенести тренировку в прошлое"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, workout)
}

func (h *Handler) DeleteWorkout(c *gin.Context) {
	if err := h.workout.Delete(c.GetString("role"), c.GetString("user_id"), c.Param("id")); err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusNotFound {
			msg = "Workout not found"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Workout deleted"})
}

func (h *Handler) UploadWorkoutPhoto(c *gin.Context) {
	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	filename, err := saveUploadedFile(file, "./uploads/workouts", c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	photoPath := "/uploads/workouts/" + filename

	path, err := h.workout.UpdatePhoto(c.Param("id"), photoPath)
	if err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusNotFound {
			msg = "Workout not found"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, gin.H{"photo": path})
}

func (h *Handler) Book(c *gin.Context) {
	booking, err := h.workout.Book(c.GetString("user_id"), c.Param("id"))
	if err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusNotFound {
			msg = "Workout not found"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusCreated, booking)
}

func (h *Handler) CancelBooking(c *gin.Context) {
	if err := h.workout.CancelBooking(c.GetString("role"), c.GetString("user_id"), c.Param("id")); err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusNotFound {
			msg = "Booking not found"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Booking cancelled"})
}

func (h *Handler) MyBookings(c *gin.Context) {
	bookings, err := h.workout.MyBookings(c.GetString("user_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось загрузить записи"})
		return
	}
	c.JSON(http.StatusOK, bookings)
}

func (h *Handler) MarkAttended(c *gin.Context) {
	booking, err := h.workout.MarkAttended(c.GetString("role"), c.GetString("user_id"), c.Param("id"))
	if err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusNotFound {
			msg = "Запись не найдена"
		}
		if status == http.StatusForbidden {
			msg = "Нет доступа"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, booking)
}
