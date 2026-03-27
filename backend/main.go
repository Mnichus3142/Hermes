package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"backend/API/OAuth"
	"backend/API/userManagement"
	"backend/database"
	"backend/logs"
)

func main() {
	// ========================================================================================
	// Prepare handler for logs
	// ========================================================================================

	slog.Info("Prepearing logs handler...")
	logs.Prepare()
	slog.Info("Logs handler is ready")

	// ========================================================================================
	// Check if database connection is available
	// ========================================================================================

	slog.Info("Checking database connection...")
	if database.InitDB() != 0 {
		return
	}
	slog.Info("Database connection is available")

	// ========================================================================================
	// Create a Gin router with default middleware (logger and recovery)
	// ========================================================================================

	slog.Info("Starting server...")
	r := gin.Default()

	// ========================================================================================
	// Cors configutation
	// ========================================================================================

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("ALLOWED_ORIGINS")},
		AllowMethods:     []string{"GET"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ========================================================================================
	// USER API
	// ========================================================================================

	// GET - Get information, if user with this name already exists in database

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

	// ========================================================================================
	// OAuth API
	// ========================================================================================

	r.GET("/OAuth", func(c *gin.Context) {
		c.JSON(http.StatusOK, OAuth.GET())
	})

	// Start server on port 8080 (default)
	// Server will listen on 0.0.0.0:8080 (localhost:8080 on Windows)

	r.Run()
}
