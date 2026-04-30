package userManagement

import (
	"backend/database"

	"golang.org/x/crypto/bcrypt"
)

// ========================================================================================
// Check if password matches conditions for a valid password
//
// @param password - password to check
//
// @reteurn bool - true if password is valid, false otherwise
// ========================================================================================

func checkPassword(password string) bool {
	if len(password) < 8 {
		return false
	}

	var hasUpper bool
	var hasLower bool
	var hasNumber bool
	var hasSpecial bool

	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasNumber = true
		case (char >= 33 && char <= 47) || (char >= 58 && char <= 64) || (char >= 91 && char <= 96) || (char >= 123 && char <= 126):
			hasSpecial = true
		}
	}

	if !hasUpper || !hasLower || !hasNumber || !hasSpecial {
		return false
	}

	return true
}

// ========================================================================================
// Check if user exists in database
//
// @param username - username to check
// ========================================================================================

func GET (username string) bool {
	var user database.User

	result := database.DB.First(&user, "username = ?", username)

	if result.Error == nil {
		return true
	}

	return false
}

// ========================================================================================
// Create new user in database
//
// @param username - username to create
// @param password - password to create
//
// @return bool - true if user was created successfully, false otherwise
// @return string - message indicating the result of the operation
// ========================================================================================

func POST (username string, password string) (bool, string) {
	if GET(username) {
		return false, "User already exists"
	}

	if !checkPassword(password) {
		return false, "Password does not meet requirements"
	}

	var passwordHashed, error = bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	if error != nil {
		return false, "Error hashing password"
	}

	user := database.User{
		Username: username,
		Password: string(passwordHashed),
	}

	result := database.DB.Create(&user)

	if result.Error != nil {
		return false, "Error creating user" + result.Error.Error()
	}

	return true, "User created successfully"
}
