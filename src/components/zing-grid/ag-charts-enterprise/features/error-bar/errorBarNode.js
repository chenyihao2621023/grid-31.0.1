var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { _ModuleSupport, _Scene } from '@/components/zing-grid/ag-charts-community/main.js';
const { partialAssign, mergeDefaults } = _ModuleSupport;
const { BBox } = _Scene;
class HierarchicalBBox {
    constructor(components) {
        this.components = components;
        this.union = BBox.merge(components);
    }
    containsPoint(x, y) {
        if (!this.union.containsPoint(x, y)) {
            return false;
        }
        for (const bbox of this.components) {
            if (bbox.containsPoint(x, y)) {
                return true;
            }
        }
        return false;
    }
}
export class ErrorBarNode extends _Scene.Group {
    get datum() {
        return this._datum;
    }
    set datum(datum) {
        this._datum = datum;
    }
    constructor() {
        super();
        this.capLength = NaN;
        this._datum = undefined;
        this.whiskerPath = new _Scene.Path();
        this.capsPath = new _Scene.Path();
        this.bboxes = new HierarchicalBBox([]);
        this.append([this.whiskerPath, this.capsPath]);
    }
    calculateCapLength(capsTheme, capDefaults) {
        // Order of priorities for determining the length of the cap:
        // 1.  User-defined length (pixels).
        // 2.  User-defined lengthRatio.
        // 3.  Library default (defined by underlying series).
        const { lengthRatio = 1, length } = capsTheme;
        const { lengthRatioMultiplier, lengthMax } = capDefaults;
        const desiredLength = length !== null && length !== void 0 ? length : lengthRatio * lengthRatioMultiplier;
        return Math.min(desiredLength, lengthMax);
    }
    getFormatterParams(formatters, highlighted) {
        const { datum } = this;
        if (datum === undefined || (formatters.formatter === undefined && formatters.cap.formatter === undefined)) {
            return undefined;
        }
        const { xLowerKey, xLowerName, xUpperKey, xUpperName, yLowerKey, yLowerName, yUpperKey, yUpperName } = formatters;
        return {
            datum: datum.datum,
            seriesId: datum.datum.seriesId,
            xKey: datum.xKey,
            yKey: datum.yKey,
            xLowerKey,
            xLowerName,
            xUpperKey,
            xUpperName,
            yLowerKey,
            yLowerName,
            yUpperKey,
            yUpperName,
            highlighted,
        };
    }
    formatStyles(style, formatters, highlighted) {
        let { cap: capsStyle } = style, whiskerStyle = __rest(style, ["cap"]);
        const params = this.getFormatterParams(formatters, highlighted);
        if (params !== undefined) {
            if (formatters.formatter !== undefined) {
                const result = formatters.formatter(params);
                whiskerStyle = mergeDefaults(result, whiskerStyle);
                capsStyle = mergeDefaults(result, capsStyle);
                capsStyle = mergeDefaults(result === null || result === void 0 ? void 0 : result.cap, capsStyle);
            }
            if (formatters.cap.formatter !== undefined) {
                const result = formatters.cap.formatter(params);
                capsStyle = mergeDefaults(result, capsStyle);
            }
        }
        return { whiskerStyle, capsStyle };
    }
    applyStyling(target, source) {
        // Style can be any object, including user data (e.g. formatter
        // result). So filter out anything that isn't styling options:
        partialAssign(['visible', 'stroke', 'strokeWidth', 'strokeOpacity', 'lineDash', 'lineDashOffset'], target, source);
    }
    update(style, formatters, highlighted) {
        // Note: The method always uses the RedrawType.MAJOR mode for simplicity.
        // This could be optimised to reduce a amount of unnecessary redraws.
        if (this.datum === undefined) {
            return;
        }
        const { whiskerStyle, capsStyle } = this.formatStyles(style, formatters, highlighted);
        const { xBar, yBar, capDefaults } = this.datum;
        const whisker = this.whiskerPath;
        this.applyStyling(whisker, whiskerStyle);
        whisker.path.clear();
        if (yBar !== undefined) {
            whisker.path.moveTo(yBar.lowerPoint.x, yBar.lowerPoint.y);
            whisker.path.lineTo(yBar.upperPoint.x, yBar.upperPoint.y);
        }
        if (xBar !== undefined) {
            whisker.path.moveTo(xBar.lowerPoint.x, xBar.lowerPoint.y);
            whisker.path.lineTo(xBar.upperPoint.x, xBar.upperPoint.y);
        }
        whisker.path.closePath();
        whisker.markDirtyTransform();
        // ErrorBar caps stretch out perpendicular to the whisker equally on both
        // sides, so we want the offset to be half of the total length.
        this.capLength = this.calculateCapLength(capsStyle !== null && capsStyle !== void 0 ? capsStyle : {}, capDefaults);
        const capOffset = this.capLength / 2;
        const caps = this.capsPath;
        this.applyStyling(caps, capsStyle);
        caps.path.clear();
        if (yBar !== undefined) {
            caps.path.moveTo(yBar.lowerPoint.x - capOffset, yBar.lowerPoint.y);
            caps.path.lineTo(yBar.lowerPoint.x + capOffset, yBar.lowerPoint.y);
            caps.path.moveTo(yBar.upperPoint.x - capOffset, yBar.upperPoint.y);
            caps.path.lineTo(yBar.upperPoint.x + capOffset, yBar.upperPoint.y);
        }
        if (xBar !== undefined) {
            caps.path.moveTo(xBar.lowerPoint.x, xBar.lowerPoint.y - capOffset);
            caps.path.lineTo(xBar.lowerPoint.x, xBar.lowerPoint.y + capOffset);
            caps.path.moveTo(xBar.upperPoint.x, xBar.upperPoint.y - capOffset);
            caps.path.lineTo(xBar.upperPoint.x, xBar.upperPoint.y + capOffset);
        }
        caps.path.closePath();
        caps.markDirtyTransform();
    }
    updateBBoxes() {
        var _a;
        const { capLength, whiskerPath: whisker, capsPath: caps } = this;
        const { yBar, xBar } = (_a = this.datum) !== null && _a !== void 0 ? _a : {};
        const capOffset = capLength / 2;
        const components = [];
        if (yBar !== undefined) {
            const whiskerHeight = yBar.lowerPoint.y - yBar.upperPoint.y;
            components.push(new BBox(yBar.lowerPoint.x, yBar.upperPoint.y, whisker.strokeWidth, whiskerHeight), new BBox(yBar.lowerPoint.x - capOffset, yBar.lowerPoint.y, capLength, caps.strokeWidth), new BBox(yBar.upperPoint.x - capOffset, yBar.upperPoint.y, capLength, caps.strokeWidth));
        }
        if (xBar !== undefined) {
            const whiskerWidth = xBar.upperPoint.x - xBar.lowerPoint.x;
            components.push(new BBox(xBar.lowerPoint.x, xBar.upperPoint.y, whiskerWidth, whisker.strokeWidth), new BBox(xBar.lowerPoint.x, xBar.lowerPoint.y - capOffset, caps.strokeWidth, capLength), new BBox(xBar.upperPoint.x, xBar.upperPoint.y - capOffset, caps.strokeWidth, capLength));
        }
        this.bboxes.components = components;
        this.bboxes.union = BBox.merge(components);
    }
    containsPoint(x, y) {
        return this.bboxes.containsPoint(x, y);
    }
    pickNode(x, y) {
        return this.containsPoint(x, y) ? this : undefined;
    }
    nearestSquared(point, maxDistance) {
        const { bboxes } = this;
        if (bboxes.union.distanceSquared(point) > maxDistance) {
            return { nearest: undefined, distanceSquared: Infinity };
        }
        const { distanceSquared } = BBox.nearestBox(point, bboxes.components);
        return { nearest: this, distanceSquared };
    }
}
export class ErrorBarGroup extends _Scene.Group {
    get children() {
        return super.children;
    }
    nearestSquared(point) {
        const { nearest, distanceSquared } = _Scene.nearestSquaredInContainer(point, this);
        if (nearest !== undefined && !isNaN(distanceSquared)) {
            return { datum: nearest.datum, distanceSquared };
        }
    }
}
//# sourceMappingURL=errorBarNode.js.map