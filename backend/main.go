package main

import (
	//"log"
	"net/http"

	"github.com/gin-gonic/gin"

	userManagement "backend/API"
	"backend/database"
)

func main() {
	if database.InitDB() != 0 {
		return
	}

	var user database.User

	result := database.DB.First(&user, 1)

	if result.Error == nil {
		println(user.ID)
	}

	// Create a Gin router with default middleware (logger and recovery)
	r := gin.Default()

	// Define a simple GET endpoint
	// r.GET("/ping", func(c *gin.Context) {
		// Return JSON response
		// c.JSON(http.StatusOK, gin.H{
			// "message": "pong",
		// })
	// })

	r.GET("/user", func(c *gin.Context) {
		username := c.Query("username")

		if username == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "You need to provide the username",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"userExists": userManagement.GET(username),
		})
	})

	// Start server on port 8080 (default)
	// Server will listen on 0.0.0.0:8080 (localhost:8080 on Windows)
	r.Run()
}
