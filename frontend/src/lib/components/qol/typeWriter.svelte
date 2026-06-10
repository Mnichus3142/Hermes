<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
  
    export let typeWriterPayload: {
        text: string;
        delay?: number;
        speed?: number;
        cursor?: string;
        cursorSpeed?: number;
        cursorBlink?: boolean;
        cursorBlinkAtTheEnd?: boolean;
    } = {
        text: '',
        delay: 100,
        speed: 50,
        cursor: '|',
        cursorSpeed: 20,
        cursorBlink: true,
        cursorBlinkAtTheEnd: true,
    };
  
    let visible = false;
    let actualText = "";
    let showCursor = true;
    let cursorInterval: ReturnType<typeof setInterval>;
  
    const wait = (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
  
    const display = async () => {
        await wait(typeWriterPayload.delay ?? 100);
        visible = true;
        actualText = "";
    
        for (let i = 0; i < typeWriterPayload.text.length; i++) {
            actualText += typeWriterPayload.text[i];
            await tick();
            await wait(typeWriterPayload.speed ?? 50);
        }
    
        if (typeWriterPayload.cursorBlinkAtTheEnd) {
            startCursorBlink();
        } else {
            showCursor = false;
        }
    };
  
    const startCursorBlink = () => {
        if (cursorInterval) clearInterval(cursorInterval);
        if (typeWriterPayload.cursorBlink) {
            cursorInterval = setInterval(() => {
                showCursor = !showCursor;
            }, typeWriterPayload.cursorSpeed ?? 500);
        }
    };
  
    onMount(() => {
        display();
        return () => {
            if (cursorInterval) clearInterval(cursorInterval);
        }
    });
  </script>
  
  <span>
    {#if visible}
        {actualText} {showCursor ? typeWriterPayload.cursor : ""}
    {/if}
  </span>