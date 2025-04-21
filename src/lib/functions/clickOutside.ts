/**
 * A directive for Svelte 5 that detects clicks outside an element
 * and emits onclick_outside event.
 * 
 * Usage: <element use:clickOutside onclick_outside={handler} />
 */
export function clickOutside(node: HTMLElement, options: { enabled?: boolean } = {}) {
    let { enabled = true } = options;
    
    const handleClick = (event: MouseEvent) => {
        if (!enabled) return;
        
        if (!event.defaultPrevented && 
            node && 
            !node.contains(event.target as Node)) {
            
            // Changed event name to "onclick_outside" instead of "click_outside"
            node.dispatchEvent(new CustomEvent('onclick_outside', {
                detail: { originalEvent: event }
            }));
        }
    };

    // Add listener with capture option to catch the event before propagation
    document.addEventListener('mousedown', handleClick, { capture: true });
    
    return {
        // Update options when directive parameters change
        update(newOptions: { enabled?: boolean }) {
            enabled = newOptions.enabled ?? true;
        },
        
        // Cleanup after component destruction
        destroy() {
            document.removeEventListener('mousedown', handleClick, { capture: true });
        }
    };
}
