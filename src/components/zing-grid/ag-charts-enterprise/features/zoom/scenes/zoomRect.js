var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene } from '@/components/zing-grid/ag-charts-community/main.js';
const { COLOR_STRING, RATIO, Validate } = _ModuleSupport;
export class ZoomRect extends _Scene.Rect {
    constructor() {
        super(...arguments);
        this.fill = 'rgb(33, 150, 243)';
        this.fillOpacity = 0.2;
    }
}
ZoomRect.className = 'ZoomRect';
__decorate([
    Validate(COLOR_STRING)
], ZoomRect.prototype, "fill", void 0);
__decorate([
    Validate(RATIO)
], ZoomRect.prototype, "fillOpacity", void 0);
//# sourceMappingURL=zoomRect.js.map