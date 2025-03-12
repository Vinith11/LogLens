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

	// Serve static files (CSS, JS, images, etc.)
    r.Static("/static", "./static")

    // Serve the HTML file
    r.LoadHTMLFiles("static/index.html")

    // Route to serve HTML page
    r.GET("/", func(c *gin.Context) {
        c.HTML(200, "index.html", nil)
    })

    // Example API endpoint
    r.GET("/api/data", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "Hello from Go backend!"})
    })


	// Start the server
	r.Run(":8080") // Runs on localhost:8080
}
