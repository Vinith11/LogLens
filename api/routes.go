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
	r.GET("/container-stats/:id", handlers.GetContainerStats)

	// Route for container logs
	r.GET("/container-logs/:id", handlers.GetContainerLogs)

	// Route for volumes
	r.GET("/volumes", handlers.GetVolumes)

	// Route for images
	r.GET("/images", handlers.GetAllImages)

	// Route for docker compose
	r.GET("/docker-compose", handlers.GetDockerCompose)

}
