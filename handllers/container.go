package handlers

import (
	"context"
	"net/http"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/gin-gonic/gin"
)

func GetContainerByID(c *gin.Context) {
	containerID := c.Param("id")

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()

	containerJSON, err := cli.ContainerInspect(context.Background(), containerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to inspect container"})
		return
	}

	var containerDetails []map[string]interface{}
	containerDetails = append(containerDetails, map[string]interface{}{
		"ID":    containerJSON.ID[:12],
		"Image": containerJSON.Image,   
		"Name": containerJSON.Name,   
		"State": containerJSON.State.Status,   
	})

	c.JSON(http.StatusOK, gin.H{"container": containerDetails})
}

func StartContainer(c *gin.Context){
	containerID := c.Param("id")

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()
	
	containerJSON, err := cli.ContainerInspect(context.Background(), containerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to inspect container"})
		return
	}

	if(containerJSON.State.Status == "running"){
		c.JSON(http.StatusOK, gin.H{"message": "Container " + containerID + " is already running"})
		return
	}
	
	if err := cli.ContainerStart(context.Background(), containerID, container.StartOptions{}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start container"})
		return
	}


	c.JSON(http.StatusOK, gin.H{"message": "Container " + containerID + " started successfully"})	
}

func StopContainer(c *gin.Context){
	containerID := c.Param("id")

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()

	containerJSON, err := cli.ContainerInspect(context.Background(), containerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to inspect container"})
		return
	}

	if(containerJSON.State.Status == "exited"){
		c.JSON(http.StatusOK, gin.H{"message": "Container " + containerID + " is already exited"})
		return
	}

	timeout := 10
	stopOptions := container.StopOptions{Timeout: &timeout}

	if err := cli.ContainerStop(context.Background(), containerID, stopOptions); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container " + containerID + " stopped successfully"})
}
