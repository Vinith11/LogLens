package handlers

import (
    "context"
	"net/http"

    "github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/gin-gonic/gin"
)

func Dashboard(c *gin.Context) {
    cli, err := client.NewClientWithOpts(client.FromEnv)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
        return
    }
    defer cli.Close()

    allContainers, err := cli.ContainerList(context.Background(), container.ListOptions{All: true})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch containers"})
        return
    }

    totalContainers := len(allContainers)
    runningContainers, err := cli.ContainerList(context.Background(), container.ListOptions{All: false})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch containers"})
        return
    }
    var containerDetails []map[string]interface{}
	for _, container := range runningContainers {
		containerDetails = append(containerDetails, map[string]interface{}{
			"ID":    container.ID[:12],
			"Image": container.Image,
			"Names": container.Names,
			"State": container.State,
		})
	}

    totalRunningContainers := len(runningContainers)

    c.JSON(http.StatusOK, gin.H{
        "totalContainers":        totalContainers,
        "totalRunningContainers": totalRunningContainers,
        "containers":             containerDetails,
    })

}