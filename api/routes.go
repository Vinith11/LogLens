package api

import (
	handlers "loglens/handllers"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes registers all the routes for the application
func RegisterRoutes(r *gin.Engine) {
	// Route for fetch all containers
	r.GET("/containers-all", handlers.GetAllContainers)
	r.GET("/containers-running", handlers.GetRunningContainers)
	r.GET("/containers-stopped", handlers.GetStoppedContainers)

	// Route for container by ID
	r.GET("/container/:id", handlers.GetContainerByID)
	r.GET("/container-start/:id", handlers.StartContainer)
	r.GET("/container-stop/:id", handlers.StopContainer)
}
