export const getOAuthButtons = async (): Promise<{
    code: number;
    buttons: Array<{ name: string; status: boolean }>;
}> => {
    const buttons = [
        {
            name: "Google",
            statis:
                process.env.GOOGLE_CLIENT_ID != "" &&
                process.env.GOOGLE_CLIENT_SECRET != "",
        },
        {
            name: "GitHub",
            statis:
                process.env.GITHUB_CLIENT_ID != "" &&
                process.env.GITHUB_CLIENT_SECRET != "",
        },
        {
            name: "GitLab",
            statis:
                process.env.GITLAB_CLIENT_ID != "" &&
                process.env.GITLAB_CLIENT_SECRET != "",
        },
        {
            name: "Discord",
            statis:
                process.env.DISCORD_CLIENT_ID != "" &&
                process.env.DISCORD_CLIENT_SECRET != "",
        },
    ];

    return {
        code: 200,
        buttons: buttons.map((button) => ({
            name: button.name,
            status: button.statis,
        })),
    };
};
