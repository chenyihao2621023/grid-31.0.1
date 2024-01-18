var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { _ModuleSupport, _Scene, _Util, } from '@/components/zing-grid/zing-charts-community/main.js';
import { formatLabels } from '../util/labelFormatter';
import { SunburstSeriesProperties } from './sunburstSeriesProperties';
const { fromToMotion } = _ModuleSupport;
const { Sector, Group, Selection, Text } = _Scene;
const { sanitizeHtml } = _Util;
const getAngleData = (node, startAngle = 0, angleScale = (2 * Math.PI) / node.sumSize, angleData = Array.from(node, () => undefined)) => {
    let currentAngle = startAngle;
    for (const child of node.children) {
        const start = currentAngle;
        const end = currentAngle + child.sumSize * angleScale;
        angleData[child.index] = { start, end };
        getAngleData(child, start, angleScale, angleData);
        currentAngle = end;
    }
    return angleData;
};
var CircleQuarter;
(function (CircleQuarter) {
    CircleQuarter[CircleQuarter["TopLeft"] = 1] = "TopLeft";
    CircleQuarter[CircleQuarter["TopRight"] = 2] = "TopRight";
    CircleQuarter[CircleQuarter["BottomRight"] = 4] = "BottomRight";
    CircleQuarter[CircleQuarter["BottomLeft"] = 8] = "BottomLeft";
    CircleQuarter[CircleQuarter["Top"] = 3] = "Top";
    CircleQuarter[CircleQuarter["Right"] = 6] = "Right";
    CircleQuarter[CircleQuarter["Bottom"] = 12] = "Bottom";
    CircleQuarter[CircleQuarter["Left"] = 9] = "Left";
})(CircleQuarter || (CircleQuarter = {}));
var LabelPlacement;
(function (LabelPlacement) {
    LabelPlacement[LabelPlacement["CenterCircle"] = 0] = "CenterCircle";
    LabelPlacement[LabelPlacement["Parallel"] = 1] = "Parallel";
    LabelPlacement[LabelPlacement["Perpendicular"] = 2] = "Perpendicular";
})(LabelPlacement || (LabelPlacement = {}));
var TextNodeTag;
(function (TextNodeTag) {
    TextNodeTag[TextNodeTag["Primary"] = 0] = "Primary";
    TextNodeTag[TextNodeTag["Secondary"] = 1] = "Secondary";
})(TextNodeTag || (TextNodeTag = {}));
export class SunburstSeries extends _ModuleSupport.HierarchySeries {
    constructor() {
        super(...arguments);
        this.properties = new SunburstSeriesProperties();
        this.groupSelection = Selection.select(this.contentGroup, Group);
        this.highlightSelection = Selection.select(this.highlightGroup, Group);
        this.angleData = [];
    }
    processData() {
        const _super = Object.create(null, {
            processData: { get: () => super.processData }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName } = this.properties;
            _super.processData.call(this);
            this.angleData = getAngleData(this.rootNode);
            const defaultLabelFormatter = (value) => {
                if (typeof value === 'number') {
                    // This copies what other series are doing - we should look to provide format customization
                    return value.toFixed(2);
                }
                else if (typeof value === 'string') {
                    return value;
                }
                else {
                    return '';
                }
            };
            this.labelData = Array.from(this.rootNode, ({ datum, depth }) => {
                let label;
                if (datum != null && depth != null && labelKey != null) {
                    const value = datum[labelKey];
                    label = this.getLabelText(this.properties.label, {
                        depth,
                        datum,
                        childrenKey,
                        colorKey,
                        colorName,
                        labelKey,
                        secondaryLabelKey,
                        sizeKey,
                        sizeName,
                        value,
                    }, defaultLabelFormatter);
                }
                if (label === '') {
                    label = undefined;
                }
                let secondaryLabel;
                if (datum != null && depth != null && secondaryLabelKey != null) {
                    const value = datum[secondaryLabelKey];
                    secondaryLabel = this.getLabelText(this.properties.secondaryLabel, {
                        depth,
                        datum,
                        childrenKey,
                        colorKey,
                        colorName,
                        labelKey,
                        secondaryLabelKey,
                        sizeKey,
                        sizeName,
                        value,
                    }, defaultLabelFormatter);
                }
                if (secondaryLabel === '') {
                    secondaryLabel = undefined;
                }
                return label != null || secondaryLabel != null ? { label, secondaryLabel } : undefined;
            });
        });
    }
    updateSelections() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.nodeDataRefresh)
                return;
            this.nodeDataRefresh = false;
            const { chart } = this;
            if (chart == null)
                return;
            const seriesRect = chart.seriesRect;
            if (seriesRect == null)
                return;
            const descendants = Array.from(this.rootNode);
            const updateGroup = (group) => {
                group.append([
                    new Sector(),
                    new Text({ tag: TextNodeTag.Primary }),
                    new Text({ tag: TextNodeTag.Secondary }),
                ]);
            };
            this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
            this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
        });
    }
    updateNodes() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { chart, data, maxDepth, labelData } = this;
            if (chart == null || data == null || labelData == null) {
                return;
            }
            const { width, height } = chart.seriesRect;
            const { sectorSpacing = 0, padding = 0, highlightStyle } = this.properties;
            this.contentGroup.translationX = width / 2;
            this.contentGroup.translationY = height / 2;
            this.highlightGroup.translationX = width / 2;
            this.highlightGroup.translationY = height / 2;
            const baseInset = sectorSpacing * 0.5;
            const radius = Math.min(width, height) / 2;
            const radiusScale = radius / (maxDepth + 1);
            const angleOffset = -Math.PI / 2;
            const highlightedNode = (_a = this.ctx.highlightManager) === null || _a === void 0 ? void 0 : _a.getActiveHighlight();
            const labelTextNode = new Text();
            labelTextNode.setFont(this.properties.label);
            this.rootNode.walk((node) => {
                const angleDatum = this.angleData[node.index];
                if (node.depth != null && angleDatum != null) {
                    const midAngle = angleDatum.end - angleDatum.start;
                    const midRadius = (node.depth + 0.5) * radiusScale;
                    node.midPoint.x = Math.cos(midAngle) * midRadius;
                    node.midPoint.y = Math.sin(midAngle) * midRadius;
                }
            });
            const updateSector = (node, sector, highlighted) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                const { depth } = node;
                const angleDatum = this.angleData[node.index];
                if (depth == null || angleDatum == null) {
                    sector.visible = false;
                    return;
                }
                sector.visible = true;
                let highlightedFill;
                let highlightedFillOpacity;
                let highlightedStroke;
                let highlightedStrokeWidth;
                let highlightedStrokeOpacity;
                if (highlighted) {
                    highlightedFill = highlightStyle.fill;
                    highlightedFillOpacity = highlightStyle.fillOpacity;
                    highlightedStroke = highlightStyle.stroke;
                    highlightedStrokeWidth = highlightStyle.strokeWidth;
                    highlightedStrokeOpacity = highlightStyle.strokeOpacity;
                }
                const format = this.getSectorFormat(node, highlighted);
                const fill = (_b = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : highlightedFill) !== null && _b !== void 0 ? _b : node.fill;
                const fillOpacity = (_d = (_c = format === null || format === void 0 ? void 0 : format.fillOpacity) !== null && _c !== void 0 ? _c : highlightedFillOpacity) !== null && _d !== void 0 ? _d : this.properties.fillOpacity;
                const stroke = (_f = (_e = format === null || format === void 0 ? void 0 : format.stroke) !== null && _e !== void 0 ? _e : highlightedStroke) !== null && _f !== void 0 ? _f : node.stroke;
                const strokeWidth = (_h = (_g = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _g !== void 0 ? _g : highlightedStrokeWidth) !== null && _h !== void 0 ? _h : this.properties.strokeWidth;
                const strokeOpacity = (_k = (_j = format === null || format === void 0 ? void 0 : format.strokeOpacity) !== null && _j !== void 0 ? _j : highlightedStrokeOpacity) !== null && _k !== void 0 ? _k : this.properties.strokeOpacity;
                sector.fill = fill;
                sector.fillOpacity = fillOpacity;
                sector.stroke = stroke;
                sector.strokeWidth = strokeWidth;
                sector.strokeOpacity = strokeOpacity;
                sector.centerX = 0;
                sector.centerY = 0;
                sector.innerRadius = depth * radiusScale;
                sector.outerRadius = (depth + 1) * radiusScale;
                sector.angleOffset = angleOffset;
                sector.startAngle = angleDatum.start;
                sector.endAngle = angleDatum.end;
                sector.inset = baseInset + strokeWidth * 0.5;
            };
            this.groupSelection.selectByClass(Sector).forEach((sector) => {
                updateSector(sector.datum, sector, false);
            });
            this.highlightSelection.selectByClass(Sector).forEach((sector) => {
                const node = sector.datum;
                const isHighlighted = highlightedNode === node;
                sector.visible = isHighlighted;
                if (sector.visible) {
                    updateSector(sector.datum, sector, isHighlighted);
                }
            });
            const labelMeta = Array.from(this.rootNode, (node, index) => {
                const { depth } = node;
                const labelDatum = labelData[index];
                const angleData = this.angleData[index];
                if (depth == null || angleData == null)
                    return undefined;
                const innerRadius = depth * radiusScale + baseInset;
                const outerRadius = (depth + 1) * radiusScale - baseInset;
                const innerAngleOffset = innerRadius > baseInset ? baseInset / innerRadius : baseInset;
                const outerAngleOffset = outerRadius > baseInset ? baseInset / outerRadius : baseInset;
                const innerStartAngle = angleData.start + innerAngleOffset;
                const innerEndAngle = angleData.end + innerAngleOffset;
                const deltaInnerAngle = innerEndAngle - innerStartAngle;
                const outerStartAngle = angleData.start + outerAngleOffset;
                const outerEndAngle = angleData.end + outerAngleOffset;
                const deltaOuterAngle = outerEndAngle - outerStartAngle;
                const sizeFittingHeight = (height) => {
                    var _a;
                    const isCenterCircle = depth === 0 && ((_a = node.parent) === null || _a === void 0 ? void 0 : _a.sumSize) === node.sumSize;
                    if (isCenterCircle) {
                        const width = 2 * Math.sqrt(Math.pow(outerRadius, 2) - Math.pow((height * 0.5), 2));
                        return { width, height, meta: LabelPlacement.CenterCircle };
                    }
                    const parallelHeight = height;
                    const availableWidthUntilItHitsTheOuterRadius = 2 * Math.sqrt(Math.pow(outerRadius, 2) - Math.pow((innerRadius + parallelHeight), 2));
                    const availableWidthUntilItHitsTheStraightEdges = deltaInnerAngle < Math.PI ? 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5) : Infinity;
                    const parallelWidth = Math.min(availableWidthUntilItHitsTheOuterRadius, availableWidthUntilItHitsTheStraightEdges);
                    let perpendicularHeight;
                    let perpendicularWidth;
                    if (depth === 0) {
                        // Wedge from center - maximize the width of a box with fixed height
                        perpendicularHeight = height;
                        perpendicularWidth =
                            Math.sqrt(Math.pow(outerRadius, 2) - Math.pow((perpendicularHeight / 2), 2)) -
                                height / (2 * Math.tan(deltaOuterAngle * 0.5));
                    }
                    else {
                        // Outer wedge - fit the height to the sector, then fit the width
                        perpendicularHeight = 2 * innerRadius * Math.tan(deltaInnerAngle * 0.5);
                        perpendicularWidth = Math.sqrt(Math.pow(outerRadius, 2) - Math.pow((perpendicularHeight / 2), 2)) - innerRadius;
                    }
                    return parallelWidth >= perpendicularWidth
                        ? { width: parallelWidth, height: parallelHeight, meta: LabelPlacement.Parallel }
                        : { width: perpendicularWidth, height: perpendicularHeight, meta: LabelPlacement.Perpendicular };
                };
                const formatting = formatLabels(labelDatum === null || labelDatum === void 0 ? void 0 : labelDatum.label, this.properties.label, labelDatum === null || labelDatum === void 0 ? void 0 : labelDatum.secondaryLabel, this.properties.secondaryLabel, { padding }, sizeFittingHeight);
                if (formatting == null)
                    return undefined;
                const { width, height, meta: labelPlacement, label, secondaryLabel } = formatting;
                const theta = angleOffset + (angleData.start + angleData.end) / 2;
                const top = Math.sin(theta) >= 0;
                const right = Math.cos(theta) >= 0;
                const circleQuarter = (top ? CircleQuarter.Top : CircleQuarter.Bottom) & (right ? CircleQuarter.Right : CircleQuarter.Left);
                let radius;
                switch (labelPlacement) {
                    case LabelPlacement.CenterCircle:
                        radius = 0;
                        break;
                    case LabelPlacement.Parallel: {
                        const opticalCentering = 0.58; // Between 0 and 1 - there's no maths behind this, just what visually looks good
                        const idealRadius = outerRadius - (radiusScale - height) * opticalCentering;
                        const maximumRadius = Math.sqrt(Math.pow((outerRadius - padding), 2) - Math.pow((width / 2), 2));
                        radius = Math.min(idealRadius, maximumRadius);
                        break;
                    }
                    case LabelPlacement.Perpendicular:
                        if (depth === 0) {
                            const minimumRadius = height / (2 * Math.tan(deltaInnerAngle * 0.5)) + width * 0.5;
                            const maximumRadius = Math.sqrt(Math.pow(outerRadius, 2) - Math.pow((height * 0.5), 2)) - width * 0.5;
                            radius = (minimumRadius + maximumRadius) * 0.5;
                        }
                        else {
                            radius = (innerRadius + outerRadius) * 0.5;
                        }
                        break;
                }
                return { width, height, labelPlacement, circleQuarter, radius, theta, label, secondaryLabel };
            });
            const updateText = (node, text, tag, highlighted) => {
                const { index, depth } = node;
                const meta = labelMeta === null || labelMeta === void 0 ? void 0 : labelMeta[index];
                const labelStyle = tag === TextNodeTag.Primary ? this.properties.label : this.properties.secondaryLabel;
                const label = tag === TextNodeTag.Primary ? meta === null || meta === void 0 ? void 0 : meta.label : meta === null || meta === void 0 ? void 0 : meta.secondaryLabel;
                if (depth == null || meta == null || label == null) {
                    text.visible = false;
                    return;
                }
                const { height, labelPlacement, circleQuarter, radius, theta } = meta;
                let highlightedColor;
                if (highlighted) {
                    const highlightedLabelStyle = tag === TextNodeTag.Primary
                        ? this.properties.highlightStyle.label
                        : this.properties.highlightStyle.secondaryLabel;
                    highlightedColor = highlightedLabelStyle.color;
                }
                text.text = label.text;
                text.fontSize = label.fontSize;
                text.lineHeight = label.lineHeight;
                text.fontStyle = labelStyle.fontStyle;
                text.fontFamily = labelStyle.fontFamily;
                text.fontWeight = labelStyle.fontWeight;
                text.fill = highlightedColor !== null && highlightedColor !== void 0 ? highlightedColor : labelStyle.color;
                switch (labelPlacement) {
                    case LabelPlacement.CenterCircle:
                        text.textAlign = 'center';
                        text.textBaseline = 'top';
                        text.translationX = 0;
                        text.translationY = (tag === TextNodeTag.Primary ? 0 : height - label.height) - height * 0.5;
                        text.rotation = 0;
                        break;
                    case LabelPlacement.Parallel: {
                        const topHalf = (circleQuarter & CircleQuarter.Top) !== 0;
                        const translationRadius = (tag === TextNodeTag.Primary) === !topHalf ? radius : radius - (height - label.height);
                        text.textAlign = 'center';
                        text.textBaseline = topHalf ? 'bottom' : 'top';
                        text.translationX = Math.cos(theta) * translationRadius;
                        text.translationY = Math.sin(theta) * translationRadius;
                        text.rotation = topHalf ? theta - Math.PI * 0.5 : theta + Math.PI * 0.5;
                        break;
                    }
                    case LabelPlacement.Perpendicular: {
                        const rightHalf = (circleQuarter & CircleQuarter.Right) !== 0;
                        const translation = (tag === TextNodeTag.Primary) === !rightHalf
                            ? (height - label.height) * 0.5
                            : (label.height - height) * 0.5;
                        text.textAlign = 'center';
                        text.textBaseline = 'middle';
                        text.translationX = Math.cos(theta) * radius + Math.cos(theta + Math.PI / 2) * translation;
                        text.translationY = Math.sin(theta) * radius + Math.sin(theta + Math.PI / 2) * translation;
                        text.rotation = rightHalf ? theta : theta + Math.PI;
                        break;
                    }
                }
                text.visible = true;
            };
            this.groupSelection.selectByClass(Text).forEach((text) => {
                updateText(text.datum, text, text.tag, false);
            });
            this.highlightSelection.selectByClass(Text).forEach((text) => {
                const node = text.datum;
                const isHighlighted = highlightedNode === node;
                text.visible = isHighlighted;
                if (text.visible) {
                    updateText(text.datum, text, text.tag, isHighlighted);
                }
            });
        });
    }
    getSectorFormat(node, isHighlighted) {
        const { datum, fill, stroke, depth } = node;
        const { ctx: { callbackCache }, properties: { formatter }, } = this;
        if (!formatter || datum == null || depth == null) {
            return {};
        }
        const { colorKey, labelKey, sizeKey, strokeWidth } = this.properties;
        const result = callbackCache.call(formatter, {
            seriesId: this.id,
            depth,
            datum,
            colorKey,
            labelKey,
            sizeKey,
            fill,
            stroke,
            strokeWidth,
            highlighted: isHighlighted,
        });
        return result !== null && result !== void 0 ? result : {};
    }
    getTooltipHtml(node) {
        var _a;
        const { id: seriesId } = this;
        const { tooltip, colorKey, colorName = colorKey, labelKey, secondaryLabelKey, sizeKey, sizeName = sizeKey, } = this.properties;
        const { datum, depth } = node;
        if (datum == null || depth == null) {
            return '';
        }
        const title = labelKey != null ? datum[labelKey] : undefined;
        const format = this.getSectorFormat(node, false);
        const color = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : node.fill;
        if (!tooltip.renderer && !title) {
            return '';
        }
        const contentArray = [];
        const datumSecondaryLabel = secondaryLabelKey != null ? datum[secondaryLabelKey] : undefined;
        if (datumSecondaryLabel != null && secondaryLabelKey !== colorKey && secondaryLabelKey !== sizeKey) {
            contentArray.push(sanitizeHtml(datumSecondaryLabel));
        }
        const datumSize = sizeKey != null ? datum[sizeKey] : undefined;
        if (datumSize != null) {
            contentArray.push(`${sizeName}: ${sanitizeHtml(datumSize)}`);
        }
        const datumColor = colorKey != null ? datum[colorKey] : undefined;
        if (datumColor != null) {
            contentArray.push(`${colorName}: ${sanitizeHtml(datumColor)}`);
        }
        const content = contentArray.join('<br>');
        const defaults = {
            title,
            color: this.properties.label.color,
            backgroundColor: color,
            content,
        };
        return tooltip.toTooltipHtml(defaults, {
            depth,
            datum,
            colorKey,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            title,
            color,
            seriesId,
        });
    }
    createNodeData() {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
    animateEmptyUpdateReady({ datumSelections, }) {
        fromToMotion(this.id, 'nodes', this.ctx.animationManager, datumSelections, {
            toFn(_group, _datum, _status) {
                return { scalingX: 1, scalingY: 1 };
            },
            fromFn(group, datum, status) {
                if (status === 'unknown' && datum != null && group.previousDatum == null) {
                    return { scalingX: 0, scalingY: 0 };
                }
                else {
                    return { scalingX: 1, scalingY: 1 };
                }
            },
        });
    }
}
SunburstSeries.className = 'SunburstSeries';
SunburstSeries.type = 'sunburst';
//# sourceMappingURL=sunburstSeries.js.map