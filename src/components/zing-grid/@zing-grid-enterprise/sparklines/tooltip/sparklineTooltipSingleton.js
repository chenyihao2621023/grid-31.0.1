var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Bean, BeanStub, PostConstruct, PreDestroy } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { SparklineTooltip } from '../sparkline/tooltip/sparklineTooltip';

let SparklineTooltipSingleton = class SparklineTooltipSingleton extends BeanStub {
    postConstruct() {
        this.tooltip = new SparklineTooltip();
    }
    getSparklineTooltip() {
        return this.tooltip;
    }
    destroyTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy();
        }
    }
};
__decorate([
    PostConstruct
], SparklineTooltipSingleton.prototype, "postConstruct", null);
__decorate([
    PreDestroy
], SparklineTooltipSingleton.prototype, "destroyTooltip", null);
SparklineTooltipSingleton = __decorate([
    Bean('sparklineTooltipSingleton')
], SparklineTooltipSingleton);
export { SparklineTooltipSingleton };
