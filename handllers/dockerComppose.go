package handlers

import (
	"context"
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/gin-gonic/gin"
)

func GetDockerCompose(c *gin.Context) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()

	// Get all containers with the Docker Compose label
	containers, err := cli.ContainerList(ctx, container.ListOptions{
		All:     true,
		Filters: filters.NewArgs(filters.Arg("label", "com.docker.compose.project")),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list Docker containers"})
		return
	}

	// Store detailed project information
	projects := make(map[string][]map[string]interface{})

	for _, container := range containers {
		projectName := container.Labels["com.docker.compose.project"]
		serviceName := container.Labels["com.docker.compose.service"]

		if projectName == "" {
			continue
		}

		// Filter ports to include only those at odd indices
		filteredPorts := []types.Port{}
		for i, port := range container.Ports {
			if i%2 != 1 { // Check if the index is odd
				filteredPorts = append(filteredPorts, port)
			}
		}

		containerInfo := map[string]interface{}{
			"service_name": serviceName,
			"container_id": container.ID[:12], // Shortened container ID
			"status":       container.Status,
			"image":        container.Image,
			"ports":        filteredPorts, // Use filtered ports
		}

		projects[projectName] = append(projects[projectName], containerInfo)
	}

	c.JSON(http.StatusOK, projects)
}
