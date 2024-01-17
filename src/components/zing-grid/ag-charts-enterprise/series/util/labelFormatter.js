var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _ModuleSupport, _Scene, _Util } from '@/components/zing-grid/ag-charts-community/main.js';
const { Validate, NUMBER, TEXT_WRAP, OVERFLOW_STRATEGY } = _ModuleSupport;
const { Logger } = _Util;
const { Text, Label } = _Scene;
class BaseAutoSizedLabel extends Label {
    constructor() {
        super(...arguments);
        this.wrapping = 'on-space';
        this.overflowStrategy = 'ellipsis';
    }
    static lineHeight(fontSize) {
        return Math.ceil(fontSize * Text.defaultLineHeightRatio);
    }
}
__decorate([
    Validate(TEXT_WRAP)
], BaseAutoSizedLabel.prototype, "wrapping", void 0);
__decorate([
    Validate(OVERFLOW_STRATEGY)
], BaseAutoSizedLabel.prototype, "overflowStrategy", void 0);
__decorate([
    Validate(NUMBER, { optional: true })
], BaseAutoSizedLabel.prototype, "minimumFontSize", void 0);
export class AutoSizedLabel extends BaseAutoSizedLabel {
    constructor() {
        super(...arguments);
        this.spacing = 0;
    }
}
__decorate([
    Validate(NUMBER)
], AutoSizedLabel.prototype, "spacing", void 0);
export class AutoSizeableSecondaryLabel extends BaseAutoSizedLabel {
}
export function generateLabelSecondaryLabelFontSizeCandidates(label, secondaryLabel) {
    const { fontSize: labelFontSize, minimumFontSize: labelMinimumFontSize = labelFontSize } = label;
    const { fontSize: secondaryLabelFontSize, minimumFontSize: secondaryLabelMinimumFontSize = secondaryLabelFontSize, } = secondaryLabel;
    const labelTracks = labelFontSize - labelMinimumFontSize;
    const secondaryLabelTracks = secondaryLabelFontSize - secondaryLabelMinimumFontSize;
    let currentLabelFontSize = label.fontSize;
    let currentSecondaryLabelFontSize = secondaryLabel.fontSize;
    const out = [{ labelFontSize, secondaryLabelFontSize }];
    while (currentLabelFontSize > labelMinimumFontSize ||
        currentSecondaryLabelFontSize > secondaryLabelMinimumFontSize) {
        const labelProgress = labelTracks > 0 ? (currentLabelFontSize - labelMinimumFontSize) / labelTracks : -1;
        const secondaryLabelProgress = secondaryLabelTracks > 0
            ? (currentSecondaryLabelFontSize - secondaryLabelMinimumFontSize) / secondaryLabelTracks
            : -1;
        if (labelProgress > secondaryLabelProgress) {
            currentLabelFontSize--;
        }
        else {
            currentSecondaryLabelFontSize--;
        }
        out.push({
            labelFontSize: currentLabelFontSize,
            secondaryLabelFontSize: currentSecondaryLabelFontSize,
        });
    }
    out.reverse();
    return out;
}
export function maximumValueSatisfying(from, to, iteratee) {
    // Binary search of layouts returning the largest value
    if (from > to) {
        return undefined;
    }
    let min = from;
    let max = to;
    let found;
    while (max >= min) {
        const index = ((max + min) / 2) | 0;
        const value = iteratee(index);
        if (value != null) {
            found = value;
            min = index + 1;
        }
        else {
            max = index - 1;
        }
    }
    return found;
}
export function formatStackedLabels(labelValue, labelProps, secondaryLabelValue, secondaryLabelProps, { padding }, sizeFittingHeight) {
    var _a, _b;
    const { spacing } = labelProps;
    const widthAdjust = 2 * padding;
    const heightAdjust = 2 * padding + spacing;
    const minimumHeight = ((_a = labelProps.minimumFontSize) !== null && _a !== void 0 ? _a : labelProps.fontSize) +
        ((_b = secondaryLabelProps.minimumFontSize) !== null && _b !== void 0 ? _b : secondaryLabelProps.fontSize);
    if (minimumHeight > sizeFittingHeight(minimumHeight + heightAdjust).height - heightAdjust) {
        return undefined;
    }
    const fontSizeCandidates = generateLabelSecondaryLabelFontSizeCandidates(labelProps, secondaryLabelProps);
    const labelTextNode = new Text();
    labelTextNode.setFont(labelProps);
    const labelTextSizeProps = {
        fontFamily: labelProps.fontFamily,
        fontSize: labelProps.fontSize,
        fontStyle: labelProps.fontStyle,
        fontWeight: labelProps.fontWeight,
    };
    const secondaryLabelTextNode = new Text();
    secondaryLabelTextNode.setFont(secondaryLabelProps);
    const secondaryLabelTextSizeProps = {
        fontFamily: secondaryLabelProps.fontFamily,
        fontSize: secondaryLabelProps.fontSize,
        fontStyle: secondaryLabelProps.fontStyle,
        fontWeight: secondaryLabelProps.fontWeight,
    };
    // The font size candidates will repeat some font sizes, so cache the results so we don't do extra text measuring
    let label;
    let secondaryLabel;
    return maximumValueSatisfying(0, fontSizeCandidates.length - 1, (index) => {
        const { labelFontSize, secondaryLabelFontSize } = fontSizeCandidates[index];
        const allowTruncation = index === 0;
        const labelLineHeight = AutoSizedLabel.lineHeight(labelFontSize);
        const secondaryLabelLineHeight = AutoSizeableSecondaryLabel.lineHeight(secondaryLabelFontSize);
        const sizeFitting = sizeFittingHeight(labelLineHeight + secondaryLabelLineHeight + heightAdjust);
        const availableWidth = sizeFitting.width - widthAdjust;
        const availableHeight = sizeFitting.height - heightAdjust;
        if (labelLineHeight + secondaryLabelLineHeight > availableHeight) {
            return undefined;
        }
        if (label == null || label.fontSize !== labelFontSize) {
            labelTextSizeProps.fontSize = labelFontSize;
            const { lines: labelLines } = Text.wrapLines(labelValue, availableWidth, availableHeight, labelTextSizeProps, labelProps.wrapping, allowTruncation ? labelProps.overflowStrategy : 'hide');
            if (labelLines != null) {
                const labelText = labelLines.join('\n');
                labelTextNode.text = labelText;
                labelTextNode.fontSize = labelFontSize;
                labelTextNode.lineHeight = labelFontSize;
                const labelWidth = labelTextNode.computeBBox().width;
                const labelHeight = labelLines.length * labelLineHeight;
                label = {
                    text: labelText,
                    fontSize: labelFontSize,
                    lineHeight: labelLineHeight,
                    width: labelWidth,
                    height: labelHeight,
                };
            }
            else {
                label = undefined;
            }
        }
        if (label == null || label.width > availableWidth || label.height > availableHeight) {
            return undefined;
        }
        if (secondaryLabel == null || secondaryLabel.fontSize !== secondaryLabelFontSize) {
            secondaryLabelTextSizeProps.fontSize = secondaryLabelFontSize;
            const { lines: secondaryLabelLines } = Text.wrapLines(secondaryLabelValue, availableWidth, availableHeight, secondaryLabelTextSizeProps, secondaryLabelProps.wrapping, allowTruncation ? secondaryLabelProps.overflowStrategy : 'hide');
            if (secondaryLabelLines != null) {
                const secondaryLabelText = secondaryLabelLines.join('\n');
                secondaryLabelTextNode.text = secondaryLabelText;
                secondaryLabelTextNode.fontSize = secondaryLabelFontSize;
                secondaryLabelTextNode.lineHeight = secondaryLabelLineHeight;
                const secondaryLabelWidth = secondaryLabelTextNode.computeBBox().width;
                const secondaryLabelHeight = secondaryLabelLines.length * secondaryLabelLineHeight;
                secondaryLabel = {
                    text: secondaryLabelText,
                    fontSize: secondaryLabelFontSize,
                    lineHeight: secondaryLabelLineHeight,
                    width: secondaryLabelWidth,
                    height: secondaryLabelHeight,
                };
            }
            else {
                secondaryLabel = undefined;
            }
        }
        if (secondaryLabel == null) {
            return undefined;
        }
        const totalLabelHeight = label.height + secondaryLabel.height;
        if (secondaryLabel.width > availableWidth || totalLabelHeight > availableHeight) {
            return undefined;
        }
        return {
            width: Math.max(label.width, secondaryLabel.width),
            height: totalLabelHeight + spacing,
            meta: sizeFitting.meta,
            label,
            secondaryLabel,
        };
    });
}
export function formatSingleLabel(value, props, { padding }, sizeFittingHeight) {
    var _a;
    const sizeAdjust = 2 * padding;
    const minimumFontSize = Math.min((_a = props.minimumFontSize) !== null && _a !== void 0 ? _a : props.fontSize, props.fontSize);
    const textNode = new Text();
    textNode.setFont(props);
    const textSizeProps = {
        fontFamily: props.fontFamily,
        fontSize: props.fontSize,
        fontStyle: props.fontStyle,
        fontWeight: props.fontWeight,
    };
    return maximumValueSatisfying(minimumFontSize, props.fontSize, (fontSize) => {
        const lineHeight = AutoSizedLabel.lineHeight(fontSize);
        const sizeFitting = sizeFittingHeight(lineHeight + sizeAdjust);
        const availableWidth = sizeFitting.width - sizeAdjust;
        const availableHeight = sizeFitting.height - sizeAdjust;
        if (lineHeight > availableHeight) {
            return undefined;
        }
        const allowTruncation = fontSize === minimumFontSize;
        textSizeProps.fontSize = fontSize;
        const { lines } = Text.wrapLines(value, availableWidth, availableHeight, textSizeProps, props.wrapping, allowTruncation ? props.overflowStrategy : 'hide');
        if (lines == null) {
            return undefined;
        }
        const text = lines.join('\n');
        textNode.text = text;
        textNode.fontSize = fontSize;
        textNode.lineHeight = lineHeight;
        const size = textNode.computeBBox();
        const width = textNode.computeBBox().width;
        const height = lineHeight * lines.length;
        if (size.width > availableWidth || height > availableHeight) {
            return undefined;
        }
        return [{ text, fontSize, lineHeight, width, height }, sizeFitting.meta];
    });
}
function hasInvalidFontSize(label) {
    return label != null && label.minimumFontSize != null && label.fontSize && label.minimumFontSize > label.fontSize;
}
export function formatLabels(baseLabelValue, labelProps, baseSecondaryLabelValue, secondaryLabelProps, layoutParams, sizeFittingHeight) {
    const labelValue = labelProps.enabled ? baseLabelValue : undefined;
    const secondaryLabelValue = secondaryLabelProps.enabled ? baseSecondaryLabelValue : undefined;
    if (hasInvalidFontSize(labelProps) || hasInvalidFontSize(secondaryLabelProps)) {
        Logger.warnOnce(`minimumFontSize should be set to a value less than or equal to the font size`);
    }
    let value;
    if (labelValue != null && secondaryLabelValue != null) {
        value = formatStackedLabels(labelValue, labelProps, secondaryLabelValue, secondaryLabelProps, layoutParams, sizeFittingHeight);
    }
    let labelMeta;
    if (value == null && labelValue != null) {
        labelMeta = formatSingleLabel(labelValue, labelProps, layoutParams, sizeFittingHeight);
    }
    if (labelMeta != null) {
        const [label, meta] = labelMeta;
        value = {
            width: label.width,
            height: label.height,
            meta: meta,
            label,
            secondaryLabel: undefined,
        };
    }
    let secondaryLabelMeta;
    // Only print secondary label on its own if the primary label was not specified
    if (value == null && labelValue == null && secondaryLabelValue != null) {
        secondaryLabelMeta = formatSingleLabel(secondaryLabelValue, secondaryLabelProps, layoutParams, sizeFittingHeight);
    }
    if (secondaryLabelMeta != null) {
        const [secondaryLabel, meta] = secondaryLabelMeta;
        value = {
            width: secondaryLabel.width,
            height: secondaryLabel.height,
            meta,
            label: undefined,
            secondaryLabel,
        };
    }
    return value;
}
//# sourceMappingURL=labelFormatter.js.map