// =========================================================================================
// This file contains the logic for determining the status of OAuth buttons.
// =========================================================================================

// =========================================================================================
// Function returns the status of OAuth buttons based on the presence of environment variables for each provider.
//
// @return An object containing a status code and an array of button statuses for Google, GitHub, GitLab, and Discord.
// =========================================================================================

export const getOAuthButtons = async (): Promise<{
    code: number;
    buttons: Array<{ name: string; status: boolean }>;
}> => {
    const buttons = [
        {
            name: "Google",
            status:
                Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
                Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()),
        },
        {
            name: "GitHub",
            status:
                Boolean(process.env.GITHUB_CLIENT_ID?.trim()) &&
                Boolean(process.env.GITHUB_CLIENT_SECRET?.trim()),
        },
        {
            name: "GitLab",
            status:
                Boolean(process.env.GITLAB_CLIENT_ID?.trim()) &&
                Boolean(process.env.GITLAB_CLIENT_SECRET?.trim()),
        },
        {
            name: "Discord",
            status:
                Boolean(process.env.DISCORD_CLIENT_ID?.trim()) &&
                Boolean(process.env.DISCORD_CLIENT_SECRET?.trim()),
        },
    ];

    return {
        code: 200,
        buttons: buttons.map((button) => ({
            name: button.name,
            status: button.status,
        })),
    };
};
