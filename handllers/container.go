package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strconv"

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
		"Name":  containerJSON.Name,
		"State": containerJSON.State.Status,
	})

	c.JSON(http.StatusOK, gin.H{"container": containerDetails})
}

func StartContainer(c *gin.Context) {
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

	if containerJSON.State.Status == "running" {
		c.JSON(http.StatusOK, gin.H{"message": "Container " + containerID + " is already running"})
		return
	}

	if err := cli.ContainerStart(context.Background(), containerID, container.StartOptions{}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Container " + containerID + " started successfully"})
}

func StopContainer(c *gin.Context) {
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

	if containerJSON.State.Status == "exited" {
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

func GetContainerLogs(c *gin.Context) {
	containerID := c.Param("id")

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()

	options := container.LogsOptions{ShowStdout: true, ShowStderr: true}
	out, err := cli.ContainerLogs(context.Background(), containerID, options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get container logs"})
		return
	}

	// Get page parameter from query
	pageParam := c.DefaultQuery("page", "1")

	page, err := strconv.Atoi(pageParam)
	if err != nil || page < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page parameter"})
		return
	}

	// Read the logs into a buffer
	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, out); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read container logs"})
		return
	}

	// Split logs into lines
	lines := bytes.Split(buf.Bytes(), []byte{'\n'})

	// Calculate the total number of lines and pages
	totalLines := len(lines)
	linesPerPage := 100
	totalPages := (totalLines + linesPerPage - 1) / linesPerPage

	// Calculate the range of lines to return based on the page number
	if page > totalPages {
		c.JSON(http.StatusOK, gin.H{"logs": ""})
		return
	}

	end := totalLines - (page-1)*linesPerPage
	start := end - linesPerPage
	if start < 0 {
		start = 0
	}

	// Filter out non-printable characters and select the requested range
	cleanLogs := make([]byte, 0)
	for _, line := range lines[start:end] {
		for _, b := range line {
			if b >= 32 && b <= 126 || b == 10 || b == 13 { // printable ASCII range and newline/carriage return
				cleanLogs = append(cleanLogs, b)
			}
		}
		cleanLogs = append(cleanLogs, '\n')
	}

	// Write the cleaned logs to the response
	c.Writer.Header().Set("Content-Type", "text/plain")
	c.Writer.Write(cleanLogs)
}

func GetContainerStats(c *gin.Context) {
	containerID := c.Param("id")

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()

	stats, err := cli.ContainerStats(context.Background(), containerID, false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get container stats"})
		return
	}
	defer stats.Body.Close()

	var statsJSON map[string]interface{}
	if err := json.NewDecoder(stats.Body).Decode(&statsJSON); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode stats JSON"})
		return
	}

	// Extract required details
	response := gin.H{
		"cpu_usage": map[string]interface{}{
			"total_usage":          statsJSON["cpu_stats"].(map[string]interface{})["cpu_usage"].(map[string]interface{})["total_usage"],
			"usage_in_usermode":    statsJSON["cpu_stats"].(map[string]interface{})["cpu_usage"].(map[string]interface{})["usage_in_usermode"],
			"system_cpu_usage":     statsJSON["cpu_stats"].(map[string]interface{})["system_cpu_usage"],
		},
		"memory_usage": map[string]interface{}{
			"usage": statsJSON["memory_stats"].(map[string]interface{})["usage"],
			"limit": statsJSON["memory_stats"].(map[string]interface{})["limit"],
		},
	}

	c.JSON(http.StatusOK, response)
}

