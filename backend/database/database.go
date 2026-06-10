package database

import (
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ========================================================================================
// User struct to represent a user in the database
//
// ID - primary key, auto-incremented
// Username - unique username for the user
// Password - hashed password for the user
// RefreshTokens - slice of RefreshToken structs representing the user's refresh tokens
// ========================================================================================

type User struct {
	ID            uint   `gorm:"primaryKey;autoIncremet"`
	Username      string `gorm:"unique"`
	Password      string
	RefreshTokens []RefreshToken `gorm:"foreignKey:UserID"`
}

// ========================================================================================
// RefreshToken struct to represent a refresh token in the database
//
// ID - primary key, auto-incremented
// UserId - foreign key referencing the user who owns the refresh token
// Token - unique string representing the refresh token
// CreatedAt - timestamp of when the refresh token was created
// ExpiresAt - pointer to a timestamp of when the refresh token expires (can be null)
// ========================================================================================

type RefreshToken struct {
	ID        uint `gorm:"primaryKey;autoIncrement"`
	UserId    uint
	Token     string    `gorm:"unique"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	ExpiresAt *time.Time
}

// ========================================================================================
// DB variable to hold the database connection
// ========================================================================================

var DB *gorm.DB

// ========================================================================================
// InitDB function to initialize the database connection and perform auto-migration
//
// @return int - 0 if successful, 1 if there was an error connecting to the database
// ========================================================================================

func InitDB() int {
	dsn := "host=localhost user=admin password=password dbname=postgres port=5432 sslmode=disable TimeZone=Europe/Warsaw"

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
		return 1
	}

	DB.AutoMigrate(&User{}, &RefreshToken{})

	log.Println("Database connection established and migrated")

	return 0
}
