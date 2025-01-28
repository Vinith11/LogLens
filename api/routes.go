package api

import (
	"loglens/handllers"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes registers all the routes for the application
func RegisterRoutes(r *gin.Engine) {
	// Route to fetch running containers
	r.GET("/containers-all", handlers.GetAllContainers)
	r.GET("/containers-running", handlers.GetRunningContainers)
	r.GET("/containers-stopped", handlers.GetStoppedContainers)
}
