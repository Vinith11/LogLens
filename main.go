package main

import (
	"loglens/api"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	api.RegisterRoutes(r)

    r.Static("/static", "./static")

    r.LoadHTMLFiles("static/index.html")

    r.GET("/", func(c *gin.Context) {
        c.HTML(200, "index.html", nil)
    })

    r.GET("/api/data", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "Hello from Go backend!"})
    })


	r.Run(":8080") // Runs on localhost:8080
}
