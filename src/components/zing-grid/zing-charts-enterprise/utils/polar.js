
export function loopSymmetrically(items, step, iterator) {
    const loop = (start, end, step, iterator) => {
        let prev = items[0];
        for (let i = start; step > 0 ? i <= end : i > end; i += step) {
            const curr = items[i];
            if (iterator(prev, curr))
                return true;
            prev = curr;
        }
        return false;
    };
    const midIndex = Math.floor(items.length / 2);
    if (loop(step, midIndex, step, iterator))
        return true;
    return loop(items.length - step, midIndex, -step, iterator);
}
