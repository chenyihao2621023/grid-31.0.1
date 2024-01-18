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
import { AutoSizedLabel, formatLabels } from '../util/labelFormatter';
import { TreemapSeriesProperties } from './treemapSeriesProperties';
const { Rect, Group, BBox, Selection, Text } = _Scene;
const { Color, Logger, isEqual, sanitizeHtml } = _Util;
var TextNodeTag;
(function (TextNodeTag) {
    TextNodeTag[TextNodeTag["Primary"] = 0] = "Primary";
    TextNodeTag[TextNodeTag["Secondary"] = 1] = "Secondary";
})(TextNodeTag || (TextNodeTag = {}));
const tempText = new Text();
function getTextSize(text, style) {
    const { fontStyle, fontWeight, fontSize, fontFamily } = style;
    tempText.setProperties({
        text,
        fontStyle,
        fontWeight,
        fontSize,
        fontFamily,
        textAlign: 'left',
        textBaseline: 'top',
    });
    const { width, height } = tempText.computeBBox();
    return { width, height };
}
function validateColor(color) {
    if (typeof color === 'string' && !Color.validColorString(color)) {
        const fallbackColor = 'black';
        Logger.warnOnce(`invalid Treemap tile colour string "${color}". Affected treemap tiles will be coloured ${fallbackColor}.`);
        return fallbackColor;
    }
    return color;
}
function nodeSize(node) {
    return node.children.length > 0 ? node.sumSize - node.size : node.size;
}
const textAlignFactors = {
    left: 0,
    center: 0.5,
    right: 1,
};
const verticalAlignFactors = {
    top: 0,
    middle: 0.5,
    bottom: 1,
};
export class TreemapSeries extends _ModuleSupport.HierarchySeries {
    constructor() {
        super(...arguments);
        this.properties = new TreemapSeriesProperties();
        this.groupSelection = Selection.select(this.contentGroup, Group);
        this.highlightSelection = Selection.select(this.highlightGroup, Group);
    }
    groupTitleHeight(node, bbox) {
        var _a, _b;
        const label = (_b = (_a = this.labelData) === null || _a === void 0 ? void 0 : _a[node.index]) === null || _b === void 0 ? void 0 : _b.label;
        const { label: font } = this.properties.group;
        const heightRatioThreshold = 3;
        if (label == null) {
            return undefined;
        }
        else if (font.fontSize > bbox.width / heightRatioThreshold ||
            font.fontSize > bbox.height / heightRatioThreshold) {
            return undefined;
        }
        else {
            const { height: fontHeight } = getTextSize(label, font);
            return Math.max(fontHeight, font.fontSize);
        }
    }
    getNodePadding(node, bbox) {
        if (node.index === 0) {
            return {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
            };
        }
        else if (node.children.length === 0) {
            const { padding } = this.properties.tile;
            return {
                top: padding,
                right: padding,
                bottom: padding,
                left: padding,
            };
        }
        const { label: { spacing }, padding, } = this.properties.group;
        const fontHeight = this.groupTitleHeight(node, bbox);
        const titleHeight = fontHeight != null ? fontHeight + spacing : 0;
        return {
            top: padding + titleHeight,
            right: padding,
            bottom: padding,
            left: padding,
        };
    }
    processData() {
        const _super = Object.create(null, {
            processData: { get: () => super.processData }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.processData.call(this);
            const { childrenKey, colorKey, colorName, labelKey, secondaryLabelKey, sizeKey, sizeName, tile, group } = this.properties;
            if (!((_a = this.data) === null || _a === void 0 ? void 0 : _a.length)) {
                this.labelData = undefined;
                return;
            }
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
            this.labelData = Array.from(this.rootNode, ({ datum, depth, children }) => {
                const isLeaf = children.length === 0;
                const labelStyle = isLeaf ? tile.label : group.label;
                let label;
                if (datum != null && depth != null && labelKey != null) {
                    const value = datum[labelKey];
                    label = this.getLabelText(labelStyle, {
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
                if (isLeaf && datum != null && depth != null && secondaryLabelKey != null) {
                    const value = datum[secondaryLabelKey];
                    secondaryLabel = this.getLabelText(tile.secondaryLabel, {
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
    /**
     * Squarified Treemap algorithm
     * https://www.win.tue.nl/~vanwijk/stm.pdf
     */
    squarify(node, bbox, outputBoxes) {
        const { index, datum, children } = node;
        if (bbox.width <= 0 || bbox.height <= 0) {
            outputBoxes[index] = undefined;
            return;
        }
        outputBoxes[index] = index !== 0 ? bbox : undefined;
        const sortedChildrenIndices = Array.from(children, (_, index) => index)
            .filter((index) => nodeSize(children[index]) > 0)
            .sort((aIndex, bIndex) => nodeSize(children[bIndex]) - nodeSize(children[aIndex]));
        const childAt = (index) => {
            const sortedIndex = sortedChildrenIndices[index];
            return children[sortedIndex];
        };
        const allLeafNodes = sortedChildrenIndices.every((index) => childAt(index).children.length === 0);
        const targetTileAspectRatio = 1; // The width and height will tend to this ratio
        const padding = datum != null ? this.getNodePadding(node, bbox) : { top: 0, right: 0, bottom: 0, left: 0 };
        const width = bbox.width - padding.left - padding.right;
        const height = bbox.height - padding.top - padding.bottom;
        if (width <= 0 || height <= 0)
            return;
        const numChildren = sortedChildrenIndices.length;
        let stackSum = 0;
        let startIndex = 0;
        let minRatioDiff = Infinity;
        let partitionSum = sortedChildrenIndices.reduce((sum, sortedIndex) => sum + nodeSize(children[sortedIndex]), 0);
        const innerBox = new BBox(bbox.x + padding.left, bbox.y + padding.top, width, height);
        const partition = innerBox.clone();
        for (let i = 0; i < numChildren; i++) {
            const value = nodeSize(childAt(i));
            const firstValue = nodeSize(childAt(startIndex));
            const isVertical = partition.width < partition.height;
            stackSum += value;
            const partThickness = isVertical ? partition.height : partition.width;
            const partLength = isVertical ? partition.width : partition.height;
            const firstTileLength = (partLength * firstValue) / stackSum;
            let stackThickness = (partThickness * stackSum) / partitionSum;
            const ratio = Math.max(firstTileLength, stackThickness) / Math.min(firstTileLength, stackThickness);
            const diff = Math.abs(targetTileAspectRatio - ratio);
            if (diff < minRatioDiff) {
                minRatioDiff = diff;
                continue;
            }
            // Go one step back and process the best match
            stackSum -= value;
            stackThickness = (partThickness * stackSum) / partitionSum;
            let start = isVertical ? partition.x : partition.y;
            for (let j = startIndex; j < i; j++) {
                const child = childAt(j);
                const childSize = nodeSize(child);
                const x = isVertical ? start : partition.x;
                const y = isVertical ? partition.y : start;
                const length = (partLength * childSize) / stackSum;
                const width = isVertical ? length : stackThickness;
                const height = isVertical ? stackThickness : length;
                const childBbox = new BBox(x, y, width, height);
                this.applyGap(innerBox, childBbox, allLeafNodes);
                this.squarify(child, childBbox, outputBoxes);
                partitionSum -= childSize;
                start += length;
            }
            if (isVertical) {
                partition.y += stackThickness;
                partition.height -= stackThickness;
            }
            else {
                partition.x += stackThickness;
                partition.width -= stackThickness;
            }
            startIndex = i;
            stackSum = 0;
            minRatioDiff = Infinity;
            i--;
        }
        // Process remaining space
        const isVertical = partition.width < partition.height;
        let start = isVertical ? partition.x : partition.y;
        for (let i = startIndex; i < numChildren; i++) {
            const child = childAt(i);
            const x = isVertical ? start : partition.x;
            const y = isVertical ? partition.y : start;
            const part = nodeSize(child) / partitionSum;
            const width = partition.width * (isVertical ? part : 1);
            const height = partition.height * (isVertical ? 1 : part);
            const childBox = new BBox(x, y, width, height);
            this.applyGap(innerBox, childBox, allLeafNodes);
            this.squarify(child, childBox, outputBoxes);
            start += isVertical ? width : height;
        }
    }
    applyGap(innerBox, childBox, allLeafNodes) {
        const gap = allLeafNodes ? this.properties.tile.gap * 0.5 : this.properties.group.gap * 0.5;
        const getBounds = (box) => ({
            left: box.x,
            top: box.y,
            right: box.x + box.width,
            bottom: box.y + box.height,
        });
        const innerBounds = getBounds(innerBox);
        const childBounds = getBounds(childBox);
        const sides = ['top', 'right', 'bottom', 'left'];
        sides.forEach((side) => {
            if (!isEqual(innerBounds[side], childBounds[side])) {
                childBox.shrink(gap, side);
            }
        });
    }
    createNodeData() {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
    updateSelections() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.nodeDataRefresh) {
                return;
            }
            this.nodeDataRefresh = false;
            const { seriesRect } = (_a = this.chart) !== null && _a !== void 0 ? _a : {};
            if (!seriesRect)
                return;
            const descendants = Array.from(this.rootNode);
            const updateGroup = (group) => {
                group.append([
                    new Rect(),
                    new Text({ tag: TextNodeTag.Primary }),
                    new Text({ tag: TextNodeTag.Secondary }),
                ]);
            };
            this.groupSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
            this.highlightSelection.update(descendants, updateGroup, (node) => this.getDatumId(node));
        });
    }
    getTileFormat(node, isHighlighted) {
        var _a, _b;
        const { datum, depth, children } = node;
        const { colorKey, labelKey, secondaryLabelKey, sizeKey, tile, group, formatter } = this.properties;
        if (!formatter || datum == null || depth == null) {
            return {};
        }
        const isLeaf = children.length === 0;
        const fill = (_a = (isLeaf ? tile.fill : group.fill)) !== null && _a !== void 0 ? _a : node.fill;
        const stroke = (_b = (isLeaf ? tile.stroke : group.stroke)) !== null && _b !== void 0 ? _b : node.stroke;
        const strokeWidth = isLeaf ? tile.strokeWidth : group.strokeWidth;
        const result = this.ctx.callbackCache.call(formatter, {
            seriesId: this.id,
            depth,
            datum,
            colorKey,
            labelKey,
            secondaryLabelKey,
            sizeKey,
            fill,
            stroke,
            strokeWidth,
            highlighted: isHighlighted,
        });
        return result !== null && result !== void 0 ? result : {};
    }
    getNodeFill(node) {
        var _a, _b, _c;
        const isLeaf = node.children.length === 0;
        if (isLeaf) {
            return (_a = this.properties.tile.fill) !== null && _a !== void 0 ? _a : node.fill;
        }
        const { undocumentedGroupFills } = this.properties;
        const defaultFill = undocumentedGroupFills[Math.min((_b = node.depth) !== null && _b !== void 0 ? _b : 0, undocumentedGroupFills.length)];
        return (_c = this.properties.group.fill) !== null && _c !== void 0 ? _c : defaultFill;
    }
    getNodeStroke(node) {
        var _a, _b, _c;
        const isLeaf = node.children.length === 0;
        if (isLeaf) {
            return (_a = this.properties.tile.stroke) !== null && _a !== void 0 ? _a : node.stroke;
        }
        const { undocumentedGroupStrokes } = this.properties;
        const defaultStroke = undocumentedGroupStrokes[Math.min((_b = node.depth) !== null && _b !== void 0 ? _b : 0, undocumentedGroupStrokes.length)];
        return (_c = this.properties.group.stroke) !== null && _c !== void 0 ? _c : defaultStroke;
    }
    updateNodes() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { rootNode, data } = this;
            const { highlightStyle, tile, group } = this.properties;
            const { seriesRect } = (_a = this.chart) !== null && _a !== void 0 ? _a : {};
            if (!seriesRect || !data)
                return;
            const { width, height } = seriesRect;
            const bboxes = Array.from(this.rootNode, () => undefined);
            this.squarify(rootNode, new BBox(0, 0, width, height), bboxes);
            let highlightedNode = (_b = this.ctx.highlightManager) === null || _b === void 0 ? void 0 : _b.getActiveHighlight();
            if (highlightedNode != null && !this.properties.group.interactive && highlightedNode.children.length !== 0) {
                highlightedNode = undefined;
            }
            this.updateNodeMidPoint(bboxes);
            const updateRectFn = (node, rect, highlighted) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                const bbox = bboxes[node.index];
                if (bbox == null) {
                    rect.visible = false;
                    return;
                }
                const isLeaf = node.children.length === 0;
                let highlightedFill;
                let highlightedFillOpacity;
                let highlightedStroke;
                let highlightedStrokeWidth;
                let highlightedStrokeOpacity;
                if (highlighted) {
                    const { tile, group } = highlightStyle;
                    highlightedFill = isLeaf ? tile.fill : group.fill;
                    highlightedFillOpacity = isLeaf ? tile.fillOpacity : group.fillOpacity;
                    highlightedStroke = isLeaf ? tile.stroke : group.stroke;
                    highlightedStrokeWidth = isLeaf ? tile.strokeWidth : group.strokeWidth;
                    highlightedStrokeOpacity = isLeaf ? tile.strokeOpacity : group.strokeOpacity;
                }
                const format = this.getTileFormat(node, highlighted);
                const fill = (_b = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : highlightedFill) !== null && _b !== void 0 ? _b : this.getNodeFill(node);
                const fillOpacity = (_d = (_c = format === null || format === void 0 ? void 0 : format.fillOpacity) !== null && _c !== void 0 ? _c : highlightedFillOpacity) !== null && _d !== void 0 ? _d : (isLeaf ? tile.fillOpacity : group.fillOpacity);
                const stroke = (_f = (_e = format === null || format === void 0 ? void 0 : format.stroke) !== null && _e !== void 0 ? _e : highlightedStroke) !== null && _f !== void 0 ? _f : this.getNodeStroke(node);
                const strokeWidth = (_h = (_g = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _g !== void 0 ? _g : highlightedStrokeWidth) !== null && _h !== void 0 ? _h : (isLeaf ? tile.strokeWidth : group.strokeWidth);
                const strokeOpacity = (_k = (_j = format === null || format === void 0 ? void 0 : format.strokeOpacity) !== null && _j !== void 0 ? _j : highlightedStrokeOpacity) !== null && _k !== void 0 ? _k : (isLeaf ? tile.strokeOpacity : group.strokeOpacity);
                rect.fill = validateColor(fill);
                rect.fillOpacity = fillOpacity;
                rect.stroke = validateColor(stroke);
                rect.strokeWidth = strokeWidth;
                rect.strokeOpacity = strokeOpacity;
                rect.crisp = true;
                rect.x = bbox.x;
                rect.y = bbox.y;
                rect.width = bbox.width;
                rect.height = bbox.height;
                rect.visible = true;
            };
            this.groupSelection.selectByClass(Rect).forEach((rect) => updateRectFn(rect.datum, rect, false));
            this.highlightSelection.selectByClass(Rect).forEach((rect) => {
                var _a;
                const isDatumHighlighted = rect.datum === highlightedNode;
                rect.visible = isDatumHighlighted || ((_a = highlightedNode === null || highlightedNode === void 0 ? void 0 : highlightedNode.contains(rect.datum)) !== null && _a !== void 0 ? _a : false);
                if (rect.visible) {
                    updateRectFn(rect.datum, rect, isDatumHighlighted);
                }
            });
            const labelMeta = Array.from(this.rootNode, (node) => {
                var _a, _b, _c, _d;
                const { index, children } = node;
                const bbox = bboxes[index];
                const labelDatum = (_a = this.labelData) === null || _a === void 0 ? void 0 : _a[index];
                if (bbox == null || labelDatum == null)
                    return undefined;
                if (children.length === 0) {
                    const layout = {
                        width: bbox.width,
                        height: bbox.height,
                        meta: null,
                    };
                    const formatting = formatLabels(labelDatum.label, this.properties.tile.label, labelDatum.secondaryLabel, this.properties.tile.secondaryLabel, { padding: tile.padding }, () => layout);
                    if (formatting == null)
                        return undefined;
                    const { height, label, secondaryLabel } = formatting;
                    const { textAlign, verticalAlign, padding } = tile;
                    const textAlignFactor = (_b = textAlignFactors[textAlign]) !== null && _b !== void 0 ? _b : 0.5;
                    const labelX = bbox.x + padding + (bbox.width - 2 * padding) * textAlignFactor;
                    const verticalAlignFactor = (_c = verticalAlignFactors[verticalAlign]) !== null && _c !== void 0 ? _c : 0.5;
                    const labelYStart = bbox.y + padding + height * 0.5 + (bbox.height - 2 * padding - height) * verticalAlignFactor;
                    return {
                        label: label != null
                            ? {
                                text: label.text,
                                fontSize: label.fontSize,
                                lineHeight: label.lineHeight,
                                style: this.properties.tile.label,
                                x: labelX,
                                y: labelYStart - (height - label.height) * 0.5,
                            }
                            : undefined,
                        secondaryLabel: secondaryLabel != null
                            ? {
                                text: secondaryLabel.text,
                                fontSize: secondaryLabel.fontSize,
                                lineHeight: secondaryLabel.fontSize,
                                style: this.properties.tile.secondaryLabel,
                                x: labelX,
                                y: labelYStart + (height - secondaryLabel.height) * 0.5,
                            }
                            : undefined,
                        verticalAlign: 'middle',
                        textAlign,
                    };
                }
                else if ((labelDatum === null || labelDatum === void 0 ? void 0 : labelDatum.label) != null) {
                    const { padding, textAlign } = group;
                    const groupTitleHeight = this.groupTitleHeight(node, bbox);
                    if (groupTitleHeight == null)
                        return undefined;
                    const innerWidth = bbox.width - 2 * padding;
                    const { text } = Text.wrap(labelDatum.label, bbox.width - 2 * padding, Infinity, group.label, 'never');
                    const textAlignFactor = (_d = textAlignFactors[textAlign]) !== null && _d !== void 0 ? _d : 0.5;
                    return {
                        label: {
                            text,
                            fontSize: group.label.fontSize,
                            lineHeight: AutoSizedLabel.lineHeight(group.label.fontSize),
                            style: this.properties.group.label,
                            x: bbox.x + padding + innerWidth * textAlignFactor,
                            y: bbox.y + padding + groupTitleHeight * 0.5,
                        },
                        secondaryLabel: undefined,
                        verticalAlign: 'middle',
                        textAlign,
                    };
                }
                else {
                    return undefined;
                }
            });
            const updateLabelFn = (node, text, tag, highlighted) => {
                const isLeaf = node.children.length === 0;
                const meta = labelMeta[node.index];
                const label = tag === TextNodeTag.Primary ? meta === null || meta === void 0 ? void 0 : meta.label : meta === null || meta === void 0 ? void 0 : meta.secondaryLabel;
                if (meta == null || label == null) {
                    text.visible = false;
                    return;
                }
                let highlightedColor;
                if (highlighted) {
                    const { tile, group } = highlightStyle;
                    highlightedColor = !isLeaf
                        ? group.label.color
                        : tag === TextNodeTag.Primary
                            ? tile.label.color
                            : tile.secondaryLabel.color;
                }
                text.text = label.text;
                text.fontSize = label.fontSize;
                text.lineHeight = label.lineHeight;
                text.fontStyle = label.style.fontStyle;
                text.fontFamily = label.style.fontFamily;
                text.fontWeight = label.style.fontWeight;
                text.fill = highlightedColor !== null && highlightedColor !== void 0 ? highlightedColor : label.style.color;
                text.textAlign = meta.textAlign;
                text.textBaseline = meta.verticalAlign;
                text.x = label.x;
                text.y = label.y;
                text.visible = true;
            };
            this.groupSelection.selectByClass(Text).forEach((text) => {
                updateLabelFn(text.datum, text, text.tag, false);
            });
            this.highlightSelection.selectByClass(Text).forEach((text) => {
                var _a;
                const isDatumHighlighted = text.datum === highlightedNode;
                text.visible = isDatumHighlighted || ((_a = highlightedNode === null || highlightedNode === void 0 ? void 0 : highlightedNode.contains(text.datum)) !== null && _a !== void 0 ? _a : false);
                if (text.visible) {
                    updateLabelFn(text.datum, text, text.tag, isDatumHighlighted);
                }
            });
        });
    }
    updateNodeMidPoint(bboxes) {
        this.rootNode.walk((node) => {
            const bbox = bboxes[node.index];
            if (bbox != null) {
                node.midPoint.x = bbox.x + bbox.width / 2;
                node.midPoint.y = bbox.y;
            }
        });
    }
    getTooltipHtml(node) {
        var _a;
        const { datum, depth } = node;
        const { id: seriesId } = this;
        const { tooltip, colorKey, colorName = colorKey, labelKey, secondaryLabelKey, sizeKey, sizeName = sizeKey, } = this.properties;
        const isLeaf = node.children.length === 0;
        const interactive = isLeaf || this.properties.group.interactive;
        if (datum == null || depth == null || !interactive) {
            return '';
        }
        const title = labelKey != null ? datum[labelKey] : undefined;
        const format = this.getTileFormat(node, false);
        const color = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : this.getNodeFill(node);
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
            color: isLeaf ? this.properties.tile.label.color : this.properties.group.label.color,
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
}
TreemapSeries.className = 'TreemapSeries';
TreemapSeries.type = 'treemap';
//# sourceMappingURL=treemapSeries.js.map