package main

import (
	"loglens/api"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize Gin router
	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	// Register routes
	api.RegisterRoutes(r)

	// Start the server
	r.Run(":8080") // Runs on localhost:8080
}
