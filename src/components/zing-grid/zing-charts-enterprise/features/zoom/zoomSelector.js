import { constrainZoom, definedZoomState, pointToRatio, scaleZoom, translateZoom } from './zoomTransformers';
export class ZoomSelector {
  constructor(rect) {
    this.rect = rect;
    this.rect.visible = false;
  }
  update(event, minRatioX, minRatioY, isScalingX, isScalingY, bbox, currentZoom) {
    this.rect.visible = true;
    this.updateCoords(event.offsetX, event.offsetY, minRatioX, minRatioY, isScalingX, isScalingY, bbox, currentZoom);
    this.updateRect(bbox);
  }
  stop(bbox, currentZoom) {
    let zoom = definedZoomState();
    if (!bbox) return zoom;
    if (this.coords) {
      zoom = this.createZoomFromCoords(bbox, currentZoom);
    }
    this.reset();
    return zoom;
  }
  reset() {
    this.coords = undefined;
    this.rect.visible = false;
  }
  updateCoords(x, y, minRatioX, minRatioY, isScalingX, isScalingY, bbox, currentZoom) {
    if (!this.coords) {
      this.coords = {
        x1: x,
        y1: y,
        x2: x,
        y2: y
      };
      return;
    }
    this.coords.x2 = x;
    this.coords.y2 = y;
    if (!bbox) return;
    const zoom = definedZoomState(currentZoom);
    const normal = this.getNormalisedDimensions();
    const aspectRatio = bbox.width / bbox.height;
    const scaleX = zoom.x.max - zoom.x.min;
    const scaleY = zoom.y.max - zoom.y.min;
    const xRatio = minRatioX / scaleX;
    const yRatio = minRatioY / scaleY;
    if (normal.width / bbox.width < xRatio) {
      if (this.coords.x2 < this.coords.x1) {
        this.coords.x2 = this.coords.x1 - bbox.width * xRatio;
      } else {
        this.coords.x2 = this.coords.x1 + bbox.width * xRatio;
      }
    }
    if (isScalingY && !isScalingX) {
      if (normal.height / bbox.height < yRatio) {
        if (this.coords.y2 < this.coords.y1) {
          this.coords.y2 = this.coords.y1 - bbox.width * xRatio;
        } else {
          this.coords.y2 = this.coords.y1 + bbox.height * yRatio;
        }
      }
    } else if (this.coords.y2 < this.coords.y1) {
      this.coords.y2 = Math.min(this.coords.y1 - normal.width / aspectRatio, this.coords.y1 - bbox.height * yRatio);
    } else {
      this.coords.y2 = Math.max(this.coords.y1 + normal.width / aspectRatio, this.coords.y1 + bbox.height * yRatio);
    }
    if (!isScalingX) {
      this.coords.x1 = bbox.x;
      this.coords.x2 = bbox.x + bbox.width;
    }
    if (!isScalingY) {
      this.coords.y1 = bbox.y;
      this.coords.y2 = bbox.y + bbox.height;
    }
  }
  updateRect(bbox) {
    if (!bbox) return;
    const {
      rect
    } = this;
    const normal = this.getNormalisedDimensions();
    const {
      width,
      height
    } = normal;
    let {
      x,
      y
    } = normal;
    x = Math.max(x, bbox.x);
    x -= Math.max(0, x + width - (bbox.x + bbox.width));
    y = Math.max(y, bbox.y);
    y -= Math.max(0, y + height - (bbox.y + bbox.height));
    rect.x = x;
    rect.y = y;
    rect.width = width;
    rect.height = height;
  }
  createZoomFromCoords(bbox, currentZoom) {
    const oldZoom = definedZoomState(currentZoom);
    const normal = this.getNormalisedDimensions();
    const origin = pointToRatio(bbox, normal.x, normal.y + normal.height);
    const xFactor = normal.width / bbox.width;
    const yFactor = normal.height / bbox.height;
    let newZoom = scaleZoom(oldZoom, xFactor, yFactor);
    const translateX = origin.x * (oldZoom.x.max - oldZoom.x.min);
    const translateY = origin.y * (oldZoom.y.max - oldZoom.y.min);
    newZoom = translateZoom(newZoom, translateX, translateY);
    newZoom = constrainZoom(newZoom);
    return newZoom;
  }
  getNormalisedDimensions() {
    var _a;
    const {
      x1 = 0,
      y1 = 0,
      x2 = 0,
      y2 = 0
    } = (_a = this.coords) !== null && _a !== void 0 ? _a : {};
    const x = x1 <= x2 ? x1 : x2;
    const y = y1 <= y2 ? y1 : y2;
    const width = x1 <= x2 ? x2 - x1 : x1 - x2;
    const height = y1 <= y2 ? y2 - y1 : y1 - y2;
    return {
      x,
      y,
      width,
      height
    };
  }
}