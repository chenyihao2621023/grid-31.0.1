
export function areEventsNear(e1, e2, pixelCount) {
    // by default, we wait 4 pixels before starting the drag
    if (pixelCount === 0) {
        return false;
    }
    const diffX = Math.abs(e1.clientX - e2.clientX);
    const diffY = Math.abs(e1.clientY - e2.clientY);
    return Math.max(diffX, diffY) <= pixelCount;
}
