package OAuth

import (
	"os"
)

type OAuthActive struct {
	DISCORD    bool
	GOOGLE     bool
	GITHUB     bool
	GITLAB     bool
}

func createPayload () OAuthActive {
	return OAuthActive{
		DISCORD:     os.Getenv("DISCORD_CLIENT_ID") != "" && os.Getenv("DISCORD_CLIENT_SECRET") != "",
		GOOGLE:      os.Getenv("GOOGLE_CLIENT_ID") != "" && os.Getenv("GOOGLE_CLIENT_SECRET") != "",
		GITHUB:      os.Getenv("GITHUB_CLIENT_ID") != "" && os.Getenv("GITHUB_CLIENT_SECRET") != "" ,
		GITLAB:      os.Getenv("GITLAB_CLIENT_ID") != "" && os.Getenv("GITLAB_CLIENT_SECRET") != "" ,
	}
}

func GET() OAuthActive {
	return createPayload()
}
