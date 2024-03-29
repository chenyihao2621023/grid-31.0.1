import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
import { constrainZoom, definedZoomState, pointToRatio, scaleZoomAxisWithAnchor } from './zoomTransformers';
export class ZoomAxisDragger {
  constructor() {
    this.isAxisDragging = false;
  }
  update(event, direction, anchor, bbox, zoom, axisZoom) {
    this.isAxisDragging = true;
    if (this.oldZoom == null) {
      if (direction === _ModuleSupport.ChartAxisDirection.X) {
        this.oldZoom = definedZoomState(Object.assign(Object.assign({}, zoom), {
          x: axisZoom
        }));
      } else {
        this.oldZoom = definedZoomState(Object.assign(Object.assign({}, zoom), {
          y: axisZoom
        }));
      }
    }
    this.updateCoords(event.offsetX, event.offsetY);
    return this.updateZoom(direction, anchor, bbox);
  }
  stop() {
    this.isAxisDragging = false;
    this.coords = undefined;
    this.oldZoom = undefined;
  }
  updateCoords(x, y) {
    if (!this.coords) {
      this.coords = {
        x1: x,
        y1: y,
        x2: x,
        y2: y
      };
    } else {
      this.coords.x2 = x;
      this.coords.y2 = y;
    }
  }
  updateZoom(direction, anchor, bbox) {
    const {
      coords,
      oldZoom
    } = this;
    let newZoom = definedZoomState(oldZoom);
    if (!coords || !oldZoom) {
      if (direction === _ModuleSupport.ChartAxisDirection.X) return newZoom.x;
      return newZoom.y;
    }
    const origin = pointToRatio(bbox, coords.x1, coords.y1);
    const target = pointToRatio(bbox, coords.x2, coords.y2);
    if (direction === _ModuleSupport.ChartAxisDirection.X) {
      const scaleX = (target.x - origin.x) * (oldZoom.x.max - oldZoom.x.min);
      newZoom.x.max += scaleX;
      newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchor, origin.x);
      newZoom = constrainZoom(newZoom);
      return newZoom.x;
    }
    const scaleY = (target.y - origin.y) * (oldZoom.y.max - oldZoom.y.min);
    newZoom.y.max -= scaleY;
    newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchor, origin.y);
    newZoom = constrainZoom(newZoom);
    return newZoom.y;
  }
}