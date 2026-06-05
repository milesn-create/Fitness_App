package handlers

import (
	"fitness-app/internal/models"
	"fitness-app/internal/service"
	"fitness-app/pkg/util"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	auth    *service.AuthService
	profile *service.ProfileService
	workout *service.WorkoutService
	admin   *service.AdminService
}

func NewHandler(
	auth *service.AuthService,
	profile *service.ProfileService,
	workout *service.WorkoutService,
	admin *service.AdminService,
) *Handler {
	return &Handler{
		auth:    auth,
		profile: profile,
		workout: workout,
		admin:   admin,
	}
}

func (h *Handler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": util.BindErrorMessage(err)})
		return
	}

	token, user, err := h.auth.Register(&req)
	if err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusInternalServerError {
			msg = "Не удалось зарегистрироваться"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"token": token, "user": user})
}

func (h *Handler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": util.BindErrorMessage(err)})
		return
	}

	token, user, err := h.auth.Login(&req)
	if err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusInternalServerError {
			msg = "Не удалось выполнить вход"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

func (h *Handler) Me(c *gin.Context) {
	user, err := h.auth.GetUserByID(c.GetString("user_id"))
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

func (h *Handler) UpdateProfile(c *gin.Context) {
	var req struct {
		Name       string `json:"name"`
		Bio        string `json:"bio"`
		Experience string `json:"experience"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": util.BindErrorMessage(err)})
		return
	}

	user, err := h.profile.UpdateProfile(c.GetString("user_id"), service.ProfileUpdateInput{
		Name:       req.Name,
		Bio:        req.Bio,
		Experience: req.Experience,
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

func (h *Handler) UploadAvatar(c *gin.Context) {
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	filename, err := saveUploadedFile(file, "./uploads/avatars", c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	avatarPath := "/uploads/avatars/" + filename

	path, err := h.profile.UpdateAvatar(c.GetString("user_id"), avatarPath)
	if err != nil {
		status, msg := statusFromError(err)
		if status == http.StatusNotFound {
			msg = "User not found"
		}
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, gin.H{"avatar": path})
}
