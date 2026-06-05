package handlers

import (
	"mime/multipart"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func saveUploadedFile(file *multipart.FileHeader, dir string, c *gin.Context) (string, error) {
	filename := uuid.New().String() + filepath.Ext(file.Filename)
	if err := c.SaveUploadedFile(file, dir+"/"+filename); err != nil {
		return "", err
	}
	return filename, nil
}
