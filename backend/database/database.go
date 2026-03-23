package database

import (
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type User struct {
	ID            uint   `gorm:"primaryKey;autoIncremet"`
	Username      string `gorm:"unique"`
	Password      string
	RefreshTokens []RefreshToken `gorm:"foreignKey:UserID"`
}

type RefreshToken struct {
	ID        uint `gorm:"primaryKey;autoIncrement"`
	UserId    uint
	Token     string    `gorm:"unique"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	ExpiresAt *time.Time
}

var DB *gorm.DB

func InitDB() int {
	dsn := "host=localhost user=postgres password=root dbname=postgres port=5432 sslmode=disable TimeZone=Europe/Warsaw"

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
