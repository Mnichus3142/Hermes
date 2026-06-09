<script lang="ts">
    import type { checkPasswordsType } from '$lib/types/checkPasswords';
    
    const { passwordCheck, movePasswordConditions, thirdSpanClicked } = $props<{
        passwordCheck: checkPasswordsType;
        movePasswordConditions: boolean;
        thirdSpanClicked: boolean;
    }>();
</script>

{#if !passwordCheck.conditions.allConditionsMet}
    <div class="flex flex-col w-64 gap-1 text-sm transition-all" class:-translate-y-5={movePasswordConditions || (passwordCheck.firstPassword.length !== 0 && thirdSpanClicked) || thirdSpanClicked}>
        <div class="flex items-center gap-2">
            <div class="w-4 h-4 transition-all duration-300">
                {#if passwordCheck.conditions.isAtLeast8Characters}
                    <svg class="text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.707 14.293l-3-3c-.39-.39-1.023-.39-1.414 0s-.39 1.023 0 1.414l3.707 3.707c.39.39 1.023.39 1.414 0l7.707-7.707c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-7 7z"/>
                    </svg>
                {:else}
                    <svg class="text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.293 6.293a1 1 0 011.414 0L12 10.586l4.293-4.293a1 1 0 111.414 1.414L13.414 12l4.293 4.293a1 1 0 01-1.414 1.414L12 13.414l-4.293 4.293a1 1 0 01-1.414-1.414L10.586 12 6.293 7.707a1 1 0 010-1.414z"/>
                    </svg>
                {/if}
            </div>
            <span class="textFont text-mainBorder">At least 8 characters</span>
        </div>
        
        <div class="flex items-center gap-2">
            <div class="w-4 h-4 transition-all duration-300">
                {#if passwordCheck.conditions.hasAtLeast1UppercaseLetter}
                    <svg class="text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.707 14.293l-3-3c-.39-.39-1.023-.39-1.414 0s-.39 1.023 0 1.414l3.707 3.707c.39.39 1.023.39 1.414 0l7.707-7.707c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-7 7z"/>
                    </svg>
                {:else}
                    <svg class="text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.293 6.293a1 1 0 011.414 0L12 10.586l4.293-4.293a1 1 0 111.414 1.414L13.414 12l4.293 4.293a1 1 0 01-1.414 1.414L12 13.414l-4.293 4.293a1 1 0 01-1.414-1.414L10.586 12 6.293 7.707a1 1 0 010-1.414z"/>
                    </svg>
                {/if}
            </div>
            <span class="textFont text-mainBorder">At least 1 uppercase letter</span>
        </div>

        <div class="flex items-center gap-2">
            <div class="w-4 h-4 transition-all duration-300">
                {#if passwordCheck.conditions.hasAtLeast1LowercaseLetter}
                    <svg class="text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.707 14.293l-3-3c-.39-.39-1.023-.39-1.414 0s-.39 1.023 0 1.414l3.707 3.707c.39.39 1.023.39 1.414 0l7.707-7.707c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-7 7z"/>
                    </svg>
                {:else}
                    <svg class="text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.293 6.293a1 1 0 011.414 0L12 10.586l4.293-4.293a1 1 0 111.414 1.414L13.414 12l4.293 4.293a1 1 0 01-1.414 1.414L12 13.414l-4.293 4.293a1 1 0 01-1.414-1.414L10.586 12 6.293 7.707a1 1 0 010-1.414z"/>
                    </svg>
                {/if}
            </div>
            <span class="textFont text-mainBorder">At least 1 lowercase letter</span>
        </div>

        <div class="flex items-center gap-2">
            <div class="w-4 h-4 transition-all duration-300">
                {#if passwordCheck.conditions.hasAtLeast1Number}
                    <svg class="text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.707 14.293l-3-3c-.39-.39-1.023-.39-1.414 0s-.39 1.023 0 1.414l3.707 3.707c.39.39 1.023.39 1.414 0l7.707-7.707c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-7 7z"/>
                    </svg>
                {:else}
                    <svg class="text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.293 6.293a1 1 0 011.414 0L12 10.586l4.293-4.293a1 1 0 111.414 1.414L13.414 12l4.293 4.293a1 1 0 01-1.414 1.414L12 13.414l-4.293 4.293a1 1 0 01-1.414-1.414L10.586 12 6.293 7.707a1 1 0 010-1.414z"/>
                    </svg>
                {/if}
            </div>
            <span class="textFont text-mainBorder">At least 1 number</span>
        </div>

        <div class="flex items-center gap-2">
            <div class="w-4 h-4 transition-all duration-300">
                {#if passwordCheck.conditions.hasAtLeast1SpecialCharacter}
                    <svg class="text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.707 14.293l-3-3c-.39-.39-1.023-.39-1.414 0s-.39 1.023 0 1.414l3.707 3.707c.39.39 1.023.39 1.414 0l7.707-7.707c.39-.39.39-1.023 0-1.414s-1.023-.39-1.414 0l-7 7z"/>
                    </svg>
                {:else}
                    <svg class="text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.293 6.293a1 1 0 011.414 0L12 10.586l4.293-4.293a1 1 0 111.414 1.414L13.414 12l4.293 4.293a1 1 0 01-1.414 1.414L12 13.414l-4.293 4.293a1 1 0 01-1.414-1.414L10.586 12 6.293 7.707a1 1 0 010-1.414z"/>
                    </svg>
                {/if}
            </div>
            <span class="textFont text-mainBorder">At least 1 special character</span>
        </div>
    </div>
{/if}