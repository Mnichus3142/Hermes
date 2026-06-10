package health

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// ========================================================================================
// Register function to register endpoint for health group
// ========================================================================================

// RegisterHealthRoutes returns 200 and time, so that we will know if backend is healthy
// @Summary      Check if the backend is healthy
// @Description  Returns html.StatusOK and time
// @Tags         health
// @Produce      json
// @Success      200  {object}  map[string]string "Success message + time"
// @Router       /health [get]
func RegisterHealthRoutes(router *gin.RouterGroup) {
	health := router.Group("/health")
	{
		health.GET("/", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Backend UP at: " + time.Now().String()})
		})
	}
}
