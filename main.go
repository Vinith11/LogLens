package main

import (
	"loglens/api"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize Gin router
	r := gin.Default()

	// Register routes
	api.RegisterRoutes(r)

	// Start the server
	r.Run(":8080") // Runs on localhost:8080
}
