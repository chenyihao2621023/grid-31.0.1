var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
import { fromToMotion } from '../../../motion/fromToMotion';
import { LinearScale } from '../../../scale/linearScale';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import { Line } from '../../../scene/shape/line';
import { Sector } from '../../../scene/shape/sector';
import { Text } from '../../../scene/shape/text';
import { normalizeAngle180, toRadians } from '../../../util/angle';
import { jsonDiff } from '../../../util/json';
import { Logger } from '../../../util/logger';
import { mod, toFixed } from '../../../util/number';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { boxCollidesSector, isPointInSector } from '../../../util/sector';
import { isNumber } from '../../../util/value';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { animationValidation, diff, normalisePropertyTo } from '../../data/processors';
import { Layers } from '../../layers';
import { Circle } from '../../marker/circle';
import { SeriesNodeClickEvent, accumulativeValueProperty, keyProperty, rangedValueProperty, valueProperty, } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation, seriesLabelFadeOutAnimation } from '../seriesLabelUtil';
import { PieSeriesProperties } from './pieSeriesProperties';
import { preparePieSeriesAnimationFunctions, resetPieSelectionsFn } from './pieUtil';
import { PolarSeries } from './polarSeries';
class PieSeriesNodeClickEvent extends SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.properties.angleKey;
        this.radiusKey = series.properties.radiusKey;
        this.calloutLabelKey = series.properties.calloutLabelKey;
        this.sectorLabelKey = series.properties.sectorLabelKey;
    }
}
var PieNodeTag;
(function (PieNodeTag) {
    PieNodeTag[PieNodeTag["Sector"] = 0] = "Sector";
    PieNodeTag[PieNodeTag["Callout"] = 1] = "Callout";
    PieNodeTag[PieNodeTag["Label"] = 2] = "Label";
})(PieNodeTag || (PieNodeTag = {}));
export class PieSeries extends PolarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            useLabelLayer: true,
            animationResetFns: { item: resetPieSelectionsFn, label: resetLabelFn },
        });
        this.properties = new PieSeriesProperties();
        this.previousRadiusScale = new LinearScale();
        this.radiusScale = new LinearScale();
        // The group node that contains the background graphics.
        this.backgroundGroup = this.rootGroup.appendChild(new Group({
            name: `${this.id}-background`,
            layer: true,
            zIndex: Layers.SERIES_BACKGROUND_ZINDEX,
        }));
        // AG-6193 If the sum of all datums is 0, then we'll draw 1 or 2 rings to represent the empty series.
        this.zerosumRingsGroup = this.backgroundGroup.appendChild(new Group({ name: `${this.id}-zerosumRings` }));
        this.zerosumOuterRing = this.zerosumRingsGroup.appendChild(new Circle());
        this.zerosumInnerRing = this.zerosumRingsGroup.appendChild(new Circle());
        this.innerCircleGroup = this.backgroundGroup.appendChild(new Group({ name: `${this.id}-innerCircle` }));
        this.nodeData = [];
        // When a user toggles a series item (e.g. from the legend), its boolean state is recorded here.
        this.seriesItemEnabled = [];
        this.surroundingRadius = undefined;
        this.NodeClickEvent = PieSeriesNodeClickEvent;
        this.angleScale = new LinearScale();
        // Each sector is a ratio of the whole, where all ratios add up to 1.
        this.angleScale.domain = [0, 1];
        // Add 90 deg to start the first pie at 12 o'clock.
        this.angleScale.range = [-Math.PI, Math.PI].map((angle) => angle + Math.PI / 2);
        const pieCalloutLabels = new Group({ name: 'pieCalloutLabels' });
        const pieSectorLabels = new Group({ name: 'pieSectorLabels' });
        const innerLabels = new Group({ name: 'innerLabels' });
        this.labelGroup.append(pieCalloutLabels);
        this.labelGroup.append(pieSectorLabels);
        this.labelGroup.append(innerLabels);
        this.calloutLabelSelection = Selection.select(pieCalloutLabels, Group);
        this.sectorLabelSelection = Selection.select(pieSectorLabels, Text);
        this.innerLabelsSelection = Selection.select(innerLabels, Text);
        this.innerCircleSelection = Selection.select(this.innerCircleGroup, Circle);
        for (const circle of [this.zerosumInnerRing, this.zerosumOuterRing]) {
            circle.fillOpacity = 0;
            circle.stroke = this.properties.calloutLabel.color;
            circle.strokeWidth = 1;
            circle.strokeOpacity = 1;
        }
    }
    addChartEventListeners() {
        var _a;
        (_a = this.ctx.chartEventManager) === null || _a === void 0 ? void 0 : _a.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
    }
    visibleChanged() {
        this.processSeriesItemEnabled();
    }
    get visible() {
        return this.seriesItemEnabled.length ? this.seriesItemEnabled.some((visible) => visible) : super.visible;
    }
    processSeriesItemEnabled() {
        var _a;
        const { data, visible } = this;
        this.seriesItemEnabled = (_a = data === null || data === void 0 ? void 0 : data.map(() => visible)) !== null && _a !== void 0 ? _a : [];
    }
    nodeFactory() {
        return new Sector();
    }
    getSeriesDomain(direction) {
        if (direction === ChartAxisDirection.X) {
            return this.angleScale.domain;
        }
        else {
            return this.radiusScale.domain;
        }
    }
    processData(dataController) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.data == null || !this.properties.isValid()) {
                return;
            }
            let { data } = this;
            const { seriesItemEnabled } = this;
            const { angleKey, radiusKey, calloutLabelKey, sectorLabelKey, legendItemKey } = this.properties;
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            const extraKeyProps = [];
            const extraProps = [];
            // Order here should match `getDatumIdFromData()`.
            if (legendItemKey) {
                extraKeyProps.push(keyProperty(this, legendItemKey, false, { id: `legendItemKey` }));
            }
            else if (calloutLabelKey) {
                extraKeyProps.push(keyProperty(this, calloutLabelKey, false, { id: `calloutLabelKey` }));
            }
            else if (sectorLabelKey) {
                extraKeyProps.push(keyProperty(this, sectorLabelKey, false, { id: `sectorLabelKey` }));
            }
            if (radiusKey) {
                extraProps.push(rangedValueProperty(this, radiusKey, {
                    id: 'radiusValue',
                    min: (_a = this.properties.radiusMin) !== null && _a !== void 0 ? _a : 0,
                    max: this.properties.radiusMax,
                }), valueProperty(this, radiusKey, true, { id: `radiusRaw` }), // Raw value pass-through.
                normalisePropertyTo(this, { id: 'radiusValue' }, [0, 1], 1, (_b = this.properties.radiusMin) !== null && _b !== void 0 ? _b : 0, this.properties.radiusMax));
            }
            if (calloutLabelKey) {
                extraProps.push(valueProperty(this, calloutLabelKey, false, { id: `calloutLabelValue` }));
            }
            if (sectorLabelKey) {
                extraProps.push(valueProperty(this, sectorLabelKey, false, { id: `sectorLabelValue` }));
            }
            if (legendItemKey) {
                extraProps.push(valueProperty(this, legendItemKey, false, { id: `legendItemValue` }));
            }
            if (animationEnabled && this.processedData && extraKeyProps.length > 0) {
                extraProps.push(diff(this.processedData));
            }
            extraProps.push(animationValidation(this));
            data = data.map((d, idx) => (seriesItemEnabled[idx] ? d : Object.assign(Object.assign({}, d), { [angleKey]: 0 })));
            yield this.requestDataModel(dataController, data, {
                props: [
                    ...extraKeyProps,
                    accumulativeValueProperty(this, angleKey, true, { id: `angleValue`, onlyPositive: true }),
                    valueProperty(this, angleKey, true, { id: `angleRaw` }), // Raw value pass-through.
                    normalisePropertyTo(this, { id: 'angleValue' }, [0, 1], 0, 0),
                    ...extraProps,
                ],
            });
            // AG-9879 Warning about missing data.
            for (const valueDef of (_e = (_d = (_c = this.processedData) === null || _c === void 0 ? void 0 : _c.defs) === null || _d === void 0 ? void 0 : _d.values) !== null && _e !== void 0 ? _e : []) {
                // The 'angleRaw' is an undocumented property for the internal implementation, so ignore this.
                // If any 'angleRaw' values are missing, then we'll also be missing 'angleValue' values and
                // will log a warning anyway.
                const { id, missing, property } = valueDef;
                if (id !== 'angleRaw' && missing !== undefined && missing > 0) {
                    Logger.warnOnce(`no value was found for the key '${String(property)}' on ${missing} data element${missing > 1 ? 's' : ''}`);
                }
            }
            this.animationState.transition('updateData');
        });
    }
    maybeRefreshNodeData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.nodeDataRefresh)
                return;
            const [{ nodeData = [] } = {}] = yield this.createNodeData();
            this.nodeData = nodeData;
            this.nodeDataRefresh = false;
        });
    }
    getProcessedDataIndexes(dataModel) {
        const angleIdx = dataModel.resolveProcessedDataIndexById(this, `angleValue`).index;
        const radiusIdx = this.properties.radiusKey
            ? dataModel.resolveProcessedDataIndexById(this, `radiusValue`).index
            : -1;
        const calloutLabelIdx = this.properties.calloutLabelKey
            ? dataModel.resolveProcessedDataIndexById(this, `calloutLabelValue`).index
            : -1;
        const sectorLabelIdx = this.properties.sectorLabelKey
            ? dataModel.resolveProcessedDataIndexById(this, `sectorLabelValue`).index
            : -1;
        const legendItemIdx = this.properties.legendItemKey
            ? dataModel.resolveProcessedDataIndexById(this, `legendItemValue`).index
            : -1;
        return { angleIdx, radiusIdx, calloutLabelIdx, sectorLabelIdx, legendItemIdx };
    }
    createNodeData() {
        return __awaiter(this, void 0, void 0, function* () {
            const { id: seriesId, processedData, dataModel, angleScale } = this;
            const { rotation } = this.properties;
            if (!processedData || !dataModel || processedData.type !== 'ungrouped')
                return [];
            const { angleIdx, radiusIdx, calloutLabelIdx, sectorLabelIdx, legendItemIdx } = this.getProcessedDataIndexes(dataModel);
            let currentStart = 0;
            let sum = 0;
            const nodeData = processedData.data.map((group, index) => {
                var _a;
                const { datum, values } = group;
                const currentValue = values[angleIdx];
                const startAngle = angleScale.convert(currentStart) + toRadians(rotation);
                currentStart = currentValue;
                sum += currentValue;
                const endAngle = angleScale.convert(currentStart) + toRadians(rotation);
                const span = Math.abs(endAngle - startAngle);
                const midAngle = startAngle + span / 2;
                const angleValue = values[angleIdx + 1];
                const radius = radiusIdx >= 0 ? (_a = values[radiusIdx]) !== null && _a !== void 0 ? _a : 1 : 1;
                const radiusValue = radiusIdx >= 0 ? values[radiusIdx + 1] : undefined;
                const legendItemValue = legendItemIdx >= 0 ? values[legendItemIdx] : undefined;
                const labels = this.getLabels(datum, midAngle, span, true, values[calloutLabelIdx], values[sectorLabelIdx], legendItemValue);
                const sectorFormat = this.getSectorFormat(datum, index, false);
                return Object.assign({ itemId: index, series: this, datum,
                    index,
                    angleValue,
                    midAngle, midCos: Math.cos(midAngle), midSin: Math.sin(midAngle), startAngle,
                    endAngle,
                    sectorFormat,
                    radiusValue,
                    radius, innerRadius: Math.max(this.radiusScale.convert(0), 0), outerRadius: Math.max(this.radiusScale.convert(radius), 0), legendItemValue }, labels);
            });
            this.zerosumOuterRing.visible = sum === 0;
            this.zerosumInnerRing.visible =
                sum === 0 && this.properties.innerRadiusRatio !== 1 && this.properties.innerRadiusRatio > 0;
            return [{ itemId: seriesId, nodeData, labelData: nodeData }];
        });
    }
    getLabels(datum, midAngle, span, skipDisabled, calloutLabelValue, sectorLabelValue, legendItemValue) {
        const { calloutLabel, sectorLabel, legendItemKey } = this.properties;
        const calloutLabelKey = !skipDisabled || calloutLabel.enabled ? this.properties.calloutLabelKey : undefined;
        const sectorLabelKey = !skipDisabled || sectorLabel.enabled ? this.properties.sectorLabelKey : undefined;
        if (!calloutLabelKey && !sectorLabelKey && !legendItemKey) {
            return {};
        }
        const labelFormatterParams = {
            datum,
            angleKey: this.properties.angleKey,
            angleName: this.properties.angleName,
            radiusKey: this.properties.radiusKey,
            radiusName: this.properties.radiusName,
            calloutLabelKey: this.properties.calloutLabelKey,
            calloutLabelName: this.properties.calloutLabelName,
            sectorLabelKey: this.properties.sectorLabelKey,
            sectorLabelName: this.properties.sectorLabelName,
            legendItemKey: this.properties.legendItemKey,
        };
        const result = {};
        if (calloutLabelKey && span > toRadians(calloutLabel.minAngle)) {
            result.calloutLabel = Object.assign(Object.assign({}, this.getTextAlignment(midAngle)), { text: this.getLabelText(calloutLabel, Object.assign(Object.assign({}, labelFormatterParams), { value: calloutLabelValue })), hidden: false, collisionTextAlign: undefined, collisionOffsetY: 0, box: undefined });
        }
        if (sectorLabelKey) {
            result.sectorLabel = {
                text: this.getLabelText(sectorLabel, Object.assign(Object.assign({}, labelFormatterParams), { value: sectorLabelValue })),
            };
        }
        if (legendItemKey != null && legendItemValue != null) {
            result.legendItem = { key: legendItemKey, text: legendItemValue };
        }
        return result;
    }
    getTextAlignment(midAngle) {
        const quadrantTextOpts = [
            { textAlign: 'center', textBaseline: 'bottom' },
            { textAlign: 'left', textBaseline: 'middle' },
            { textAlign: 'center', textBaseline: 'hanging' },
            { textAlign: 'right', textBaseline: 'middle' },
        ];
        const midAngle180 = normalizeAngle180(midAngle);
        // Split the circle into quadrants like so: ⊗
        const quadrantStart = (-3 * Math.PI) / 4; // same as `normalizeAngle180(toRadians(-135))`
        const quadrantOffset = midAngle180 - quadrantStart;
        const quadrant = Math.floor(quadrantOffset / (Math.PI / 2));
        const quadrantIndex = mod(quadrant, quadrantTextOpts.length);
        return quadrantTextOpts[quadrantIndex];
    }
    getSectorFormat(datum, formatIndex, highlight) {
        var _a, _b, _c, _d, _e;
        const { callbackCache, highlightManager } = this.ctx;
        const { angleKey, radiusKey, fills, strokes, formatter, sectorSpacing, __BACKGROUND_COLOR_DO_NOT_USE } = this.properties;
        const highlightedDatum = highlightManager.getActiveHighlight();
        const isDatumHighlighted = highlight && (highlightedDatum === null || highlightedDatum === void 0 ? void 0 : highlightedDatum.series) === this && formatIndex === highlightedDatum.itemId;
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity } = mergeDefaults(isDatumHighlighted && this.properties.highlightStyle.item, {
            fill: fills.length > 0 ? fills[formatIndex % fills.length] : undefined,
            fillOpacity: this.properties.fillOpacity,
            // @todo(AG-10275) Remove sectorSpacing null case
            stroke: sectorSpacing != null
                ? strokes.length > 0
                    ? strokes[formatIndex % strokes.length]
                    : undefined
                : strokes.length > 0
                    ? strokes[formatIndex % strokes.length]
                    : __BACKGROUND_COLOR_DO_NOT_USE,
            strokeWidth: this.getStrokeWidth(this.properties.strokeWidth),
            strokeOpacity: this.getOpacity(),
        });
        let format;
        if (formatter) {
            format = callbackCache.call(formatter, {
                datum,
                angleKey,
                radiusKey,
                fill,
                stroke,
                fills,
                strokes,
                strokeWidth,
                highlighted: isDatumHighlighted,
                seriesId: this.id,
            });
        }
        return {
            fill: (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill,
            fillOpacity: (_b = format === null || format === void 0 ? void 0 : format.fillOpacity) !== null && _b !== void 0 ? _b : fillOpacity,
            stroke: (_c = format === null || format === void 0 ? void 0 : format.stroke) !== null && _c !== void 0 ? _c : stroke,
            strokeWidth: (_d = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _d !== void 0 ? _d : strokeWidth,
            strokeOpacity: (_e = format === null || format === void 0 ? void 0 : format.strokeOpacity) !== null && _e !== void 0 ? _e : strokeOpacity,
        };
    }
    getInnerRadius() {
        const { radius } = this;
        const { innerRadiusRatio, innerRadiusOffset } = this.properties;
        const innerRadius = radius * innerRadiusRatio + innerRadiusOffset;
        if (innerRadius === radius || innerRadius < 0) {
            return 0;
        }
        return innerRadius;
    }
    getOuterRadius() {
        return Math.max(this.radius * this.properties.outerRadiusRatio + this.properties.outerRadiusOffset, 0);
    }
    updateRadiusScale(resize) {
        const newRange = [this.getInnerRadius(), this.getOuterRadius()];
        this.radiusScale.range = newRange;
        if (resize) {
            this.previousRadiusScale.range = newRange;
        }
        this.nodeData = this.nodeData.map((_a) => {
            var { radius } = _a, d = __rest(_a, ["radius"]);
            return Object.assign(Object.assign({}, d), { radius, innerRadius: Math.max(this.radiusScale.convert(0), 0), outerRadius: Math.max(this.radiusScale.convert(radius), 0) });
        });
    }
    getTitleTranslationY() {
        var _a, _b;
        const outerRadius = Math.max(0, this.radiusScale.range[1]);
        if (outerRadius === 0) {
            return NaN;
        }
        const spacing = (_b = (_a = this.properties.title) === null || _a === void 0 ? void 0 : _a.spacing) !== null && _b !== void 0 ? _b : 0;
        const titleOffset = 2 + spacing;
        const dy = Math.max(0, -outerRadius);
        return -outerRadius - titleOffset - dy;
    }
    update({ seriesRect }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { title } = this.properties;
            const newNodeDataDependencies = {
                seriesRectWidth: seriesRect === null || seriesRect === void 0 ? void 0 : seriesRect.width,
                seriesRectHeight: seriesRect === null || seriesRect === void 0 ? void 0 : seriesRect.height,
            };
            const resize = jsonDiff(this.nodeDataDependencies, newNodeDataDependencies) != null;
            if (resize) {
                this._nodeDataDependencies = newNodeDataDependencies;
            }
            yield this.maybeRefreshNodeData();
            this.updateTitleNodes();
            this.updateRadiusScale(resize);
            this.contentGroup.translationX = this.centerX;
            this.contentGroup.translationY = this.centerY;
            this.highlightGroup.translationX = this.centerX;
            this.highlightGroup.translationY = this.centerY;
            this.backgroundGroup.translationX = this.centerX;
            this.backgroundGroup.translationY = this.centerY;
            if (this.labelGroup) {
                this.labelGroup.translationX = this.centerX;
                this.labelGroup.translationY = this.centerY;
            }
            if (title) {
                const dy = this.getTitleTranslationY();
                const titleBox = title.node.computeBBox();
                title.node.visible =
                    title.enabled && isFinite(dy) && !this.bboxIntersectsSurroundingSeries(titleBox, 0, dy);
                title.node.translationY = isFinite(dy) ? dy : 0;
            }
            this.updateNodeMidPoint();
            yield this.updateSelections();
            yield this.updateNodes(seriesRect);
        });
    }
    updateTitleNodes() {
        var _a, _b;
        const { oldTitle } = this;
        const { title } = this.properties;
        if (oldTitle !== title) {
            if (oldTitle) {
                (_a = this.labelGroup) === null || _a === void 0 ? void 0 : _a.removeChild(oldTitle.node);
            }
            if (title) {
                title.node.textBaseline = 'bottom';
                (_b = this.labelGroup) === null || _b === void 0 ? void 0 : _b.appendChild(title.node);
            }
            this.oldTitle = title;
        }
    }
    updateNodeMidPoint() {
        this.nodeData.forEach((d) => {
            const radius = d.innerRadius + (d.outerRadius - d.innerRadius) / 2;
            d.midPoint = {
                x: d.midCos * Math.max(0, radius),
                y: d.midSin * Math.max(0, radius),
            };
        });
    }
    updateSelections() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateGroupSelection();
            this.updateInnerCircleSelection();
        });
    }
    updateGroupSelection() {
        return __awaiter(this, void 0, void 0, function* () {
            const { itemSelection, highlightSelection, calloutLabelSelection, sectorLabelSelection, innerLabelsSelection } = this;
            const update = (selection, clone) => {
                let nodeData = this.nodeData;
                if (clone) {
                    // Allow mutable sectorFormat, so formatted sector styles can be updated and varied
                    // between normal and highlighted cases.
                    nodeData = nodeData.map((datum) => (Object.assign(Object.assign({}, datum), { sectorFormat: Object.assign({}, datum.sectorFormat) })));
                }
                selection.update(nodeData);
                if (this.ctx.animationManager.isSkipped()) {
                    selection.cleanup();
                }
            };
            update(itemSelection, false);
            update(highlightSelection, true);
            calloutLabelSelection.update(this.nodeData, (group) => {
                const line = new Line();
                line.tag = PieNodeTag.Callout;
                line.pointerEvents = PointerEvents.None;
                group.appendChild(line);
                const text = new Text();
                text.tag = PieNodeTag.Label;
                text.pointerEvents = PointerEvents.None;
                group.appendChild(text);
            });
            sectorLabelSelection.update(this.nodeData, (node) => {
                node.pointerEvents = PointerEvents.None;
            });
            innerLabelsSelection.update(this.properties.innerLabels, (node) => {
                node.pointerEvents = PointerEvents.None;
            });
        });
    }
    updateInnerCircleSelection() {
        const { innerCircle } = this.properties;
        let radius = 0;
        const innerRadius = this.getInnerRadius();
        if (innerRadius > 0) {
            const circleRadius = Math.min(innerRadius, this.getOuterRadius());
            const antiAliasingPadding = 1;
            radius = Math.ceil(circleRadius * 2 + antiAliasingPadding);
        }
        const datums = innerCircle ? [{ radius }] : [];
        this.innerCircleSelection.update(datums);
    }
    updateNodes(seriesRect) {
        return __awaiter(this, void 0, void 0, function* () {
            const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
            const isVisible = this.seriesItemEnabled.indexOf(true) >= 0;
            this.rootGroup.visible = isVisible;
            this.backgroundGroup.visible = isVisible;
            this.contentGroup.visible = isVisible;
            this.highlightGroup.visible = isVisible && (highlightedDatum === null || highlightedDatum === void 0 ? void 0 : highlightedDatum.series) === this;
            if (this.labelGroup) {
                this.labelGroup.visible = isVisible;
            }
            this.contentGroup.opacity = this.getOpacity();
            this.innerCircleSelection.each((node, { radius }) => {
                var _a, _b;
                node.setProperties({
                    fill: (_a = this.properties.innerCircle) === null || _a === void 0 ? void 0 : _a.fill,
                    opacity: (_b = this.properties.innerCircle) === null || _b === void 0 ? void 0 : _b.fillOpacity,
                    size: radius,
                });
            });
            const updateSectorFn = (sector, datum, _index, isDatumHighlighted) => {
                const format = this.getSectorFormat(datum.datum, datum.itemId, isDatumHighlighted);
                datum.sectorFormat.fill = format.fill;
                datum.sectorFormat.stroke = format.stroke;
                const animationDisabled = this.ctx.animationManager.isSkipped();
                if (animationDisabled) {
                    sector.startAngle = datum.startAngle;
                    sector.endAngle = datum.endAngle;
                    sector.innerRadius = datum.innerRadius;
                    sector.outerRadius = datum.outerRadius;
                }
                if (isDatumHighlighted || animationDisabled) {
                    sector.fill = format.fill;
                    sector.stroke = format.stroke;
                }
                sector.strokeWidth = format.strokeWidth;
                sector.fillOpacity = format.fillOpacity;
                sector.strokeOpacity = this.properties.strokeOpacity;
                sector.lineDash = this.properties.lineDash;
                sector.lineDashOffset = this.properties.lineDashOffset;
                sector.fillShadow = this.properties.shadow;
                // @todo(AG-10275) Remove sectorSpacing null case
                sector.inset =
                    this.properties.sectorSpacing != null
                        ? (this.properties.sectorSpacing + (format.stroke != null ? format.strokeWidth : 0)) / 2
                        : 0;
                // @todo(AG-10275) Remove this line completely
                sector.lineJoin = this.properties.sectorSpacing != null ? 'miter' : 'round';
            };
            this.itemSelection.each((node, datum, index) => updateSectorFn(node, datum, index, false));
            this.highlightSelection.each((node, datum, index) => {
                const isDatumHighlighted = (highlightedDatum === null || highlightedDatum === void 0 ? void 0 : highlightedDatum.series) === this && node.datum.itemId === highlightedDatum.itemId;
                updateSectorFn(node, datum, index, isDatumHighlighted);
                node.visible = isDatumHighlighted;
            });
            this.updateCalloutLineNodes();
            this.updateCalloutLabelNodes(seriesRect);
            this.updateSectorLabelNodes();
            this.updateInnerLabelNodes();
            this.updateZerosumRings();
            this.animationState.transition('update');
        });
    }
    updateCalloutLineNodes() {
        var _a;
        const { calloutLine } = this.properties;
        const calloutLength = calloutLine.length;
        const calloutStrokeWidth = calloutLine.strokeWidth;
        const calloutColors = (_a = calloutLine.colors) !== null && _a !== void 0 ? _a : this.properties.strokes;
        const { offset } = this.properties.calloutLabel;
        this.calloutLabelSelection.selectByTag(PieNodeTag.Callout).forEach((line, index) => {
            const datum = line.datum;
            const { calloutLabel: label, outerRadius } = datum;
            if ((label === null || label === void 0 ? void 0 : label.text) && !label.hidden && outerRadius !== 0) {
                line.visible = true;
                line.strokeWidth = calloutStrokeWidth;
                line.stroke = calloutColors[index % calloutColors.length];
                line.fill = undefined;
                const x1 = datum.midCos * outerRadius;
                const y1 = datum.midSin * outerRadius;
                let x2 = datum.midCos * (outerRadius + calloutLength);
                let y2 = datum.midSin * (outerRadius + calloutLength);
                const isMoved = label.collisionTextAlign || label.collisionOffsetY !== 0;
                if (isMoved && label.box != null) {
                    // Get the closest point to the text bounding box
                    const box = label.box;
                    let cx = x2;
                    let cy = y2;
                    if (x2 < box.x) {
                        cx = box.x;
                    }
                    else if (x2 > box.x + box.width) {
                        cx = box.x + box.width;
                    }
                    if (y2 < box.y) {
                        cy = box.y;
                    }
                    else if (y2 > box.y + box.height) {
                        cy = box.y + box.height;
                    }
                    // Apply label offset
                    const dx = cx - x2;
                    const dy = cy - y2;
                    const length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                    const paddedLength = length - offset;
                    if (paddedLength > 0) {
                        x2 = x2 + (dx * paddedLength) / length;
                        y2 = y2 + (dy * paddedLength) / length;
                    }
                }
                line.x1 = x1;
                line.y1 = y1;
                line.x2 = x2;
                line.y2 = y2;
            }
            else {
                line.visible = false;
            }
        });
    }
    getLabelOverflow(text, box, seriesRect) {
        const seriesLeft = seriesRect.x - this.centerX;
        const seriesRight = seriesRect.x + seriesRect.width - this.centerX;
        const seriesTop = seriesRect.y - this.centerY;
        const seriesBottom = seriesRect.y + seriesRect.height - this.centerY;
        const errPx = 1; // Prevents errors related to floating point calculations
        let visibleTextPart = 1;
        if (box.x + errPx < seriesLeft) {
            visibleTextPart = (box.x + box.width - seriesLeft) / box.width;
        }
        else if (box.x + box.width - errPx > seriesRight) {
            visibleTextPart = (seriesRight - box.x) / box.width;
        }
        const hasVerticalOverflow = box.y + errPx < seriesTop || box.y + box.height - errPx > seriesBottom;
        const textLength = visibleTextPart === 1 ? text.length : Math.floor(text.length * visibleTextPart) - 1;
        const hasSurroundingSeriesOverflow = this.bboxIntersectsSurroundingSeries(box);
        return { textLength, hasVerticalOverflow, hasSurroundingSeriesOverflow };
    }
    bboxIntersectsSurroundingSeries(box, dx = 0, dy = 0) {
        const { surroundingRadius } = this;
        if (surroundingRadius == null) {
            return false;
        }
        const corners = [
            { x: box.x + dx, y: box.y + dy },
            { x: box.x + box.width + dx, y: box.y + dy },
            { x: box.x + box.width + dx, y: box.y + box.height + dy },
            { x: box.x + dx, y: box.y + box.height + dy },
        ];
        const sur2 = Math.pow(surroundingRadius, 2);
        return corners.some((corner) => Math.pow(corner.x, 2) + Math.pow(corner.y, 2) > sur2);
    }
    computeCalloutLabelCollisionOffsets() {
        const { radiusScale } = this;
        const { calloutLabel, calloutLine } = this.properties;
        const { offset, minSpacing } = calloutLabel;
        const innerRadius = radiusScale.convert(0);
        const shouldSkip = (datum) => {
            const label = datum.calloutLabel;
            return !label || datum.outerRadius === 0;
        };
        const fullData = this.nodeData;
        const data = this.nodeData.filter((t) => !shouldSkip(t));
        data.forEach((datum) => {
            const label = datum.calloutLabel;
            if (label == null)
                return;
            label.hidden = false;
            label.collisionTextAlign = undefined;
            label.collisionOffsetY = 0;
        });
        if (data.length <= 1) {
            return;
        }
        const leftLabels = data.filter((d) => d.midCos < 0).sort((a, b) => a.midSin - b.midSin);
        const rightLabels = data.filter((d) => d.midCos >= 0).sort((a, b) => a.midSin - b.midSin);
        const topLabels = data
            .filter((d) => { var _a; return d.midSin < 0 && ((_a = d.calloutLabel) === null || _a === void 0 ? void 0 : _a.textAlign) === 'center'; })
            .sort((a, b) => a.midCos - b.midCos);
        const bottomLabels = data
            .filter((d) => { var _a; return d.midSin >= 0 && ((_a = d.calloutLabel) === null || _a === void 0 ? void 0 : _a.textAlign) === 'center'; })
            .sort((a, b) => a.midCos - b.midCos);
        const tempTextNode = new Text();
        const getTextBBox = (datum) => {
            var _a;
            const label = datum.calloutLabel;
            if (label == null)
                return new BBox(0, 0, 0, 0);
            const labelRadius = datum.outerRadius + calloutLine.length + offset;
            const x = datum.midCos * labelRadius;
            const y = datum.midSin * labelRadius + label.collisionOffsetY;
            tempTextNode.text = label.text;
            tempTextNode.x = x;
            tempTextNode.y = y;
            tempTextNode.setFont(this.properties.calloutLabel);
            tempTextNode.setAlign({
                textAlign: (_a = label.collisionTextAlign) !== null && _a !== void 0 ? _a : label.textAlign,
                textBaseline: label.textBaseline,
            });
            return tempTextNode.computeBBox();
        };
        const avoidNeighbourYCollision = (label, next, direction) => {
            const box = getTextBBox(label).grow(minSpacing / 2);
            const other = getTextBBox(next).grow(minSpacing / 2);
            // The full collision is not detected, because sometimes
            // the next label can appear behind the label with offset
            const collidesOrBehind = box.x < other.x + other.width &&
                box.x + box.width > other.x &&
                (direction === 'to-top' ? box.y < other.y + other.height : box.y + box.height > other.y);
            if (collidesOrBehind) {
                const dy = direction === 'to-top' ? box.y - other.y - other.height : box.y + box.height - other.y;
                next.calloutLabel.collisionOffsetY = dy;
            }
        };
        const avoidYCollisions = (labels) => {
            const midLabel = labels.slice().sort((a, b) => Math.abs(a.midSin) - Math.abs(b.midSin))[0];
            const midIndex = labels.indexOf(midLabel);
            for (let i = midIndex - 1; i >= 0; i--) {
                const prev = labels[i + 1];
                const next = labels[i];
                avoidNeighbourYCollision(prev, next, 'to-top');
            }
            for (let i = midIndex + 1; i < labels.length; i++) {
                const prev = labels[i - 1];
                const next = labels[i];
                avoidNeighbourYCollision(prev, next, 'to-bottom');
            }
        };
        const avoidXCollisions = (labels) => {
            const labelsCollideLabelsByY = data.some((datum) => datum.calloutLabel.collisionOffsetY !== 0);
            const boxes = labels.map((label) => getTextBBox(label));
            const paddedBoxes = boxes.map((box) => box.clone().grow(minSpacing / 2));
            let labelsCollideLabelsByX = false;
            for (let i = 0; i < paddedBoxes.length && !labelsCollideLabelsByX; i++) {
                const box = paddedBoxes[i];
                for (let j = i + 1; j < labels.length; j++) {
                    const other = paddedBoxes[j];
                    if (box.collidesBBox(other)) {
                        labelsCollideLabelsByX = true;
                        break;
                    }
                }
            }
            const sectors = fullData.map((datum) => {
                const { startAngle, endAngle, outerRadius } = datum;
                return { startAngle, endAngle, innerRadius, outerRadius };
            });
            const labelsCollideSectors = boxes.some((box) => {
                return sectors.some((sector) => boxCollidesSector(box, sector));
            });
            if (!labelsCollideLabelsByX && !labelsCollideLabelsByY && !labelsCollideSectors) {
                return;
            }
            labels
                .filter((d) => d.calloutLabel.textAlign === 'center')
                .forEach((d) => {
                const label = d.calloutLabel;
                if (d.midCos < 0) {
                    label.collisionTextAlign = 'right';
                }
                else if (d.midCos > 0) {
                    label.collisionTextAlign = 'left';
                }
                else {
                    label.collisionTextAlign = 'center';
                }
            });
        };
        avoidYCollisions(leftLabels);
        avoidYCollisions(rightLabels);
        avoidXCollisions(topLabels);
        avoidXCollisions(bottomLabels);
    }
    updateCalloutLabelNodes(seriesRect) {
        const { radiusScale } = this;
        const { calloutLabel, calloutLine } = this.properties;
        const calloutLength = calloutLine.length;
        const { offset, color } = calloutLabel;
        const tempTextNode = new Text();
        this.calloutLabelSelection.selectByTag(PieNodeTag.Label).forEach((text) => {
            var _a;
            const { datum } = text;
            const label = datum.calloutLabel;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);
            if (!(label === null || label === void 0 ? void 0 : label.text) || outerRadius === 0 || label.hidden) {
                text.visible = false;
                return;
            }
            const labelRadius = outerRadius + calloutLength + offset;
            const x = datum.midCos * labelRadius;
            const y = datum.midSin * labelRadius + label.collisionOffsetY;
            // Detect text overflow
            const align = {
                textAlign: (_a = label.collisionTextAlign) !== null && _a !== void 0 ? _a : label.textAlign,
                textBaseline: label.textBaseline,
            };
            tempTextNode.text = label.text;
            tempTextNode.x = x;
            tempTextNode.y = y;
            tempTextNode.setFont(this.properties.calloutLabel);
            tempTextNode.setAlign(align);
            const box = tempTextNode.computeBBox();
            let displayText = label.text;
            let visible = true;
            if (calloutLabel.avoidCollisions) {
                const { textLength, hasVerticalOverflow } = this.getLabelOverflow(label.text, box, seriesRect);
                displayText = label.text.length === textLength ? label.text : `${label.text.substring(0, textLength)}…`;
                visible = !hasVerticalOverflow;
            }
            text.text = displayText;
            text.x = x;
            text.y = y;
            text.setFont(this.properties.calloutLabel);
            text.setAlign(align);
            text.fill = color;
            text.visible = visible;
        });
    }
    computeLabelsBBox(options, seriesRect) {
        return __awaiter(this, void 0, void 0, function* () {
            const { calloutLabel, calloutLine } = this.properties;
            const calloutLength = calloutLine.length;
            const { offset, maxCollisionOffset, minSpacing } = calloutLabel;
            if (!calloutLabel.avoidCollisions) {
                return null;
            }
            yield this.maybeRefreshNodeData();
            this.updateRadiusScale(false);
            this.computeCalloutLabelCollisionOffsets();
            const textBoxes = [];
            const text = new Text();
            let titleBox;
            const { title } = this.properties;
            if ((title === null || title === void 0 ? void 0 : title.text) && title.enabled) {
                const dy = this.getTitleTranslationY();
                if (isFinite(dy)) {
                    text.text = title.text;
                    text.x = 0;
                    text.y = dy;
                    text.setFont(title);
                    text.setAlign({
                        textBaseline: 'bottom',
                        textAlign: 'center',
                    });
                    titleBox = text.computeBBox();
                    textBoxes.push(titleBox);
                }
            }
            this.nodeData.forEach((datum) => {
                var _a;
                const label = datum.calloutLabel;
                if (!label || datum.outerRadius === 0) {
                    return null;
                }
                const labelRadius = datum.outerRadius + calloutLength + offset;
                const x = datum.midCos * labelRadius;
                const y = datum.midSin * labelRadius + label.collisionOffsetY;
                text.text = label.text;
                text.x = x;
                text.y = y;
                text.setFont(this.properties.calloutLabel);
                text.setAlign({
                    textAlign: (_a = label.collisionTextAlign) !== null && _a !== void 0 ? _a : label.textAlign,
                    textBaseline: label.textBaseline,
                });
                const box = text.computeBBox();
                label.box = box;
                // Hide labels that where pushed too far by the collision avoidance algorithm
                if (Math.abs(label.collisionOffsetY) > maxCollisionOffset) {
                    label.hidden = true;
                    return;
                }
                // Hide labels intersecting or above the title
                if (titleBox) {
                    const seriesTop = seriesRect.y - this.centerY;
                    const titleCleanArea = new BBox(titleBox.x - minSpacing, seriesTop, titleBox.width + 2 * minSpacing, titleBox.y + titleBox.height + minSpacing - seriesTop);
                    if (box.collidesBBox(titleCleanArea)) {
                        label.hidden = true;
                        return;
                    }
                }
                if (options.hideWhenNecessary) {
                    const { textLength, hasVerticalOverflow, hasSurroundingSeriesOverflow } = this.getLabelOverflow(label.text, box, seriesRect);
                    const isTooShort = label.text.length > 2 && textLength < 2;
                    if (hasVerticalOverflow || isTooShort || hasSurroundingSeriesOverflow) {
                        label.hidden = true;
                        return;
                    }
                }
                label.hidden = false;
                textBoxes.push(box);
            });
            if (textBoxes.length === 0) {
                return null;
            }
            return BBox.merge(textBoxes);
        });
    }
    updateSectorLabelNodes() {
        const { radiusScale } = this;
        const innerRadius = radiusScale.convert(0);
        const { fontSize, fontStyle, fontWeight, fontFamily, positionOffset, positionRatio, color } = this.properties.sectorLabel;
        const isDoughnut = innerRadius > 0;
        const singleVisibleSector = this.seriesItemEnabled.filter(Boolean).length === 1;
        this.sectorLabelSelection.each((text, datum) => {
            const { sectorLabel, outerRadius } = datum;
            let isTextVisible = false;
            if (sectorLabel && outerRadius !== 0) {
                const labelRadius = innerRadius * (1 - positionRatio) + outerRadius * positionRatio + positionOffset;
                text.fill = color;
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.text = sectorLabel.text;
                const shouldPutTextInCenter = !isDoughnut && singleVisibleSector;
                if (shouldPutTextInCenter) {
                    text.x = 0;
                    text.y = 0;
                }
                else {
                    text.x = datum.midCos * labelRadius;
                    text.y = datum.midSin * labelRadius;
                }
                text.textAlign = 'center';
                text.textBaseline = 'middle';
                const bbox = text.computeBBox();
                const corners = [
                    [bbox.x, bbox.y],
                    [bbox.x + bbox.width, bbox.y],
                    [bbox.x + bbox.width, bbox.y + bbox.height],
                    [bbox.x, bbox.y + bbox.height],
                ];
                const { startAngle, endAngle } = datum;
                const sectorBounds = { startAngle, endAngle, innerRadius, outerRadius };
                if (corners.every(([x, y]) => isPointInSector(x, y, sectorBounds))) {
                    isTextVisible = true;
                }
            }
            text.visible = isTextVisible;
        });
    }
    updateInnerLabelNodes() {
        const textBBoxes = [];
        const margins = [];
        this.innerLabelsSelection.each((text, datum) => {
            const { fontStyle, fontWeight, fontSize, fontFamily, color } = datum;
            text.fontStyle = fontStyle;
            text.fontWeight = fontWeight;
            text.fontSize = fontSize;
            text.fontFamily = fontFamily;
            text.text = datum.text;
            text.x = 0;
            text.y = 0;
            text.fill = color;
            text.textAlign = 'center';
            text.textBaseline = 'alphabetic';
            textBBoxes.push(text.computeBBox());
            margins.push(datum.margin);
        });
        const getMarginTop = (index) => (index === 0 ? 0 : margins[index]);
        const getMarginBottom = (index) => (index === margins.length - 1 ? 0 : margins[index]);
        const totalHeight = textBBoxes.reduce((sum, bbox, i) => {
            return sum + bbox.height + getMarginTop(i) + getMarginBottom(i);
        }, 0);
        const totalWidth = Math.max(...textBBoxes.map((bbox) => bbox.width));
        const innerRadius = this.getInnerRadius();
        const labelRadius = Math.sqrt(Math.pow(totalWidth / 2, 2) + Math.pow(totalHeight / 2, 2));
        const labelsVisible = labelRadius <= (innerRadius > 0 ? innerRadius : this.getOuterRadius());
        const textBottoms = [];
        for (let i = 0, prev = -totalHeight / 2; i < textBBoxes.length; i++) {
            const bbox = textBBoxes[i];
            const bottom = bbox.height + prev + getMarginTop(i);
            textBottoms.push(bottom);
            prev = bottom + getMarginBottom(i);
        }
        this.innerLabelsSelection.each((text, _datum, index) => {
            text.y = textBottoms[index];
            text.visible = labelsVisible;
        });
    }
    updateZerosumRings() {
        // The Circle `size` is the diameter
        this.zerosumOuterRing.size = this.getOuterRadius() * 2;
        this.zerosumInnerRing.size = this.getInnerRadius() * 2;
    }
    getDatumLegendName(nodeDatum) {
        const { angleKey, calloutLabelKey, sectorLabelKey, legendItemKey } = this.properties;
        const { sectorLabel, calloutLabel, legendItem } = nodeDatum;
        if (legendItemKey && legendItem !== undefined) {
            return legendItem.text;
        }
        else if (calloutLabelKey && calloutLabelKey !== angleKey && (calloutLabel === null || calloutLabel === void 0 ? void 0 : calloutLabel.text) !== undefined) {
            return calloutLabel.text;
        }
        else if (sectorLabelKey && sectorLabelKey !== angleKey && (sectorLabel === null || sectorLabel === void 0 ? void 0 : sectorLabel.text) !== undefined) {
            return sectorLabel.text;
        }
    }
    getTooltipHtml(nodeDatum) {
        var _a;
        if (!this.properties.isValid()) {
            return '';
        }
        const { datum, angleValue, sectorFormat: { fill: color }, } = nodeDatum;
        const title = sanitizeHtml((_a = this.properties.title) === null || _a === void 0 ? void 0 : _a.text);
        const content = isNumber(angleValue) ? toFixed(angleValue) : String(angleValue);
        const labelText = this.getDatumLegendName(nodeDatum);
        return this.properties.tooltip.toTooltipHtml({
            title: title !== null && title !== void 0 ? title : labelText,
            content: title && labelText ? `${labelText}: ${content}` : content,
            backgroundColor: color,
        }, {
            datum,
            title,
            color,
            seriesId: this.id,
            angleKey: this.properties.angleKey,
            angleName: this.properties.angleName,
            radiusKey: this.properties.radiusKey,
            radiusName: this.properties.radiusName,
            calloutLabelKey: this.properties.calloutLabelKey,
            calloutLabelName: this.properties.calloutLabelName,
            sectorLabelKey: this.properties.sectorLabelKey,
            sectorLabelName: this.properties.sectorLabelName,
        });
    }
    getLegendData(legendType) {
        var _a, _b, _c, _d, _e;
        const { processedData, dataModel } = this;
        if (!dataModel || !(processedData === null || processedData === void 0 ? void 0 : processedData.data.length) || legendType !== 'category') {
            return [];
        }
        const { angleKey, calloutLabelKey, sectorLabelKey, legendItemKey } = this.properties;
        if (!legendItemKey &&
            (!calloutLabelKey || calloutLabelKey === angleKey) &&
            (!sectorLabelKey || sectorLabelKey === angleKey))
            return [];
        const { calloutLabelIdx, sectorLabelIdx, legendItemIdx } = this.getProcessedDataIndexes(dataModel);
        const titleText = ((_a = this.properties.title) === null || _a === void 0 ? void 0 : _a.showInLegend) && this.properties.title.text;
        const legendData = [];
        for (let index = 0; index < processedData.data.length; index++) {
            const { datum, values } = processedData.data[index];
            const labelParts = [];
            if (titleText) {
                labelParts.push(titleText);
            }
            const labels = this.getLabels(datum, 2 * Math.PI, 2 * Math.PI, false, values[calloutLabelIdx], values[sectorLabelIdx], values[legendItemIdx]);
            if (legendItemKey && labels.legendItem !== undefined) {
                labelParts.push(labels.legendItem.text);
            }
            else if (calloutLabelKey && calloutLabelKey !== angleKey && ((_b = labels.calloutLabel) === null || _b === void 0 ? void 0 : _b.text) !== undefined) {
                labelParts.push((_c = labels.calloutLabel) === null || _c === void 0 ? void 0 : _c.text);
            }
            else if (sectorLabelKey && sectorLabelKey !== angleKey && ((_d = labels.sectorLabel) === null || _d === void 0 ? void 0 : _d.text) !== undefined) {
                labelParts.push((_e = labels.sectorLabel) === null || _e === void 0 ? void 0 : _e.text);
            }
            if (labelParts.length === 0)
                continue;
            const sectorFormat = this.getSectorFormat(datum, index, false);
            legendData.push({
                legendType: 'category',
                id: this.id,
                itemId: index,
                seriesId: this.id,
                enabled: this.seriesItemEnabled[index],
                label: {
                    text: labelParts.join(' - '),
                },
                marker: {
                    fill: sectorFormat.fill,
                    stroke: sectorFormat.stroke,
                    fillOpacity: this.properties.fillOpacity,
                    strokeOpacity: this.properties.strokeOpacity,
                    strokeWidth: this.properties.strokeWidth,
                },
            });
        }
        return legendData;
    }
    onLegendItemClick(event) {
        const { enabled, itemId, series } = event;
        if (series.id === this.id) {
            this.toggleSeriesItem(itemId, enabled);
        }
        else if (series.type === 'pie') {
            this.toggleOtherSeriesItems(series, itemId, enabled);
        }
    }
    toggleSeriesItem(itemId, enabled) {
        this.seriesItemEnabled[itemId] = enabled;
        this.nodeDataRefresh = true;
    }
    toggleOtherSeriesItems(series, itemId, enabled) {
        var _a, _b;
        if (!this.properties.legendItemKey || !this.dataModel) {
            return;
        }
        const datumToggledLegendItemValue = series.properties.legendItemKey &&
            ((_a = series.data) === null || _a === void 0 ? void 0 : _a.find((_, index) => index === itemId)[series.properties.legendItemKey]);
        if (!datumToggledLegendItemValue) {
            return;
        }
        const legendItemIdx = this.dataModel.resolveProcessedDataIndexById(this, `legendItemValue`).index;
        (_b = this.processedData) === null || _b === void 0 ? void 0 : _b.data.forEach(({ values }, datumItemId) => {
            if (values[legendItemIdx] === datumToggledLegendItemValue) {
                this.toggleSeriesItem(datumItemId, enabled);
            }
        });
    }
    animateEmptyUpdateReady(_data) {
        const { animationManager } = this.ctx;
        const fns = preparePieSeriesAnimationFunctions(true, this.properties.rotation, this.radiusScale, this.previousRadiusScale);
        fromToMotion(this.id, 'nodes', animationManager, [this.itemSelection, this.highlightSelection], fns.nodes);
        fromToMotion(this.id, `innerCircle`, animationManager, [this.innerCircleSelection], fns.innerCircle);
        seriesLabelFadeInAnimation(this, 'callout', animationManager, [this.calloutLabelSelection]);
        seriesLabelFadeInAnimation(this, 'sector', animationManager, [this.sectorLabelSelection]);
        seriesLabelFadeInAnimation(this, 'inner', animationManager, [this.innerLabelsSelection]);
        this.previousRadiusScale.range = this.radiusScale.range;
    }
    animateWaitingUpdateReady() {
        var _a, _b, _c, _d, _e, _f;
        const { itemSelection, highlightSelection, processedData, radiusScale, previousRadiusScale } = this;
        const { animationManager } = this.ctx;
        const diff = (_a = processedData === null || processedData === void 0 ? void 0 : processedData.reduced) === null || _a === void 0 ? void 0 : _a.diff;
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
        const supportedDiff = ((_b = diff === null || diff === void 0 ? void 0 : diff.moved.length) !== null && _b !== void 0 ? _b : 0) === 0 && (diff === null || diff === void 0 ? void 0 : diff.addedIndices.every((i) => !diff.removedIndices.includes(i)));
        const hasKeys = ((_c = processedData === null || processedData === void 0 ? void 0 : processedData.defs.keys.length) !== null && _c !== void 0 ? _c : 0) > 0;
        const hasUniqueKeys = (_f = (_e = (_d = processedData === null || processedData === void 0 ? void 0 : processedData.reduced) === null || _d === void 0 ? void 0 : _d.animationValidation) === null || _e === void 0 ? void 0 : _e.uniqueKeys) !== null && _f !== void 0 ? _f : true;
        if (!supportedDiff || !hasKeys || !hasUniqueKeys) {
            this.ctx.animationManager.skipCurrentBatch();
        }
        const fns = preparePieSeriesAnimationFunctions(false, this.properties.rotation, radiusScale, previousRadiusScale);
        fromToMotion(this.id, 'nodes', animationManager, [itemSelection, highlightSelection], fns.nodes, (_, datum) => this.getDatumId(datum), diff);
        fromToMotion(this.id, `innerCircle`, animationManager, [this.innerCircleSelection], fns.innerCircle);
        seriesLabelFadeInAnimation(this, 'callout', this.ctx.animationManager, [this.calloutLabelSelection]);
        seriesLabelFadeInAnimation(this, 'sector', this.ctx.animationManager, [this.sectorLabelSelection]);
        seriesLabelFadeInAnimation(this, 'inner', this.ctx.animationManager, [this.innerLabelsSelection]);
        this.previousRadiusScale.range = this.radiusScale.range;
    }
    animateClearingUpdateEmpty() {
        const { itemSelection, highlightSelection, radiusScale, previousRadiusScale } = this;
        const { animationManager } = this.ctx;
        const fns = preparePieSeriesAnimationFunctions(false, this.properties.rotation, radiusScale, previousRadiusScale);
        fromToMotion(this.id, 'nodes', animationManager, [itemSelection, highlightSelection], fns.nodes);
        fromToMotion(this.id, `innerCircle`, animationManager, [this.innerCircleSelection], fns.innerCircle);
        seriesLabelFadeOutAnimation(this, 'callout', this.ctx.animationManager, [this.calloutLabelSelection]);
        seriesLabelFadeOutAnimation(this, 'sector', this.ctx.animationManager, [this.sectorLabelSelection]);
        seriesLabelFadeOutAnimation(this, 'inner', this.ctx.animationManager, [this.innerLabelsSelection]);
        this.previousRadiusScale.range = this.radiusScale.range;
    }
    getDatumIdFromData(datum) {
        var _a, _b, _c;
        const { calloutLabelKey, sectorLabelKey, legendItemKey } = this.properties;
        if (!((_c = (_b = (_a = this.processedData) === null || _a === void 0 ? void 0 : _a.reduced) === null || _b === void 0 ? void 0 : _b.animationValidation) === null || _c === void 0 ? void 0 : _c.uniqueKeys)) {
            return;
        }
        if (legendItemKey) {
            return datum[legendItemKey];
        }
        else if (calloutLabelKey) {
            return datum[calloutLabelKey];
        }
        else if (sectorLabelKey) {
            return datum[sectorLabelKey];
        }
    }
    getDatumId(datum) {
        var _a;
        const { index } = datum;
        return (_a = this.getDatumIdFromData(datum.datum)) !== null && _a !== void 0 ? _a : `${index}`;
    }
    onDataChange() {
        this.processSeriesItemEnabled();
    }
}
PieSeries.className = 'PieSeries';
PieSeries.type = 'pie';
//# sourceMappingURL=pieSeries.js.map