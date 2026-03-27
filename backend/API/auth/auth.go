package auth

import (
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"backend/database"
)

// =========================================================================================
// Log user in and set cookie with JWT token
//
// @param c - Gin context
// =========================================================================================

func Login(c *gin.Context) {
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

	username := request.Username
	password := request.Password

	var user database.User

	result := database.DB.First(&user, "username = ?", username)

	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid username or password",
		})
		return
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid username or password",
		})
		return
	}

	expiration := os.Getenv("JWT_EXPIRATION")
	expirattionInt, err := strconv.Atoi(expiration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error parsing token expiration",
		})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": user.Username,
		"exp":      time.Now().Add(time.Duration(expirattionInt) * time.Second).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error generating token",
		})
		return
	}

	c.SetCookie(
		"token",        // Name
		tokenString,    // Value
		expirattionInt, // MaxAge
		"/",            // Path
		"",             // Domain
		false,          // Secure
		true,           // HttpOnly
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged in successfully",
	})
}

// =========================================================================================
// Log user out by clearing the cookie
//
// @param c - Gin context
// =========================================================================================

func Logout(c *gin.Context) {
	c.SetCookie(
		"token", // Name
		"",      // Value
		-1,      // MaxAge (negative to delete cookie)
		"/",     // Path
		"",      // Domain
		false,   // Secure
		true,    // HttpOnly
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// =========================================================================================
// Middleware to check if user is authenticated
//
// @param c - Gin context
// =========================================================================================

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from cookie

		tokenString, err := c.Cookie("token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			c.Abort()
			return
		}

		// Parse token and check if it's valid

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || token == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			c.Abort()
			return
		}

		// Check if token is legitimate

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			if claims["exp"].(float64) < float64(time.Now().Unix()) {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "Token expired",
				})
				c.Abort()
				return
			}

			c.Set("username", claims["username"])
			c.Next()
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			c.Abort()
			return
		}
	}
}
