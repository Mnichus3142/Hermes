// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				id: number;
			}
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	declare namespace svelteHTML {
        interface HTMLAttributes<T> {
            // Removed old declaration for on:click_outside
            // 'on:click_outside'?: CompositionEventHandler<T>;
            
            // Added new declaration for onclick_outside compatible with Svelte 5 syntax
            onclick_outside?: (event: CustomEvent<{originalEvent: MouseEvent}>) => void;
        }
    }
}

export {};
