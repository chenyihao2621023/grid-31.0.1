var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { HdpiCanvas } from '../scene/canvas/hdpiCanvas';
import { Group } from '../scene/group';
import { Line } from '../scene/shape/line';
import { Text } from '../scene/shape/text';
import { ProxyPropertyOnWrite } from '../util/proxy';
import { Square } from './marker/square';
export class MarkerLabel extends Group {
  constructor() {
    super({
      name: 'markerLabelGroup'
    });
    this.label = new Text();
    this.line = new Line();
    this._marker = new Square();
    this._markerSize = 15;
    this._spacing = 8;
    const {
      marker,
      label,
      line
    } = this;
    label.textBaseline = 'middle';
    label.fontSize = 12;
    label.fontFamily = 'Verdana, sans-serif';
    label.fill = 'black';
    label.y = HdpiCanvas.has.textMetrics ? 1 : 0;
    this.append([line, marker, label]);
    this.update();
  }
  set marker(value) {
    if (this._marker !== value) {
      this.removeChild(this._marker);
      this._marker = value;
      this.appendChild(value);
      this.update();
    }
  }
  get marker() {
    return this._marker;
  }
  set markerSize(value) {
    if (this._markerSize !== value) {
      this._markerSize = value;
      this.update();
    }
  }
  get markerSize() {
    return this._markerSize;
  }
  set spacing(value) {
    if (this._spacing !== value) {
      this._spacing = value;
      this.update();
    }
  }
  get spacing() {
    return this._spacing;
  }
  setSeriesStrokeOffset(xOff) {
    const offset = this.marker.size / 2 + xOff;
    this.line.x1 = -offset;
    this.line.x2 = offset;
    this.line.y1 = 0;
    this.line.y2 = 0;
    this.line.markDirtyTransform();
    this.update();
  }
  update() {
    this.marker.size = this.markerSize;
    const lineEnd = this.line.visible ? this.line.x2 : -Infinity;
    const markerEnd = this.markerSize / 2;
    this.label.x = Math.max(lineEnd, markerEnd) + this.spacing;
  }
  render(renderCtx) {
    this.marker.opacity = this.opacity;
    this.label.opacity = this.opacity;
    this.line.opacity = this.opacity;
    super.render(renderCtx);
  }
}
MarkerLabel.className = 'MarkerLabel';
__decorate([ProxyPropertyOnWrite('label')], MarkerLabel.prototype, "text", void 0);
__decorate([ProxyPropertyOnWrite('label')], MarkerLabel.prototype, "fontStyle", void 0);
__decorate([ProxyPropertyOnWrite('label')], MarkerLabel.prototype, "fontWeight", void 0);
__decorate([ProxyPropertyOnWrite('label')], MarkerLabel.prototype, "fontSize", void 0);
__decorate([ProxyPropertyOnWrite('label')], MarkerLabel.prototype, "fontFamily", void 0);
__decorate([ProxyPropertyOnWrite('label', 'fill')], MarkerLabel.prototype, "color", void 0);
__decorate([ProxyPropertyOnWrite('marker', 'fill')], MarkerLabel.prototype, "markerFill", void 0);
__decorate([ProxyPropertyOnWrite('marker', 'stroke')], MarkerLabel.prototype, "markerStroke", void 0);
__decorate([ProxyPropertyOnWrite('marker', 'strokeWidth')], MarkerLabel.prototype, "markerStrokeWidth", void 0);
__decorate([ProxyPropertyOnWrite('marker', 'fillOpacity')], MarkerLabel.prototype, "markerFillOpacity", void 0);
__decorate([ProxyPropertyOnWrite('marker', 'strokeOpacity')], MarkerLabel.prototype, "markerStrokeOpacity", void 0);
__decorate([ProxyPropertyOnWrite('marker', 'visible')], MarkerLabel.prototype, "markerVisible", void 0);
__decorate([ProxyPropertyOnWrite('line', 'stroke')], MarkerLabel.prototype, "lineStroke", void 0);
__decorate([ProxyPropertyOnWrite('line', 'strokeWidth')], MarkerLabel.prototype, "lineStrokeWidth", void 0);
__decorate([ProxyPropertyOnWrite('line', 'strokeOpacity')], MarkerLabel.prototype, "lineStrokeOpacity", void 0);
__decorate([ProxyPropertyOnWrite('line', 'lineDash')], MarkerLabel.prototype, "lineLineDash", void 0);
__decorate([ProxyPropertyOnWrite('line', 'visible')], MarkerLabel.prototype, "lineVisible", void 0);