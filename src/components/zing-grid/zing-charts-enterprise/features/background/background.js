var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport } from '@/components/zing-grid/zing-charts-community/main.js';
const { ActionOnSet } = _ModuleSupport;
export class Background extends _ModuleSupport.Background {
    constructor(ctx) {
        super(ctx);
        this.updateService = ctx.updateService;
    }
    onLayoutComplete(event) {
        super.onLayoutComplete(event);
        if (this.image) {
            const { width, height } = event.chart;
            this.image.performLayout(width, height);
        }
    }
    onImageLoad() {
        this.updateService.update(_ModuleSupport.ChartUpdateType.SCENE_RENDER);
    }
}
__decorate([
    ActionOnSet({
        newValue(image) {
            this.node.appendChild(image.node);
            image.onload = () => this.onImageLoad();
        },
        oldValue(image) {
            this.node.removeChild(image.node);
            image.onload = undefined;
        },
    })
], Background.prototype, "image", void 0);
//# sourceMappingURL=background.js.map