import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
import { constrainZoom, definedZoomState, pointToRatio, translateZoom } from './zoomTransformers';
export class ZoomPanner {
    constructor() {
        this.isPanning = false;
    }
    update(event, bbox, zooms) {
        this.isPanning = true;
        this.updateCoords(event.offsetX, event.offsetY);
        return this.translateZooms(bbox, zooms);
    }
    stop() {
        this.isPanning = false;
        this.coords = undefined;
    }
    updateCoords(x, y) {
        if (!this.coords) {
            this.coords = { x1: x, y1: y, x2: x, y2: y };
        }
        else {
            this.coords.x1 = this.coords.x2;
            this.coords.y1 = this.coords.y2;
            this.coords.x2 = x;
            this.coords.y2 = y;
        }
    }
    translateZooms(bbox, currentZooms) {
        var _a;
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = (_a = this.coords) !== null && _a !== void 0 ? _a : {};
        const dx = x1 <= x2 ? x2 - x1 : x1 - x2;
        const dy = y1 <= y2 ? y2 - y1 : y1 - y2;
        const offset = pointToRatio(bbox, bbox.x + dx, bbox.y + bbox.height - dy);
        const offsetX = x1 <= x2 ? -offset.x : offset.x;
        const offsetY = y1 <= y2 ? offset.y : -offset.y;
        const newZooms = {};
        for (const [axisId, { direction, zoom: currentZoom }] of Object.entries(currentZooms)) {
            let zoom;
            if (direction === _ModuleSupport.ChartAxisDirection.X) {
                zoom = definedZoomState({ x: currentZoom });
            }
            else {
                zoom = definedZoomState({ y: currentZoom });
            }
            const scaleX = zoom.x.max - zoom.x.min;
            const scaleY = zoom.y.max - zoom.y.min;
            zoom = constrainZoom(translateZoom(zoom, offsetX * scaleX, offsetY * scaleY));
            if (direction === _ModuleSupport.ChartAxisDirection.X) {
                newZooms[axisId] = { direction, zoom: zoom.x };
            }
            else {
                newZooms[axisId] = { direction, zoom: zoom.y };
            }
        }
        return newZooms;
    }
}
