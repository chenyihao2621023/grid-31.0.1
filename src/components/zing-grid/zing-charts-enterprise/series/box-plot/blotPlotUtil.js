export function prepareBoxPlotFromTo(isVertical) {
    const from = isVertical ? { scalingX: 1, scalingY: 0 } : { scalingX: 0, scalingY: 1 };
    const to = { scalingX: 1, scalingY: 1 };
    return { from, to };
}
export function resetBoxPlotSelectionsScalingCenterFn(isVertical) {
    return (_node, datum) => {
        if (isVertical) {
            return { scalingCenterY: datum.scaledValues.medianValue };
        }
        return { scalingCenterX: datum.scaledValues.medianValue };
    };
}
