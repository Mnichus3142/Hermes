export function clickOutside(node: HTMLElement) {
    const handleClick = (event: MouseEvent) => {
        if (!event.defaultPrevented && node && !node.contains(event.target as Node)) {
            const clickOutsideEvent = new CustomEvent('click_outside');
            requestAnimationFrame(() => {
                node.dispatchEvent(clickOutsideEvent);
            });
        }
    };

    document.addEventListener('mousedown', handleClick, { capture: true });

    return {
        destroy() {
            document.removeEventListener('mousedown', handleClick, { capture: true });
        }
    };
}
