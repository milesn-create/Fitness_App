package handlers

import (
	"fitness-app/internal/models"
	"fitness-app/internal/service"
	"fitness-app/pkg/util"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) ListTrainers(c *gin.Context) {
	trainers, err := h.admin.ListTrainers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось загрузить тренеров"})
		return
	}
	c.JSON(http.StatusOK, trainers)
}

func (h *Handler) ListUsers(c *gin.Context) {
	users, err := h.admin.ListUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось загрузить пользователей"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *Handler) CreateUser(c *gin.Context) {
	var req struct {
		Name     string      `json:"name" binding:"required"`
		Email    string      `json:"email" binding:"required,email"`
		Password string      `json:"password" binding:"required,min=8"`
		Role     models.Role `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": util.BindErrorMessage(err)})
		return
	}

	user, err := h.admin.CreateUser(service.CreateUserInput{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
		Role:     req.Role,
	})
	if err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusInternalServerError {
			msg = "Failed to create user"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusCreated, user)
}

func (h *Handler) UpdateUser(c *gin.Context) {
	var req struct {
		Name  string      `json:"name"`
		Email string      `json:"email"`
		Role  models.Role `json:"role"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": util.BindErrorMessage(err)})
		return
	}

	user, err := h.admin.UpdateUser(c.Param("id"), service.UpdateUserInput{
		Name:  req.Name,
		Email: req.Email,
		Role:  req.Role,
	})
	if err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusNotFound {
			msg = "User not found"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *Handler) DeleteUser(c *gin.Context) {
	if err := h.admin.DeleteUser(c.GetString("user_id"), c.Param("id")); err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusNotFound {
			msg = "User not found"
		}
		if status == http.StatusInternalServerError {
			msg = "Не удалось удалить пользователя"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

func (h *Handler) GetStats(c *gin.Context) {
	stats, err := h.admin.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось загрузить статистику"})
		return
	}
	c.JSON(http.StatusOK, stats)
}
