var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BaseProperties } from '../../util/properties';
import { BOOLEAN, FUNCTION, OBJECT, Validate } from '../../util/validation';
import { TooltipPosition, toTooltipHtml } from '../tooltip/tooltip';
class SeriesTooltipInteraction extends BaseProperties {
    constructor() {
        super(...arguments);
        this.enabled = false;
    }
}
__decorate([
    Validate(BOOLEAN)
], SeriesTooltipInteraction.prototype, "enabled", void 0);
export class SeriesTooltip extends BaseProperties {
    constructor() {
        super(...arguments);
        this.enabled = true;
        this.interaction = new SeriesTooltipInteraction();
        this.position = new TooltipPosition();
    }
    toTooltipHtml(defaults, params) {
        if (this.renderer) {
            return toTooltipHtml(this.renderer(params), defaults);
        }
        return toTooltipHtml(defaults);
    }
}
__decorate([
    Validate(BOOLEAN)
], SeriesTooltip.prototype, "enabled", void 0);
__decorate([
    Validate(BOOLEAN, { optional: true })
], SeriesTooltip.prototype, "showArrow", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], SeriesTooltip.prototype, "renderer", void 0);
__decorate([
    Validate(OBJECT)
], SeriesTooltip.prototype, "interaction", void 0);
__decorate([
    Validate(OBJECT)
], SeriesTooltip.prototype, "position", void 0);
