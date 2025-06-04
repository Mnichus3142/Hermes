import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
// import 'erronaut';
import type { OAuthButtons } from '$lib/types/OAuthButtons';

export async function GET() {
    let returnObject: OAuthButtons = {
        discord: env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET ? true : false,
        google: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? true : false,
        github: env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? true : false,
        gitlab: env.GITLAB_CLIENT_ID && env.GITLAB_CLIENT_SECRET ? true : false
    }

    return json(returnObject);
}