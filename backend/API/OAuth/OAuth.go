package OAuth

import (
	"os"
)

// ========================================================================================
// OAuthActive struct to hold boolean values indicating which OAuth providers are active
// DISCORD - indicates if Discord OAuth is OAuthActive
// GOOGLE - indicates if Google OAuth is OAuthActive
// GITHUB - indicates if GitHub OAuth is OAuthActive
// GITLAB - indicates if GitLab OAuth is OAuthActive
// ========================================================================================

type OAuthActive struct {
	DISCORD    bool
	GOOGLE     bool
	GITHUB     bool
	GITLAB     bool
}

// ========================================================================================
// Check which OAuth providers are active based on environment variables
// @return OAuthActive struct with boolean values indicating which providers are active
// ========================================================================================


func createPayload () OAuthActive {
	return OAuthActive{
		DISCORD:     os.Getenv("DISCORD_CLIENT_ID") != "" && os.Getenv("DISCORD_CLIENT_SECRET") != "",
		GOOGLE:      os.Getenv("GOOGLE_CLIENT_ID") != "" && os.Getenv("GOOGLE_CLIENT_SECRET") != "",
		GITHUB:      os.Getenv("GITHUB_CLIENT_ID") != "" && os.Getenv("GITHUB_CLIENT_SECRET") != "" ,
		GITLAB:      os.Getenv("GITLAB_CLIENT_ID") != "" && os.Getenv("GITLAB_CLIENT_SECRET") != "" ,
	}
}

// ========================================================================================
// GET function to return OAuthActive struct with boolean values indicating which providers are active
// @return OAuthActive struct with boolean values indicating which providers are active
// ========================================================================================

func GET() OAuthActive {
	return createPayload()
}
