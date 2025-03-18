package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sort"
	"github.com/docker/go-connections/nat"
	"time"

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
	fmt.Println(containerJSON)

	
	containerDetails := make(map[string]string)
	containerDetails["ID"] = containerJSON.ID
	containerDetails["Created"] = FormatCreatedTime(containerJSON.Created)
	containerDetails["Image"] = containerJSON.Config.Image
	containerDetails["Status"] = containerJSON.State.Status
	containerDetails["Ports"] = FormatPorts(containerJSON.NetworkSettings.Ports)



	c.JSON(http.StatusOK, containerDetails)
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

// FormatPorts converts Docker's port mapping structure to a human-readable format
func FormatPorts(ports nat.PortMap) string {
	if len(ports) == 0 {
		return ""
	}

	var formattedPorts []string

	// Sort the ports to ensure consistent output
	var sortedPorts []string
	for port := range ports {
		sortedPorts = append(sortedPorts, string(port))
	}
	sort.Strings(sortedPorts)

	for _, portKey := range sortedPorts {
		port := nat.Port(portKey)
		bindings := ports[port]

		// For ports with bindings (published ports)
		if len(bindings) > 0 {
			for _, binding := range bindings {
				hostIP := binding.HostIP
				if hostIP == "" {
					hostIP = "0.0.0.0"
				}
				formattedPorts = append(formattedPorts, 
					fmt.Sprintf("%s:%s->%s", hostIP, binding.HostPort, port))
			}
		} else {
			// For exposed ports without bindings
			formattedPorts = append(formattedPorts, string(port))
		}
	}

	return strings.Join(formattedPorts, ", ")
}

// FormatCreatedTime converts Docker's timestamp to a human-readable format
func FormatCreatedTime(timestamp string) string {
	// Parse the Docker timestamp
	t, err := time.Parse(time.RFC3339Nano, timestamp)
	if err != nil {
		// If parsing fails, return the original timestamp
		return timestamp
	}

	// Calculate time difference from now
	duration := time.Since(t)

	// Format based on duration
	if duration < time.Minute {
		return "Just now"
	} else if duration < time.Hour {
		minutes := int(duration.Minutes())
		if minutes == 1 {
			return "1 minute ago"
		}
		return fmt.Sprintf("%d minutes ago", minutes)
	} else if duration < 24*time.Hour {
		hours := int(duration.Hours())
		if hours == 1 {
			return "1 hour ago"
		}
		return fmt.Sprintf("%d hours ago", hours)
	} else if duration < 48*time.Hour {
		return "Yesterday"
	} else if duration < 7*24*time.Hour {
		days := int(duration.Hours() / 24)
		return fmt.Sprintf("%d days ago", days)
	} else {
		// For older containers, show the actual date
		return t.Format("Jan 2, 2006 at 3:04 PM")
	}
}