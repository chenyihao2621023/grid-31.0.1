import { constrainZoom, definedZoomState, pointToRatio, scaleZoomAxisWithAnchor, scaleZoomAxisWithPoint, } from './zoomTransformers';
export class ZoomScroller {
    update(event, step, anchorPointX, anchorPointY, isScalingX, isScalingY, bbox, currentZoom) {
        const oldZoom = definedZoomState(currentZoom);
        const sourceEvent = event.sourceEvent;
        // Scale the zoom bounding box
        const dir = sourceEvent.deltaY < 0 ? -1 : 1;
        let newZoom = definedZoomState(oldZoom);
        newZoom.x.max += isScalingX ? step * dir * (oldZoom.x.max - oldZoom.x.min) : 0;
        newZoom.y.max += isScalingY ? step * dir * (oldZoom.y.max - oldZoom.y.min) : 0;
        if ((anchorPointX === 'pointer' && isScalingX) || (anchorPointY === 'pointer' && isScalingY)) {
            newZoom = this.scaleZoomToPointer(sourceEvent, isScalingX, isScalingY, bbox, oldZoom, newZoom);
        }
        else {
            if (isScalingX) {
                newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchorPointX);
            }
            if (isScalingY) {
                newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchorPointY);
            }
        }
        // Constrain the zoom bounding box to remain within the ultimate bounds of 0,0 and 1,1
        newZoom = constrainZoom(newZoom);
        return newZoom;
    }
    scaleZoomToPointer(sourceEvent, isScalingX, isScalingY, bbox, oldZoom, newZoom) {
        var _a, _b;
        // Convert the cursor position to coordinates as a ratio of 0 to 1
        const origin = pointToRatio(bbox, (_a = sourceEvent.offsetX) !== null && _a !== void 0 ? _a : sourceEvent.clientX, (_b = sourceEvent.offsetY) !== null && _b !== void 0 ? _b : sourceEvent.clientY);
        // Translate the zoom bounding box such that the cursor remains over the same position as before
        newZoom.x = isScalingX ? scaleZoomAxisWithPoint(newZoom.x, oldZoom.x, origin.x) : newZoom.x;
        newZoom.y = isScalingY ? scaleZoomAxisWithPoint(newZoom.y, oldZoom.y, origin.y) : newZoom.y;
        return newZoom;
    }
}
