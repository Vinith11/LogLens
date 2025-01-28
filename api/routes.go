package api

import (
	"loglens/handllers"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes registers all the routes for the application
func RegisterRoutes(r *gin.Engine) {
	// Route to fetch running containers
	r.GET("/containers", handlers.GetContainers)
}
