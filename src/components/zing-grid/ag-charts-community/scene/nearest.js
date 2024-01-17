export function nearestSquared(point, objects, maxDistanceSquared = Infinity) {
    const result = { nearest: undefined, distanceSquared: maxDistanceSquared };
    for (const obj of objects) {
        const thisDistance = obj.distanceSquared(point);
        if (thisDistance === 0) {
            return { nearest: obj, distanceSquared: 0 };
        }
        else if (thisDistance < result.distanceSquared) {
            result.nearest = obj;
            result.distanceSquared = thisDistance;
        }
    }
    return result;
}
export function nearestSquaredInContainer(point, container, maxDistanceSquared = Infinity) {
    const tpoint = container.transformPoint(point.x, point.y);
    const result = { nearest: undefined, distanceSquared: maxDistanceSquared };
    for (const child of container.children) {
        const { nearest, distanceSquared } = child.nearestSquared(tpoint, result.distanceSquared);
        if (distanceSquared === 0) {
            return { nearest, distanceSquared };
        }
        else if (distanceSquared < result.distanceSquared) {
            result.nearest = nearest;
            result.distanceSquared = distanceSquared;
        }
    }
    return result;
}
//# sourceMappingURL=nearest.js.map