var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { getFont } from '../../scene/shape/text';
import { Default } from '../../util/default';
import { BOOLEAN, COLOR_STRING, DEGREE, FONT_STYLE, FONT_WEIGHT, NUMBER, NUMBER_OR_NAN, POSITIVE_NUMBER, STRING, Validate, } from '../../util/validation';
export class AxisLabel {
    constructor() {
        this.enabled = true;
        /** If set to `false`, axis labels will not be wrapped on multiple lines. */
        this.autoWrap = false;
        /** Used to constrain the width of the label when `autoWrap` is `true`, if the label text width exceeds the `maxWidth`, it will be wrapped on multiple lines automatically. If `maxWidth` is omitted, a default width constraint will be applied. */
        this.maxWidth = undefined;
        /** Used to constrain the height of the multiline label, if the label text height exceeds the `maxHeight`, it will be truncated automatically. If `maxHeight` is omitted, a default height constraint will be applied. */
        this.maxHeight = undefined;
        this.fontStyle = undefined;
        this.fontWeight = undefined;
        this.fontSize = 12;
        this.fontFamily = 'Verdana, sans-serif';
        /**
         * The padding between the labels and the ticks.
         */
        this.padding = 5;
        /**
         * Minimum gap in pixels between the axis labels before being removed to avoid collisions.
         */
        this.minSpacing = NaN;
        /**
         * The color of the labels.
         * Use `undefined` rather than `rgba(0, 0, 0, 0)` to make labels invisible.
         */
        this.color = 'rgba(87, 87, 87, 1)';
        /**
         * Custom label rotation in degrees.
         * Labels are rendered perpendicular to the axis line by default.
         * Or parallel to the axis line, if the {@link parallel} is set to `true`.
         * The value of this config is used as the angular offset/deflection
         * from the default rotation.
         */
        this.rotation = undefined;
        /**
         * Avoid axis label collision by automatically reducing the number of ticks displayed. If set to `false`, axis labels may collide.
         */
        this.avoidCollisions = true;
        /**
         * By default, labels and ticks are positioned to the left of the axis line.
         * `true` positions the labels to the right of the axis line.
         * However, if the axis is rotated, it's easier to think in terms
         * of this side or the opposite side, rather than left and right.
         * We use the term `mirror` for conciseness, although it's not
         * true mirroring - for example, when a label is rotated, so that
         * it is inclined at the 45 degree angle, text flowing from north-west
         * to south-east, ending at the tick to the left of the axis line,
         * and then we set this config to `true`, the text will still be flowing
         * from north-west to south-east, _starting_ at the tick to the right
         * of the axis line.
         */
        this.mirrored = false;
        /**
         * Labels are rendered perpendicular to the axis line by default.
         * Setting this config to `true` makes labels render parallel to the axis line
         * and center aligns labels' text at the ticks.
         */
        this.parallel = false;
        /**
         * In case {@param value} is a number, the {@param fractionDigits} parameter will
         * be provided as well. The `fractionDigits` corresponds to the number of fraction
         * digits used by the tick step. For example, if the tick step is `0.0005`,
         * the `fractionDigits` is 4.
         */
        this.formatter = undefined;
    }
    /**
     * The side of the axis line to position the labels on.
     * -1 = left (default)
     * 1 = right
     */
    getSideFlag() {
        return this.mirrored ? 1 : -1;
    }
    getFont() {
        return getFont(this);
    }
}
__decorate([
    Validate(BOOLEAN)
], AxisLabel.prototype, "enabled", void 0);
__decorate([
    Validate(BOOLEAN, { optional: true })
], AxisLabel.prototype, "autoWrap", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], AxisLabel.prototype, "maxWidth", void 0);
__decorate([
    Validate(POSITIVE_NUMBER, { optional: true })
], AxisLabel.prototype, "maxHeight", void 0);
__decorate([
    Validate(FONT_STYLE, { optional: true })
], AxisLabel.prototype, "fontStyle", void 0);
__decorate([
    Validate(FONT_WEIGHT, { optional: true })
], AxisLabel.prototype, "fontWeight", void 0);
__decorate([
    Validate(NUMBER.restrict({ min: 1 }))
], AxisLabel.prototype, "fontSize", void 0);
__decorate([
    Validate(STRING)
], AxisLabel.prototype, "fontFamily", void 0);
__decorate([
    Validate(POSITIVE_NUMBER)
], AxisLabel.prototype, "padding", void 0);
__decorate([
    Validate(NUMBER_OR_NAN),
    Default(NaN)
], AxisLabel.prototype, "minSpacing", void 0);
__decorate([
    Validate(COLOR_STRING, { optional: true })
], AxisLabel.prototype, "color", void 0);
__decorate([
    Validate(DEGREE, { optional: true })
], AxisLabel.prototype, "rotation", void 0);
__decorate([
    Validate(BOOLEAN)
], AxisLabel.prototype, "avoidCollisions", void 0);
__decorate([
    Validate(BOOLEAN)
], AxisLabel.prototype, "mirrored", void 0);
__decorate([
    Validate(BOOLEAN)
], AxisLabel.prototype, "parallel", void 0);
__decorate([
    Validate(STRING, { optional: true })
], AxisLabel.prototype, "format", void 0);
//# sourceMappingURL=axisLabel.js.map