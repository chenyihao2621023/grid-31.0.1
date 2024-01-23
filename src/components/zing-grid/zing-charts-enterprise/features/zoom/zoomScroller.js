import { constrainZoom, definedZoomState, pointToRatio, scaleZoomAxisWithAnchor, scaleZoomAxisWithPoint } from './zoomTransformers';
export class ZoomScroller {
  update(event, step, anchorPointX, anchorPointY, isScalingX, isScalingY, bbox, currentZoom) {
    const oldZoom = definedZoomState(currentZoom);
    const sourceEvent = event.sourceEvent;
    const dir = sourceEvent.deltaY < 0 ? -1 : 1;
    let newZoom = definedZoomState(oldZoom);
    newZoom.x.max += isScalingX ? step * dir * (oldZoom.x.max - oldZoom.x.min) : 0;
    newZoom.y.max += isScalingY ? step * dir * (oldZoom.y.max - oldZoom.y.min) : 0;
    if (anchorPointX === 'pointer' && isScalingX || anchorPointY === 'pointer' && isScalingY) {
      newZoom = this.scaleZoomToPointer(sourceEvent, isScalingX, isScalingY, bbox, oldZoom, newZoom);
    } else {
      if (isScalingX) {
        newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchorPointX);
      }
      if (isScalingY) {
        newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchorPointY);
      }
    }
    newZoom = constrainZoom(newZoom);
    return newZoom;
  }
  scaleZoomToPointer(sourceEvent, isScalingX, isScalingY, bbox, oldZoom, newZoom) {
    var _a, _b;
    const origin = pointToRatio(bbox, (_a = sourceEvent.offsetX) !== null && _a !== void 0 ? _a : sourceEvent.clientX, (_b = sourceEvent.offsetY) !== null && _b !== void 0 ? _b : sourceEvent.clientY);
    newZoom.x = isScalingX ? scaleZoomAxisWithPoint(newZoom.x, oldZoom.x, origin.x) : newZoom.x;
    newZoom.y = isScalingY ? scaleZoomAxisWithPoint(newZoom.y, oldZoom.y, origin.y) : newZoom.y;
    return newZoom;
  }
}