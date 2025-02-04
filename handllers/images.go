package handlers

import (
	"context"
	"net/http"

	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/gin-gonic/gin"
)

func GetAllImages(c *gin.Context) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()

	images, err := cli.ImageList(context.Background(), image.ListOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images"})
		return
	}

	var imageDetails []map[string]interface{}
	for _, image := range images {
		imageDetails = append(imageDetails, map[string]interface{}{
			"ID":       image.ID,
			"RepoTags": image.RepoTags,
			"Created":  image.Created,
			"Size":     image.Size / 1024 / 1024,
			"Labels":   image.Labels,
		})
	}

	c.JSON(http.StatusOK, imageDetails)
}
