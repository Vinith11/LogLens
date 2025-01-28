package handlers

import (
	"context"
	"net/http"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/gin-gonic/gin"
)


// GetContainers fetches and returns all running containers
func GetAllContainers(c *gin.Context) {
	// Create a Docker client
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()

	// Fetch the list of containers
	containers, err := cli.ContainerList(context.Background(), container.ListOptions{All: true})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch containers"})
		return
	}

	// Format container details for response
	var containerDetails []map[string]interface{}
	for _, container := range containers {
		containerDetails = append(containerDetails, map[string]interface{}{
			"ID":    container.ID[:12], // Short container ID
			"Image": container.Image,   // Container image name
			"Names": container.Names,   // Container names
			"State": container.State,   // Container state (e.g., running)
		})
	}

	// Send the response
	c.JSON(http.StatusOK, gin.H{"containers": containerDetails})
}

func GetRunningContainers(c *gin.Context) {
	// Create a Docker client
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()

	// Fetch the list of containers
	containers, err := cli.ContainerList(context.Background(), container.ListOptions{All: false})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch containers"})
		return
	}

	// Format container details for response
	var containerDetails []map[string]interface{}
	for _, container := range containers {
		containerDetails = append(containerDetails, map[string]interface{}{
			"ID":    container.ID[:12], // Short container ID
			"Image": container.Image,   // Container image name
			"Names": container.Names,   // Container names
			"State": container.State,   // Container state (e.g., running)
		})
	}

	// Send the response
	c.JSON(http.StatusOK, gin.H{"containers": containerDetails})
}

func GetStoppedContainers(c *gin.Context) {
	// Create a Docker client
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()

	// Fetch the list of containers
	containers, err := cli.ContainerList(context.Background(), container.ListOptions{All: true, Filters: filters.NewArgs(filters.Arg("status", "exited"))})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch containers"})
		return
	}

	// Format container details for response
	var containerDetails []map[string]interface{}
	for _, container := range containers {
		containerDetails = append(containerDetails, map[string]interface{}{
			"ID":    container.ID[:12], // Short container ID
			"Image": container.Image,   // Container image name
			"Names": container.Names,   // Container names
			"State": container.State,   // Container state (e.g., running)
		})
	}

	// Send the response
	c.JSON(http.StatusOK, gin.H{"containers": containerDetails})
}
