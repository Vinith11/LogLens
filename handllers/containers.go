package handlers

import (
	"context"
	"net/http"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/gin-gonic/gin"
)


func GetContainers(c *gin.Context) {
	// Get the filter type from the query parameter
	filterType := c.DefaultQuery("filter", "all")

	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()

	// Set up listing options based on filter type
	listOptions := container.ListOptions{}

	switch filterType {
	case "all":
		listOptions.All = true
	case "running":
		listOptions.All = false // Only running containers
	case "stopped":
		listOptions.All = true
		listOptions.Filters = filters.NewArgs(filters.Arg("status", "exited"))
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filter type. Use 'all', 'running', or 'stopped'"})
		return
	}

	containers, err := cli.ContainerList(context.Background(), listOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch containers"})
		return
	}

	var containerDetails []map[string]interface{}
	for _, container := range containers {
		containerDetails = append(containerDetails, map[string]interface{}{
			"ID":    container.ID[:12],
			"Image": container.Image,
			"Names": container.Names,
			"State": container.State,
		})
	}

	c.JSON(http.StatusOK, gin.H{"containers": containerDetails})
}
