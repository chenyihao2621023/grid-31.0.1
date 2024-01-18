var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene } from '@/components/zing-grid/zing-charts-community/main.js';
const { DropShadow, Label } = _Scene;
const { AbstractBarSeriesProperties, BaseProperties, PropertiesArray, SeriesTooltip, Validate, BOOLEAN, COLOR_STRING, FUNCTION, LINE_DASH, NUMBER, OBJECT, OBJECT_ARRAY, POSITIVE_NUMBER, RATIO, STRING, UNION, } = _ModuleSupport;
export class WaterfallSeriesTotal extends BaseProperties {
}
__decorate([
    Validate(UNION(['subtotal', 'total'], 'a total type'))
], WaterfallSeriesTotal.prototype, "totalType", void 0);
__decorate([
    Validate(NUMBER)
], WaterfallSeriesTotal.prototype, "index", void 0);
__decorate([
    Validate(STRING)
], WaterfallSeriesTotal.prototype, "axisLabel", void 0);
class WaterfallSeriesItemTooltip extends BaseProperties {
}
__decorate([
    Validate(FUNCTION, { optional: true })
], WaterfallSeriesItemTooltip.prototype, "renderer", void 0);
class WaterfallSeriesLabel extends Label {
    constructor() {
        super(...arguments);
        this.placement = 'end';
        this.padding = 6;
    }
}
__decorate([
    Validate(UNION(['start', 'end', 'inside'], 'a placement'))
], WaterfallSeriesLabel.prototype, "placement", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], WaterfallSeriesLabel.prototype, "padding", void 0);
export class WaterfallSeriesItem extends BaseProperties {
    constructor() {
        super(...arguments);
        this.fill = '#c16068';
        this.stroke = '#c16068';
        this.fillOpacity = 1;
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.strokeWidth = 1;
        this.cornerRadius = 0;
        this.shadow = new DropShadow().set({ enabled: false });
        this.label = new WaterfallSeriesLabel();
        this.tooltip = new WaterfallSeriesItemTooltip();
    }
}
__decorate([
    Validate(STRING, { optional: true })
], WaterfallSeriesItem.prototype, "name", void 0);
__decorate([
    Validate(COLOR_STRING)
], WaterfallSeriesItem.prototype, "fill", void 0);
__decorate([
    Validate(COLOR_STRING)
], WaterfallSeriesItem.prototype, "stroke", void 0);
__decorate([
    Validate(RATIO)
], WaterfallSeriesItem.prototype, "fillOpacity", void 0);
__decorate([
    Validate(RATIO)
], WaterfallSeriesItem.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH)
], WaterfallSeriesItem.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], WaterfallSeriesItem.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], WaterfallSeriesItem.prototype, "strokeWidth", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], WaterfallSeriesItem.prototype, "cornerRadius", void 0);
__decorate([
    Validate(FUNCTION, { optional: true })
], WaterfallSeriesItem.prototype, "formatter", void 0);
__decorate([
    Validate(OBJECT)
], WaterfallSeriesItem.prototype, "shadow", void 0);
__decorate([
    Validate(OBJECT)
], WaterfallSeriesItem.prototype, "label", void 0);
__decorate([
    Validate(OBJECT)
], WaterfallSeriesItem.prototype, "tooltip", void 0);
class WaterfallSeriesConnectorLine extends BaseProperties {
    constructor() {
        super(...arguments);
        this.enabled = true;
        this.stroke = 'black';
        this.strokeOpacity = 1;
        this.lineDash = [0];
        this.lineDashOffset = 0;
        this.strokeWidth = 2;
    }
}
__decorate([
    Validate(BOOLEAN)
], WaterfallSeriesConnectorLine.prototype, "enabled", void 0);
__decorate([
    Validate(COLOR_STRING)
], WaterfallSeriesConnectorLine.prototype, "stroke", void 0);
__decorate([
    Validate(RATIO)
], WaterfallSeriesConnectorLine.prototype, "strokeOpacity", void 0);
__decorate([
    Validate(LINE_DASH)
], WaterfallSeriesConnectorLine.prototype, "lineDash", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], WaterfallSeriesConnectorLine.prototype, "lineDashOffset", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], WaterfallSeriesConnectorLine.prototype, "strokeWidth", void 0);
class WaterfallSeriesItems extends BaseProperties {
    constructor() {
        super(...arguments);
        this.positive = new WaterfallSeriesItem();
        this.negative = new WaterfallSeriesItem();
        this.total = new WaterfallSeriesItem();
    }
}
__decorate([
    Validate(OBJECT)
], WaterfallSeriesItems.prototype, "positive", void 0);
__decorate([
    Validate(OBJECT)
], WaterfallSeriesItems.prototype, "negative", void 0);
__decorate([
    Validate(OBJECT)
], WaterfallSeriesItems.prototype, "total", void 0);
export class WaterfallSeriesProperties extends AbstractBarSeriesProperties {
    constructor() {
        super(...arguments);
        this.item = new WaterfallSeriesItems();
        this.totals = new PropertiesArray(WaterfallSeriesTotal);
        this.line = new WaterfallSeriesConnectorLine();
        this.tooltip = new SeriesTooltip();
    }
}
__decorate([
    Validate(STRING)
], WaterfallSeriesProperties.prototype, "xKey", void 0);
__decorate([
    Validate(STRING)
], WaterfallSeriesProperties.prototype, "yKey", void 0);
__decorate([
    Validate(STRING, { optional: true })
], WaterfallSeriesProperties.prototype, "xName", void 0);
__decorate([
    Validate(STRING, { optional: true })
], WaterfallSeriesProperties.prototype, "yName", void 0);
__decorate([
    Validate(OBJECT)
], WaterfallSeriesProperties.prototype, "item", void 0);
__decorate([
    Validate(OBJECT_ARRAY)
], WaterfallSeriesProperties.prototype, "totals", void 0);
__decorate([
    Validate(OBJECT)
], WaterfallSeriesProperties.prototype, "line", void 0);
__decorate([
    Validate(OBJECT)
], WaterfallSeriesProperties.prototype, "tooltip", void 0);
//# sourceMappingURL=waterfallSeriesProperties.js.map