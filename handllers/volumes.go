package handlers

import (
	"context"
	"net/http"

	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
	"github.com/gin-gonic/gin"
)

func GetVolumes(c *gin.Context) {

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker client"})
		return
	}
	defer cli.Close()

	volumes, err := cli.VolumeList(context.Background(), volume.ListOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch volumes"})
		return
	}

	var volumeDetails []map[string]interface{}
	for _, volume := range volumes.Volumes {
		volumeDetails = append(volumeDetails, map[string]interface{}{
			"Name":    volume.Name,
			"Driver":  volume.Driver,
			"Scope":   volume.Scope,
			"Mounted": volume.Mountpoint,
			"Labels":  volume.Labels,
			
		})
	}

	c.JSON(http.StatusOK, volumeDetails)
}
