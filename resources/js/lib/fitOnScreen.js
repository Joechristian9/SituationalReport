const EDGE = 8;

/**
 * Clamp a floating box's position so all of it stays on screen, EDGE px in.
 * `pos` is { left, bottom } (distance from the bottom, so content above it still opens upward);
 * null means "use the default spot" and is returned as is.
 */
export function fit(pos, box) {
    if (!pos || !box) return pos;
    const { width, height } = box.getBoundingClientRect();
    return {
        left: Math.min(Math.max(EDGE, pos.left), window.innerWidth - width - EDGE),
        bottom: Math.min(Math.max(EDGE, pos.bottom), window.innerHeight - height - EDGE),
    };
}
