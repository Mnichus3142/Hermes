package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"backend/API/OAuth"
	"backend/API/auth"
	"backend/API/userManagement"
	"backend/database"
	_ "backend/docs"
	"backend/health"
	"backend/logs"
)

// @title           Swagger for Hermes API
// @version         v0.1
// @description     Backend for Hermes
// @host            localhost:8080
// @BasePath        /api/v1
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

	slog.Info("Starting server version " + os.Getenv("VERSION") + "...")
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
	// Swagger
	// ========================================================================================

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	slog.Info("Swagger on: localhost:8080/swagger/index.html")

	// ========================================================================================
	// Register group
	// ========================================================================================

	api := r.Group("/api/v1")

	// ========================================================================================
	// MIDDLEWARE
	// ========================================================================================

	// ========================================================================================
	// HEALTH API
	// ========================================================================================

	health.RegisterHealthRoutes(api)

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

	// POST - Create new user in database

	r.POST("/user", func(c *gin.Context) {
		var request struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		if err := c.BindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request body",
			})
			return
		}

		success, message := userManagement.POST(request.Username, request.Password)

		if !success {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": message,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": message,
		})
	})

	// ========================================================================================
	// AUTH API
	// ========================================================================================

	r.POST("/auth", func(c *gin.Context) {
		auth.Login(c)
	})

	// ========================================================================================
	// OAuth API
	// ========================================================================================

	r.GET("/OAuth", func(c *gin.Context) {
		c.JSON(http.StatusOK, OAuth.GET())
	})

	// ========================================================================================
	// PROTECTED API
	// ========================================================================================

	protected := r.Group("/protected")
	protected.Use(auth.AuthMiddleware())
	{
		protected.GET("/data", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"data": "This is protected data",
			})
		})

		// ========================================================================================
		// Log out user
		// ========================================================================================

		protected.POST("/logout", func(c *gin.Context) {
			auth.Logout(c)
		})
	}

	// Start server on port 8080 (default)
	// Server will listen on 0.0.0.0:8080 (localhost:8080 on Windows)

	r.Run()
}
