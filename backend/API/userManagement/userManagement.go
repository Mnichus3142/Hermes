package userManagement

import (
	"backend/database"
)

func GET (username string) bool {
	var user database.User

	result := database.DB.First(&user, "username = ?", username)

	if result.Error == nil {
		return true
	}

	return false
}
