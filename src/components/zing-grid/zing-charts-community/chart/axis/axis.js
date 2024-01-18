var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
import { ModuleMap } from '../../module/moduleMap';
import { fromToMotion } from '../../motion/fromToMotion';
import { resetMotion } from '../../motion/resetMotion';
import { StateMachine } from '../../motion/states';
import { ContinuousScale } from '../../scale/continuousScale';
import { LogScale } from '../../scale/logScale';
import { TimeScale } from '../../scale/timeScale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { Matrix } from '../../scene/matrix';
import { Selection } from '../../scene/selection';
import { Line } from '../../scene/shape/line';
import { Text, measureText, splitText } from '../../scene/shape/text';
import { jsonDiff } from '../../sparklines-util';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { areArrayNumbersEqual } from '../../util/equal';
import { createId } from '../../util/id';
import { axisLabelsOverlap } from '../../util/labelPlacement';
import { Logger } from '../../util/logger';
import { clamp, round } from '../../util/number';
import { BOOLEAN, STRING_ARRAY, Validate, predicateWithMessage } from '../../util/validation';
import { Caption } from '../caption';
import { ChartAxisDirection } from '../chartAxisDirection';
import { CartesianCrossLine } from '../crossline/cartesianCrossLine';
import { calculateLabelBBox, calculateLabelRotation, getLabelSpacing, getTextAlign, getTextBaseline } from '../label';
import { Layers } from '../layers';
import { AxisGridLine } from './axisGridLine';
import { AxisLabel } from './axisLabel';
import { AxisLine } from './axisLine';
import { AxisTick } from './axisTick';
import { prepareAxisAnimationContext, prepareAxisAnimationFunctions, resetAxisGroupFn, resetAxisLabelSelectionFn, resetAxisLineSelectionFn, resetAxisSelectionFn, } from './axisUtil';
export var Tags;
(function (Tags) {
    Tags[Tags["TickLine"] = 0] = "TickLine";
    Tags[Tags["TickLabel"] = 1] = "TickLabel";
    Tags[Tags["GridLine"] = 2] = "GridLine";
    Tags[Tags["GridArc"] = 3] = "GridArc";
    Tags[Tags["AxisLine"] = 4] = "AxisLine";
})(Tags || (Tags = {}));
var TickGenerationType;
(function (TickGenerationType) {
    TickGenerationType[TickGenerationType["CREATE"] = 0] = "CREATE";
    TickGenerationType[TickGenerationType["CREATE_SECONDARY"] = 1] = "CREATE_SECONDARY";
    TickGenerationType[TickGenerationType["FILTER"] = 2] = "FILTER";
    TickGenerationType[TickGenerationType["VALUES"] = 3] = "VALUES";
})(TickGenerationType || (TickGenerationType = {}));
/**
 * A general purpose linear axis with no notion of orientation.
 * The axis is always rendered vertically, with horizontal labels positioned to the left
 * of the axis line by default. The axis can be {@link rotation | rotated} by an arbitrary angle,
 * so that it can be used as a top, right, bottom, left, radial or any other kind
 * of linear axis.
 * The generic `D` parameter is the type of the domain of the axis' scale.
 * The output range of the axis' scale is always numeric (screen coordinates).
 */
export class Axis {
    get type() {
        var _a;
        return (_a = this.constructor.type) !== null && _a !== void 0 ? _a : '';
    }
    set crossLines(value) {
        var _a, _b;
        (_a = this._crossLines) === null || _a === void 0 ? void 0 : _a.forEach((crossLine) => this.detachCrossLine(crossLine));
        if (value) {
            this.assignCrossLineArrayConstructor(value);
        }
        this._crossLines = value;
        (_b = this._crossLines) === null || _b === void 0 ? void 0 : _b.forEach((crossLine) => {
            this.attachCrossLine(crossLine);
            this.initCrossLine(crossLine);
        });
    }
    get crossLines() {
        return this._crossLines;
    }
    constructor(moduleCtx, scale) {
        this.moduleCtx = moduleCtx;
        this.scale = scale;
        this.id = createId(this);
        this.nice = true;
        /** Reverse the axis scale domain if `true`. */
        this.reverse = undefined;
        this.dataDomain = { domain: [], clipped: false };
        this.keys = [];
        this.boundSeries = [];
        this.includeInvisibleDomains = false;
        this.axisGroup = new Group({ name: `${this.id}-axis`, zIndex: Layers.AXIS_ZINDEX });
        this.lineNode = this.axisGroup.appendChild(new Line());
        this.tickLineGroup = this.axisGroup.appendChild(new Group({ name: `${this.id}-Axis-tick-lines`, zIndex: Layers.AXIS_ZINDEX }));
        this.tickLabelGroup = this.axisGroup.appendChild(new Group({ name: `${this.id}-Axis-tick-labels`, zIndex: Layers.AXIS_ZINDEX }));
        this.crossLineGroup = new Group({ name: `${this.id}-CrossLines` });
        this.gridGroup = new Group({ name: `${this.id}-Axis-grid` });
        this.gridLineGroup = this.gridGroup.appendChild(new Group({
            name: `${this.id}-gridLines`,
            zIndex: Layers.AXIS_GRID_ZINDEX,
        }));
        this.tickLineGroupSelection = Selection.select(this.tickLineGroup, Line, false);
        this.tickLabelGroupSelection = Selection.select(this.tickLabelGroup, Text, false);
        this.gridLineGroupSelection = Selection.select(this.gridLineGroup, Line, false);
        this.line = new AxisLine();
        this.tick = this.createTick();
        this.gridLine = new AxisGridLine();
        this.label = this.createLabel();
        this.defaultTickMinSpacing = Axis.defaultTickMinSpacing;
        this.translation = { x: 0, y: 0 };
        this.rotation = 0; // axis rotation angle in degrees
        this.layout = {
            label: {
                fractionDigits: 0,
                padding: this.label.padding,
                format: this.label.format,
            },
        };
        this.destroyFns = [];
        this.range = [0, 1];
        this.visibleRange = [0, 1];
        this.title = undefined;
        this._titleCaption = new Caption();
        /**
         * The length of the grid. The grid is only visible in case of a non-zero value.
         * In case {@link radialGrid} is `true`, the value is interpreted as an angle
         * (in degrees).
         */
        this._gridLength = 0;
        this.fractionDigits = 0;
        /**
         * The distance between the grid ticks and the axis ticks.
         */
        this.gridPadding = 0;
        /**
         * Is used to avoid collisions between axis labels and series.
         */
        this.seriesAreaPadding = 0;
        this.tickGenerationResult = undefined;
        this.maxThickness = Infinity;
        this.moduleMap = new ModuleMap();
        this.refreshScale();
        this._titleCaption.registerInteraction(this.moduleCtx);
        this._titleCaption.node.rotation = -Math.PI / 2;
        this.axisGroup.appendChild(this._titleCaption.node);
        this.destroyFns.push(moduleCtx.interactionManager.addListener('hover', (e) => this.checkAxisHover(e)));
        this.animationManager = moduleCtx.animationManager;
        this.animationState = new StateMachine('empty', {
            empty: {
                update: {
                    target: 'ready',
                    action: () => this.resetSelectionNodes(),
                },
            },
            ready: {
                update: (data) => this.animateReadyUpdate(data),
                resize: () => this.resetSelectionNodes(),
            },
        });
        this._crossLines = [];
        this.assignCrossLineArrayConstructor(this._crossLines);
        let previousSize = undefined;
        this.destroyFns.push(moduleCtx.layoutService.addListener('layout-complete', (e) => {
            // Fire resize animation action if chart canvas size changes.
            if (previousSize != null && jsonDiff(e.chart, previousSize) != null) {
                this.animationState.transition('resize');
            }
            previousSize = Object.assign({}, e.chart);
        }));
        this.destroyFns.push(moduleCtx.updateService.addListener('update-complete', (e) => {
            this.minRect = e.minRect;
        }));
    }
    attachCrossLine(crossLine) {
        this.crossLineGroup.appendChild(crossLine.group);
        this.crossLineGroup.appendChild(crossLine.labelGroup);
    }
    detachCrossLine(crossLine) {
        this.crossLineGroup.removeChild(crossLine.group);
        this.crossLineGroup.removeChild(crossLine.labelGroup);
    }
    destroy() {
        this.moduleMap.destroy();
        this.destroyFns.forEach((f) => f());
    }
    refreshScale() {
        var _a;
        this.range = this.scale.range.slice();
        (_a = this.crossLines) === null || _a === void 0 ? void 0 : _a.forEach((crossLine) => {
            this.initCrossLine(crossLine);
        });
    }
    updateRange() {
        var _a;
        const { range: rr, visibleRange: vr, scale } = this;
        const span = (rr[1] - rr[0]) / (vr[1] - vr[0]);
        const shift = span * vr[0];
        const start = rr[0] - shift;
        scale.range = [start, start + span];
        (_a = this.crossLines) === null || _a === void 0 ? void 0 : _a.forEach((crossLine) => {
            crossLine.clippedRange = [rr[0], rr[1]];
        });
    }
    setCrossLinesVisible(visible) {
        this.crossLineGroup.visible = visible;
    }
    attachAxis(axisNode, gridNode) {
        gridNode.appendChild(this.gridGroup);
        axisNode.appendChild(this.axisGroup);
        axisNode.appendChild(this.crossLineGroup);
    }
    detachAxis(axisNode, gridNode) {
        gridNode.removeChild(this.gridGroup);
        axisNode.removeChild(this.axisGroup);
        axisNode.removeChild(this.crossLineGroup);
    }
    /**
     * Checks if a point or an object is in range.
     * @param x A point (or object's starting point).
     * @param width Object's width.
     * @param tolerance Expands the range on both ends by this amount.
     */
    inRange(x, width = 0, tolerance = 0) {
        const min = Math.min(...this.range);
        const max = Math.max(...this.range);
        return x + width >= min - tolerance && x <= max + tolerance;
    }
    onLabelFormatChange(ticks, format) {
        const { scale, fractionDigits } = this;
        const logScale = scale instanceof LogScale;
        const defaultLabelFormatter = !logScale && fractionDigits > 0
            ? (x) => (typeof x === 'number' ? x.toFixed(fractionDigits) : String(x))
            : (x) => String(x);
        if (format && scale && scale.tickFormat) {
            try {
                this.labelFormatter = scale.tickFormat({ ticks, specifier: format });
            }
            catch (e) {
                this.labelFormatter = defaultLabelFormatter;
                Logger.warnOnce(`the axis label format string ${format} is invalid. No formatting will be applied`);
            }
        }
        else {
            this.labelFormatter = defaultLabelFormatter;
        }
    }
    setDomain() {
        const { scale, dataDomain: { domain }, } = this;
        scale.domain = domain;
    }
    setTickInterval(interval) {
        var _a;
        this.scale.interval = (_a = this.tick.interval) !== null && _a !== void 0 ? _a : interval;
    }
    setTickCount(count, minTickCount, maxTickCount) {
        const { scale } = this;
        if (!(count && ContinuousScale.is(scale))) {
            return;
        }
        if (typeof count === 'number') {
            scale.tickCount = count;
            scale.minTickCount = minTickCount !== null && minTickCount !== void 0 ? minTickCount : 0;
            scale.maxTickCount = maxTickCount !== null && maxTickCount !== void 0 ? maxTickCount : Infinity;
            return;
        }
        if (scale instanceof TimeScale) {
            this.setTickInterval(count);
        }
    }
    set gridLength(value) {
        var _a;
        // Was visible and now invisible, or was invisible and now visible.
        if ((this._gridLength && !value) || (!this._gridLength && value)) {
            this.gridLineGroupSelection.clear();
        }
        this._gridLength = value;
        (_a = this.crossLines) === null || _a === void 0 ? void 0 : _a.forEach((crossLine) => {
            this.initCrossLine(crossLine);
        });
    }
    get gridLength() {
        return this._gridLength;
    }
    createTick() {
        return new AxisTick();
    }
    createLabel() {
        return new AxisLabel();
    }
    checkAxisHover(event) {
        const bbox = this.computeBBox();
        const isInAxis = bbox.containsPoint(event.offsetX, event.offsetY);
        if (!isInAxis)
            return;
        this.moduleCtx.chartEventManager.axisHover(this.id, this.direction);
    }
    /**
     * Creates/removes/updates the scene graph nodes that constitute the axis.
     */
    update(primaryTickCount) {
        if (!this.tickGenerationResult) {
            return;
        }
        const { rotation, parallelFlipRotation, regularFlipRotation } = this.calculateRotations();
        const sideFlag = this.label.getSideFlag();
        this.updatePosition();
        const lineData = this.getAxisLineCoordinates();
        const _a = this.tickGenerationResult, { tickData, combinedRotation, textBaseline, textAlign } = _a, ticksResult = __rest(_a, ["tickData", "combinedRotation", "textBaseline", "textAlign"]);
        const previousTicks = this.tickLabelGroupSelection.nodes().map((node) => node.datum.tickId);
        this.updateSelections(lineData, tickData.ticks, {
            combinedRotation,
            textAlign,
            textBaseline,
            range: this.scale.range,
        });
        if (this.animationManager.isSkipped()) {
            this.resetSelectionNodes();
        }
        else {
            const diff = this.calculateUpdateDiff(previousTicks, tickData);
            this.animationState.transition('update', diff);
        }
        this.updateAxisLine();
        this.updateLabels();
        this.updateVisibility();
        this.updateGridLines(sideFlag);
        this.updateTickLines();
        this.updateTitle({ anyTickVisible: tickData.ticks.length > 0 });
        this.updateCrossLines({ rotation, parallelFlipRotation, regularFlipRotation });
        this.updateLayoutState();
        primaryTickCount = ticksResult.primaryTickCount;
        return primaryTickCount;
    }
    getAxisLineCoordinates() {
        const { range: [start, end], } = this;
        const x = 0;
        const y1 = Math.min(start, end);
        const y2 = Math.max(start, end);
        return { x, y1, y2 };
    }
    getTickLineCoordinates(datum) {
        const { label } = this;
        const sideFlag = label.getSideFlag();
        const x = sideFlag * this.getTickSize();
        const x1 = Math.min(0, x);
        const x2 = x1 + Math.abs(x);
        const y = datum.translationY;
        return { x1, x2, y };
    }
    getTickLabelProps(datum, params) {
        const { label } = this;
        const { combinedRotation, textBaseline, textAlign, range } = params;
        const text = datum.tickLabel;
        const sideFlag = label.getSideFlag();
        const labelX = sideFlag * (this.getTickSize() + label.padding + this.seriesAreaPadding);
        const visible = text !== '' && text != undefined;
        return {
            tickId: datum.tickId,
            translationY: datum.translationY,
            fill: label.color,
            fontFamily: label.fontFamily,
            fontSize: label.fontSize,
            fontStyle: label.fontStyle,
            fontWeight: label.fontWeight,
            rotation: combinedRotation,
            rotationCenterX: labelX,
            text,
            textAlign,
            textBaseline,
            visible,
            x: labelX,
            y: 0,
            range,
        };
    }
    getTickSize() {
        return this.tick.enabled ? this.tick.size : this.createTick().size;
    }
    setTitleProps(caption, params) {
        var _a;
        const { title } = this;
        if (!title) {
            caption.enabled = false;
            return;
        }
        caption.color = title.color;
        caption.fontFamily = title.fontFamily;
        caption.fontSize = title.fontSize;
        caption.fontStyle = title.fontStyle;
        caption.fontWeight = title.fontWeight;
        caption.enabled = title.enabled;
        caption.wrapping = title.wrapping;
        if (title.enabled) {
            const titleNode = caption.node;
            const padding = ((_a = title.spacing) !== null && _a !== void 0 ? _a : 0) + params.spacing;
            const sideFlag = this.label.getSideFlag();
            const parallelFlipRotation = normalizeAngle360(this.rotation);
            const titleRotationFlag = sideFlag === -1 && parallelFlipRotation > Math.PI && parallelFlipRotation < Math.PI * 2 ? -1 : 1;
            const rotation = (titleRotationFlag * sideFlag * Math.PI) / 2;
            const textBaseline = titleRotationFlag === 1 ? 'bottom' : 'top';
            const { range } = this;
            const x = Math.floor((titleRotationFlag * sideFlag * (range[0] + range[1])) / 2);
            const y = sideFlag === -1 ? Math.floor(titleRotationFlag * -padding) : Math.floor(-padding);
            const { callbackCache } = this.moduleCtx;
            const { formatter = (params) => params.defaultValue } = title;
            const text = callbackCache.call(formatter, this.getTitleFormatterParams());
            titleNode.setProperties({
                rotation,
                text,
                textBaseline,
                visible: true,
                x,
                y,
            });
        }
    }
    calculateLayout(primaryTickCount) {
        var _a;
        const { rotation, parallelFlipRotation, regularFlipRotation } = this.calculateRotations();
        const sideFlag = this.label.getSideFlag();
        const labelX = sideFlag * (this.getTickSize() + this.label.padding + this.seriesAreaPadding);
        this.updateScale();
        this.tickGenerationResult = this.generateTicks({
            primaryTickCount,
            parallelFlipRotation,
            regularFlipRotation,
            labelX,
            sideFlag,
        });
        this.updateLayoutState();
        const _b = this.tickGenerationResult, { tickData, combinedRotation, textBaseline, textAlign } = _b, ticksResult = __rest(_b, ["tickData", "combinedRotation", "textBaseline", "textAlign"]);
        const boxes = [];
        const { x, y1, y2 } = this.getAxisLineCoordinates();
        const lineBox = new BBox(x + Math.min(sideFlag * this.seriesAreaPadding, 0), y1, this.seriesAreaPadding, y2 - y1);
        boxes.push(lineBox);
        const { tick } = this;
        if (tick.enabled) {
            tickData.ticks.forEach((datum) => {
                const { x1, x2, y } = this.getTickLineCoordinates(datum);
                const tickLineBox = new BBox(x1, y, x2 - x1, 0);
                boxes.push(tickLineBox);
            });
        }
        const { label } = this;
        if (label.enabled) {
            const tempText = new Text();
            tickData.ticks.forEach((datum) => {
                const labelProps = this.getTickLabelProps(datum, {
                    combinedRotation,
                    textAlign,
                    textBaseline,
                    range: this.scale.range,
                });
                if (!labelProps.visible) {
                    return;
                }
                tempText.setProperties(Object.assign(Object.assign({}, labelProps), { translationY: Math.round(datum.translationY) }));
                const box = tempText.computeTransformedBBox();
                if (box) {
                    boxes.push(box);
                }
            });
        }
        const getTransformBox = (bbox) => {
            const matrix = new Matrix();
            const { rotation: axisRotation, translationX, translationY, rotationCenterX, rotationCenterY, } = this.getAxisTransform();
            Matrix.updateTransformMatrix(matrix, 1, 1, axisRotation, translationX, translationY, {
                scalingCenterX: 0,
                scalingCenterY: 0,
                rotationCenterX,
                rotationCenterY,
            });
            return matrix.transformBBox(bbox);
        };
        const { title } = this;
        if (title === null || title === void 0 ? void 0 : title.enabled) {
            const caption = new Caption();
            const spacing = BBox.merge(boxes).width;
            this.setTitleProps(caption, { spacing });
            const titleNode = caption.node;
            const titleBox = titleNode.computeTransformedBBox();
            if (titleBox) {
                boxes.push(titleBox);
            }
        }
        const bbox = BBox.merge(boxes);
        const transformedBBox = getTransformBox(bbox);
        const anySeriesActive = this.isAnySeriesActive();
        (_a = this.crossLines) === null || _a === void 0 ? void 0 : _a.forEach((crossLine) => {
            var _a;
            crossLine.sideFlag = -sideFlag;
            crossLine.direction = rotation === -Math.PI / 2 ? ChartAxisDirection.X : ChartAxisDirection.Y;
            if (crossLine instanceof CartesianCrossLine) {
                crossLine.label.parallel = (_a = crossLine.label.parallel) !== null && _a !== void 0 ? _a : this.label.parallel;
            }
            crossLine.parallelFlipRotation = parallelFlipRotation;
            crossLine.regularFlipRotation = regularFlipRotation;
            crossLine.calculateLayout(anySeriesActive, this.reverse);
        });
        primaryTickCount = ticksResult.primaryTickCount;
        return { primaryTickCount, bbox: transformedBBox };
    }
    updateLayoutState() {
        this.layout.label = {
            fractionDigits: this.fractionDigits,
            padding: this.label.padding,
            format: this.label.format,
        };
    }
    updateScale() {
        this.updateRange();
        this.calculateDomain();
        this.setDomain();
        this.setTickInterval(this.tick.interval);
        const { scale, nice } = this;
        if (!ContinuousScale.is(scale)) {
            return;
        }
        scale.nice = nice;
        scale.update();
    }
    calculateRotations() {
        const rotation = toRadians(this.rotation);
        // When labels are parallel to the axis line, the `parallelFlipFlag` is used to
        // flip the labels to avoid upside-down text, when the axis is rotated
        // such that it is in the right hemisphere, i.e. the angle of rotation
        // is in the [0, π] interval.
        // The rotation angle is normalized, so that we have an easier time checking
        // if it's in the said interval. Since the axis is always rendered vertically
        // and then rotated, zero rotation means 12 (not 3) o-clock.
        // -1 = flip
        //  1 = don't flip (default)
        const parallelFlipRotation = normalizeAngle360(rotation);
        const regularFlipRotation = normalizeAngle360(rotation - Math.PI / 2);
        return { rotation, parallelFlipRotation, regularFlipRotation };
    }
    generateTicks({ primaryTickCount, parallelFlipRotation, regularFlipRotation, labelX, sideFlag, }) {
        var _a;
        const { scale, tick, label: { parallel, rotation, fontFamily, fontSize, fontStyle, fontWeight }, } = this;
        const secondaryAxis = primaryTickCount !== undefined;
        const { defaultRotation, configuredRotation, parallelFlipFlag, regularFlipFlag } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });
        const initialRotation = configuredRotation + defaultRotation;
        const labelMatrix = new Matrix();
        const { maxTickCount } = this.estimateTickCount({
            minSpacing: tick.minSpacing,
            maxSpacing: (_a = tick.maxSpacing) !== null && _a !== void 0 ? _a : NaN,
        });
        const continuous = ContinuousScale.is(scale);
        const maxIterations = !continuous || isNaN(maxTickCount) ? 10 : maxTickCount;
        let textAlign = getTextAlign(parallel, configuredRotation, 0, sideFlag, regularFlipFlag);
        const textBaseline = getTextBaseline(parallel, configuredRotation, sideFlag, parallelFlipFlag);
        const textProps = {
            fontFamily,
            fontSize,
            fontStyle,
            fontWeight,
            textBaseline,
            textAlign,
        };
        let tickData = {
            rawTicks: [],
            ticks: [],
            labelCount: 0,
        };
        let index = 0;
        let autoRotation = 0;
        let labelOverlap = true;
        let terminate = false;
        while (labelOverlap && index <= maxIterations) {
            if (terminate) {
                break;
            }
            autoRotation = 0;
            textAlign = getTextAlign(parallel, configuredRotation, 0, sideFlag, regularFlipFlag);
            const tickStrategies = this.getTickStrategies({ secondaryAxis, index });
            for (const strategy of tickStrategies) {
                ({ tickData, index, autoRotation, terminate } = strategy({
                    index,
                    tickData,
                    textProps,
                    labelOverlap,
                    terminate,
                    primaryTickCount,
                }));
                const rotated = configuredRotation !== 0 || autoRotation !== 0;
                const rotation = initialRotation + autoRotation;
                textAlign = getTextAlign(parallel, configuredRotation, autoRotation, sideFlag, regularFlipFlag);
                labelOverlap = this.checkLabelOverlap(rotation, rotated, labelMatrix, tickData.ticks, labelX, Object.assign(Object.assign({}, textProps), { textAlign }));
            }
        }
        const combinedRotation = defaultRotation + configuredRotation + autoRotation;
        if (!secondaryAxis && tickData.rawTicks.length > 0) {
            primaryTickCount = tickData.rawTicks.length;
        }
        return { tickData, primaryTickCount, combinedRotation, textBaseline, textAlign };
    }
    getTickStrategies({ index, secondaryAxis }) {
        const { scale, label, tick } = this;
        const continuous = ContinuousScale.is(scale);
        const avoidLabelCollisions = label.enabled && label.avoidCollisions;
        const filterTicks = !continuous && index !== 0 && avoidLabelCollisions;
        const autoRotate = label.autoRotate === true && label.rotation === undefined;
        const strategies = [];
        let tickGenerationType;
        if (this.tick.values) {
            tickGenerationType = TickGenerationType.VALUES;
        }
        else if (secondaryAxis) {
            tickGenerationType = TickGenerationType.CREATE_SECONDARY;
        }
        else if (filterTicks) {
            tickGenerationType = TickGenerationType.FILTER;
        }
        else {
            tickGenerationType = TickGenerationType.CREATE;
        }
        const tickGenerationStrategy = ({ index, tickData, primaryTickCount, terminate }) => this.createTickData(tickGenerationType, index, tickData, terminate, primaryTickCount);
        strategies.push(tickGenerationStrategy);
        if (!continuous && !isNaN(tick.minSpacing)) {
            const tickFilterStrategy = ({ index, tickData, primaryTickCount, terminate }) => this.createTickData(TickGenerationType.FILTER, index, tickData, terminate, primaryTickCount);
            strategies.push(tickFilterStrategy);
        }
        if (!avoidLabelCollisions) {
            return strategies;
        }
        if (label.autoWrap) {
            const autoWrapStrategy = ({ index, tickData, textProps }) => this.wrapLabels(tickData, index, textProps);
            strategies.push(autoWrapStrategy);
        }
        else if (autoRotate) {
            const autoRotateStrategy = ({ index, tickData, labelOverlap, terminate }) => ({
                index,
                tickData,
                autoRotation: this.getAutoRotation(labelOverlap),
                terminate,
            });
            strategies.push(autoRotateStrategy);
        }
        return strategies;
    }
    createTickData(tickGenerationType, index, tickData, terminate, primaryTickCount) {
        var _a;
        const { scale, tick } = this;
        const { maxTickCount, minTickCount, defaultTickCount } = this.estimateTickCount({
            minSpacing: tick.minSpacing,
            maxSpacing: (_a = tick.maxSpacing) !== null && _a !== void 0 ? _a : NaN,
        });
        const continuous = ContinuousScale.is(scale);
        const maxIterations = !continuous || isNaN(maxTickCount) ? 10 : maxTickCount;
        let tickCount = continuous ? Math.max(defaultTickCount - index, minTickCount) : maxTickCount;
        const regenerateTicks = tick.interval === undefined &&
            tick.values === undefined &&
            tickCount > minTickCount &&
            (continuous || tickGenerationType === TickGenerationType.FILTER);
        let unchanged = true;
        while (unchanged && index <= maxIterations) {
            const prevTicks = tickData.rawTicks;
            tickCount = continuous ? Math.max(defaultTickCount - index, minTickCount) : maxTickCount;
            const { rawTicks, ticks, labelCount } = this.getTicks({
                tickGenerationType,
                previousTicks: prevTicks,
                tickCount,
                minTickCount,
                maxTickCount,
                primaryTickCount,
            });
            tickData.rawTicks = rawTicks;
            tickData.ticks = ticks;
            tickData.labelCount = labelCount;
            unchanged = regenerateTicks ? areArrayNumbersEqual(rawTicks, prevTicks) : false;
            index++;
        }
        const shouldTerminate = tick.interval !== undefined || tick.values !== undefined;
        terminate || (terminate = shouldTerminate);
        return { tickData, index, autoRotation: 0, terminate };
    }
    checkLabelOverlap(rotation, rotated, labelMatrix, tickData, labelX, textProps) {
        Matrix.updateTransformMatrix(labelMatrix, 1, 1, rotation, 0, 0);
        const labelData = this.createLabelData(tickData, labelX, textProps, labelMatrix);
        const labelSpacing = getLabelSpacing(this.label.minSpacing, rotated);
        return axisLabelsOverlap(labelData, labelSpacing);
    }
    createLabelData(tickData, labelX, textProps, labelMatrix) {
        const labelData = [];
        for (const tickDatum of tickData) {
            const { tickLabel, translationY } = tickDatum;
            if (tickLabel === '' || tickLabel == undefined) {
                // skip user hidden ticks
                continue;
            }
            const lines = splitText(tickLabel);
            const { width, height } = measureText(lines, labelX, translationY, textProps);
            const bbox = new BBox(labelX, translationY, width, height);
            const labelDatum = calculateLabelBBox(tickLabel, bbox, labelX, translationY, labelMatrix);
            labelData.push(labelDatum);
        }
        return labelData;
    }
    getAutoRotation(labelOverlap) {
        var _a;
        return labelOverlap ? normalizeAngle360(toRadians((_a = this.label.autoRotateAngle) !== null && _a !== void 0 ? _a : 0)) : 0;
    }
    getTicks({ tickGenerationType, previousTicks, tickCount, minTickCount, maxTickCount, primaryTickCount, }) {
        var _a;
        const { range, scale, visibleRange } = this;
        let rawTicks = [];
        switch (tickGenerationType) {
            case TickGenerationType.VALUES:
                if (ContinuousScale.is(scale)) {
                    const scaleDomain = scale.getDomain();
                    const start = scale.fromDomain(scaleDomain[0]);
                    const stop = scale.fromDomain(scaleDomain[1]);
                    const d0 = Math.min(start, stop);
                    const d1 = Math.max(start, stop);
                    rawTicks = this.tick.values.filter((value) => value >= d0 && value <= d1).sort((a, b) => a - b);
                }
                else {
                    rawTicks = this.tick.values;
                }
                break;
            case TickGenerationType.CREATE_SECONDARY:
                // `updateSecondaryAxisTicks` mutates `scale.domain` based on `primaryTickCount`
                rawTicks = this.updateSecondaryAxisTicks(primaryTickCount);
                break;
            case TickGenerationType.FILTER:
                rawTicks = this.filterTicks(previousTicks, tickCount);
                break;
            default:
                rawTicks = this.createTicks(tickCount, minTickCount, maxTickCount);
                break;
        }
        // `ticks instanceof NumericTicks` doesn't work here, so we feature detect.
        this.fractionDigits = rawTicks.fractionDigits >= 0 ? rawTicks.fractionDigits : 0;
        // When the scale domain or the ticks change, the label format may change
        this.onLabelFormatChange(rawTicks, this.label.format);
        const halfBandwidth = ((_a = scale.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2;
        const ticks = [];
        let labelCount = 0;
        const tickIdCounts = new Map();
        // Only get the ticks within a sliding window of the visible range to improve performance
        const start = Math.max(0, Math.floor(visibleRange[0] * rawTicks.length));
        const end = Math.min(rawTicks.length, Math.ceil(visibleRange[1] * rawTicks.length));
        for (let i = start; i < end; i++) {
            const rawTick = rawTicks[i];
            const translationY = scale.convert(rawTick) + halfBandwidth;
            // Do not render ticks outside the range with a small tolerance. A clip rect would trim long labels, so
            // instead hide ticks based on their translation.
            if (range.length > 0 && !this.inRange(translationY, 0, 0.001))
                continue;
            const tickLabel = this.formatTick(rawTick, i);
            // Create a tick id from the label, or as an increment of the last label if this tick label is blank
            let tickId = tickLabel;
            if (tickIdCounts.has(tickId)) {
                const count = tickIdCounts.get(tickId);
                tickIdCounts.set(tickId, count + 1);
                tickId = `${tickId}_${count}`;
            }
            else {
                tickIdCounts.set(tickId, 1);
            }
            ticks.push({ tick: rawTick, tickId, tickLabel, translationY });
            if (tickLabel === '' || tickLabel == undefined) {
                continue;
            }
            labelCount++;
        }
        return { rawTicks, ticks, labelCount };
    }
    filterTicks(ticks, tickCount) {
        var _a;
        const tickSpacing = !isNaN(this.tick.minSpacing) || !isNaN((_a = this.tick.maxSpacing) !== null && _a !== void 0 ? _a : NaN);
        const keepEvery = tickSpacing ? Math.ceil(ticks.length / tickCount) : 2;
        return ticks.filter((_, i) => i % keepEvery === 0);
    }
    createTicks(tickCount, minTickCount, maxTickCount) {
        var _a, _b, _c;
        this.setTickCount(tickCount, minTickCount, maxTickCount);
        return (_c = (_b = (_a = this.scale).ticks) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
    }
    estimateTickCount({ minSpacing, maxSpacing }) {
        const { minRect } = this;
        const rangeWithBleed = this.calculateRangeWithBleed();
        const defaultMinSpacing = Math.max(this.defaultTickMinSpacing, rangeWithBleed / ContinuousScale.defaultMaxTickCount);
        let clampMaxTickCount = !isNaN(maxSpacing);
        if (isNaN(minSpacing)) {
            minSpacing = defaultMinSpacing;
        }
        if (isNaN(maxSpacing)) {
            maxSpacing = rangeWithBleed;
        }
        if (minSpacing > maxSpacing) {
            if (minSpacing === defaultMinSpacing) {
                minSpacing = maxSpacing;
            }
            else {
                maxSpacing = minSpacing;
            }
        }
        // Clamps the min spacing between ticks to be no more than the min distance between datums
        const minRectDistance = minRect
            ? this.direction === ChartAxisDirection.X
                ? minRect.width
                : minRect.height
            : 1;
        clampMaxTickCount && (clampMaxTickCount = minRectDistance < defaultMinSpacing);
        const maxTickCount = clamp(1, Math.floor(rangeWithBleed / minSpacing), clampMaxTickCount ? Math.floor(rangeWithBleed / minRectDistance) : Infinity);
        const minTickCount = Math.min(maxTickCount, Math.ceil(rangeWithBleed / maxSpacing));
        const defaultTickCount = clamp(minTickCount, ContinuousScale.defaultTickCount, maxTickCount);
        return { minTickCount, maxTickCount, defaultTickCount };
    }
    updateVisibility() {
        if (this.moduleCtx.animationManager.isSkipped()) {
            this.resetSelectionNodes();
        }
        this.tickLineGroup.visible = this.tick.enabled;
        this.gridLineGroup.visible = this.gridLine.enabled;
        this.tickLabelGroup.visible = this.label.enabled;
    }
    updateCrossLines({ rotation, parallelFlipRotation, regularFlipRotation, }) {
        var _a;
        const sideFlag = this.label.getSideFlag();
        const anySeriesActive = this.isAnySeriesActive();
        (_a = this.crossLines) === null || _a === void 0 ? void 0 : _a.forEach((crossLine) => {
            var _a;
            crossLine.sideFlag = -sideFlag;
            crossLine.direction = rotation === -Math.PI / 2 ? ChartAxisDirection.X : ChartAxisDirection.Y;
            if (crossLine instanceof CartesianCrossLine) {
                crossLine.label.parallel = (_a = crossLine.label.parallel) !== null && _a !== void 0 ? _a : this.label.parallel;
            }
            crossLine.parallelFlipRotation = parallelFlipRotation;
            crossLine.regularFlipRotation = regularFlipRotation;
            crossLine.update(anySeriesActive);
        });
    }
    updateTickLines() {
        const { tick, label } = this;
        const sideFlag = label.getSideFlag();
        this.tickLineGroupSelection.each((line) => {
            line.strokeWidth = tick.width;
            line.stroke = tick.color;
            line.x1 = sideFlag * this.getTickSize();
            line.x2 = 0;
        });
    }
    calculateAvailableRange() {
        const { range } = this;
        const min = Math.min(...range);
        const max = Math.max(...range);
        return max - min;
    }
    /**
     * Calculates the available range with an additional "bleed" beyond the canvas that encompasses the full axis when
     * the visible range is only a portion of the axis.
     */
    calculateRangeWithBleed() {
        const { visibleRange } = this;
        const visibleScale = 1 / (visibleRange[1] - visibleRange[0]);
        return round(this.calculateAvailableRange() * visibleScale, 2);
    }
    calculateDomain() {
        if (this.linkedTo) {
            this.dataDomain = this.linkedTo.dataDomain;
        }
        else {
            const visibleSeries = this.boundSeries.filter((s) => this.includeInvisibleDomains || s.isEnabled());
            const domains = visibleSeries.flatMap((series) => series.getDomain(this.direction));
            const { domain, clipped } = this.normaliseDataDomain(domains);
            this.dataDomain = { domain: this.reverse ? [...domain].reverse() : domain, clipped };
        }
    }
    getAxisTransform() {
        return {
            rotation: toRadians(this.rotation),
            rotationCenterX: 0,
            rotationCenterY: 0,
            translationX: Math.floor(this.translation.x),
            translationY: Math.floor(this.translation.y),
        };
    }
    updatePosition() {
        const { crossLineGroup, axisGroup, gridGroup, translation, gridLineGroupSelection, gridPadding, gridLength } = this;
        const { rotation } = this.calculateRotations();
        const sideFlag = this.label.getSideFlag();
        const translationX = Math.floor(translation.x);
        const translationY = Math.floor(translation.y);
        crossLineGroup.setProperties({ rotation, translationX, translationY });
        axisGroup.datum = this.getAxisTransform();
        gridGroup.setProperties({ rotation, translationX, translationY });
        gridLineGroupSelection.each((line) => {
            line.x1 = gridPadding;
            line.x2 = -sideFlag * gridLength + gridPadding;
        });
    }
    updateSecondaryAxisTicks(_primaryTickCount) {
        throw new Error('AG Charts - unexpected call to updateSecondaryAxisTicks() - check axes configuration.');
    }
    updateSelections(lineData, data, params) {
        this.lineNode.datum = lineData;
        this.gridLineGroupSelection.update(this.gridLength ? data : [], (group) => group.append(new Line({ tag: Tags.GridLine })), (datum) => datum.tickId);
        this.tickLineGroupSelection.update(data, (group) => group.appendChild(new Line({ tag: Tags.TickLine })), (datum) => datum.tickId);
        this.tickLabelGroupSelection.update(data.map((d) => this.getTickLabelProps(d, params)), (group) => group.appendChild(new Text({ tag: Tags.TickLabel })), (datum) => datum.tickId);
    }
    updateAxisLine() {
        const { line } = this;
        // Without this the layout isn't consistent when enabling/disabling the line, padding configurations are not respected.
        const strokeWidth = line.enabled ? line.width : 0;
        this.lineNode.setProperties({
            stroke: line.color,
            strokeWidth,
        });
    }
    updateGridLines(sideFlag) {
        const { gridLine: { style, width }, gridPadding, gridLength, } = this;
        if (gridLength === 0 || style.length === 0) {
            return;
        }
        this.gridLineGroupSelection.each((line, _, index) => {
            const { stroke, lineDash } = style[index % style.length];
            line.setProperties({
                x1: gridPadding,
                x2: -sideFlag * gridLength + gridPadding,
                fill: undefined,
                stroke,
                strokeWidth: width,
                lineDash,
            });
        });
    }
    updateLabels() {
        const { label } = this;
        if (!label.enabled) {
            return;
        }
        // Apply label option values
        this.tickLabelGroupSelection.each((node, datum) => {
            node.setProperties(datum, [
                'fill',
                'fontFamily',
                'fontSize',
                'fontStyle',
                'fontWeight',
                'text',
                'textAlign',
                'textBaseline',
            ]);
        });
    }
    wrapLabels(tickData, index, labelProps) {
        const { parallel, maxWidth, maxHeight } = this.label;
        let defaultMaxWidth = this.maxThickness;
        let defaultMaxHeight = Math.round(this.calculateAvailableRange() / tickData.labelCount);
        if (parallel) {
            [defaultMaxWidth, defaultMaxHeight] = [defaultMaxHeight, defaultMaxWidth];
        }
        tickData.ticks.forEach((tickDatum) => {
            const { text } = Text.wrap(tickDatum.tickLabel, maxWidth !== null && maxWidth !== void 0 ? maxWidth : defaultMaxWidth, maxHeight !== null && maxHeight !== void 0 ? maxHeight : defaultMaxHeight, labelProps, 'hyphenate');
            tickDatum.tickLabel = text;
        });
        return { tickData, index, autoRotation: 0, terminate: true };
    }
    updateTitle(params) {
        const { rotation, title, _titleCaption, lineNode, tickLineGroup, tickLabelGroup } = this;
        if (!title) {
            _titleCaption.enabled = false;
            return;
        }
        let spacing = 0;
        if (title.enabled && params.anyTickVisible) {
            const tickBBox = Group.computeBBox([tickLineGroup, tickLabelGroup, lineNode]);
            const tickWidth = rotation === 0 ? tickBBox.width : tickBBox.height;
            spacing += tickWidth + (!this.tickLabelGroup.visible ? this.seriesAreaPadding : 0);
        }
        this.setTitleProps(_titleCaption, { spacing });
    }
    // For formatting (nice rounded) tick values.
    formatTick(datum, index) {
        var _a, _b;
        const { label, labelFormatter, fractionDigits, moduleCtx: { callbackCache }, } = this;
        if (label.formatter) {
            const value = fractionDigits > 0 ? datum : String(datum);
            return ((_a = callbackCache.call(label.formatter, {
                value,
                index,
                fractionDigits,
                formatter: labelFormatter,
            })) !== null && _a !== void 0 ? _a : value);
        }
        else if (labelFormatter) {
            return (_b = callbackCache.call(labelFormatter, datum)) !== null && _b !== void 0 ? _b : String(datum);
        }
        // The axis is using a logScale or the`datum` is an integer, a string or an object
        return String(datum);
    }
    // For formatting arbitrary values between the ticks.
    formatDatum(datum) {
        return String(datum);
    }
    computeBBox() {
        return this.axisGroup.computeBBox();
    }
    initCrossLine(crossLine) {
        crossLine.scale = this.scale;
        crossLine.gridLength = this.gridLength;
    }
    isAnySeriesActive() {
        return this.boundSeries.some((s) => this.includeInvisibleDomains || s.isEnabled());
    }
    clipTickLines(x, y, width, height) {
        this.tickLineGroup.setClipRectInGroupCoordinateSpace(new BBox(x, y, width, height));
    }
    clipGrid(x, y, width, height) {
        this.gridGroup.setClipRectInGroupCoordinateSpace(new BBox(x, y, width, height));
    }
    calculatePadding(min, _max, reverse) {
        const start = reverse ? _max : min;
        return [Math.abs(start * 0.01), Math.abs(start * 0.01)];
    }
    getTitleFormatterParams() {
        var _a;
        const boundSeries = this.boundSeries.reduce((acc, next) => {
            const keys = next.getKeys(this.direction);
            const names = next.getNames(this.direction);
            for (let idx = 0; idx < keys.length; idx++) {
                acc.push({ key: keys[idx], name: names[idx] });
            }
            return acc;
        }, []);
        return {
            direction: this.direction,
            boundSeries,
            defaultValue: (_a = this.title) === null || _a === void 0 ? void 0 : _a.text,
        };
    }
    normaliseDataDomain(d) {
        return { domain: d, clipped: false };
    }
    getLayoutState() {
        return Object.assign({ rect: this.computeBBox(), gridPadding: this.gridPadding, seriesAreaPadding: this.seriesAreaPadding, tickSize: this.getTickSize() }, this.layout);
    }
    getModuleMap() {
        return this.moduleMap;
    }
    createModuleContext() {
        var _a;
        (_a = this.axisContext) !== null && _a !== void 0 ? _a : (this.axisContext = this.createAxisContext());
        return Object.assign(Object.assign({}, this.moduleCtx), { parent: this.axisContext });
    }
    createAxisContext() {
        return {
            axisId: this.id,
            direction: this.direction,
            continuous: ContinuousScale.is(this.scale),
            keys: () => this.boundSeries.flatMap((s) => s.getKeys(this.direction)),
            scaleValueFormatter: (specifier) => { var _a, _b; return (_b = (_a = this.scale).tickFormat) === null || _b === void 0 ? void 0 : _b.call(_a, { specifier }); },
            scaleBandwidth: () => { var _a; return (_a = this.scale.bandwidth) !== null && _a !== void 0 ? _a : 0; },
            scaleConvert: (val) => this.scale.convert(val),
            scaleInvert: (val) => { var _a, _b; return (_b = (_a = this.scale).invert) === null || _b === void 0 ? void 0 : _b.call(_a, val); },
        };
    }
    animateReadyUpdate(diff) {
        const { animationManager } = this.moduleCtx;
        const selectionCtx = prepareAxisAnimationContext(this);
        const fns = prepareAxisAnimationFunctions(selectionCtx);
        fromToMotion(this.id, 'axis-group', animationManager, [this.axisGroup], fns.group);
        fromToMotion(this.id, 'line', animationManager, [this.lineNode], fns.line);
        fromToMotion(this.id, 'line-paths', animationManager, [this.gridLineGroupSelection, this.tickLineGroupSelection], fns.tick, (_, d) => d.tickId, diff);
        fromToMotion(this.id, 'tick-labels', animationManager, [this.tickLabelGroupSelection], fns.label, (_, d) => d.tickId, diff);
    }
    resetSelectionNodes() {
        const { gridLineGroupSelection, tickLineGroupSelection, tickLabelGroupSelection, lineNode } = this;
        const selectionCtx = prepareAxisAnimationContext(this);
        resetMotion([this.axisGroup], resetAxisGroupFn());
        resetMotion([gridLineGroupSelection, tickLineGroupSelection], resetAxisSelectionFn(selectionCtx));
        resetMotion([tickLabelGroupSelection], resetAxisLabelSelectionFn());
        resetMotion([lineNode], resetAxisLineSelectionFn());
    }
    calculateUpdateDiff(previous, tickData) {
        const added = new Set();
        const removed = new Set();
        const tickMap = {};
        const tickCount = Math.max(previous.length, tickData.ticks.length);
        for (let i = 0; i < tickCount; i++) {
            const tickDatum = tickData.ticks[i];
            const prev = previous[i];
            const tick = tickDatum === null || tickDatum === void 0 ? void 0 : tickDatum.tickId;
            tickMap[tick !== null && tick !== void 0 ? tick : prev] = tickDatum;
            if (prev === tick) {
                continue;
            }
            if (removed.has(tick)) {
                removed.delete(tick);
            }
            else if (tick) {
                added.add(tick);
            }
            if (added.has(prev)) {
                added.delete(prev);
            }
            else if (prev) {
                removed.add(prev);
            }
        }
        return {
            changed: added.size > 0 || removed.size > 0,
            added: [...added.values()],
            removed: [...removed.values()],
        };
    }
    isReversed() {
        return !!this.reverse;
    }
}
Axis.defaultTickMinSpacing = 50;
__decorate([
    Validate(BOOLEAN)
], Axis.prototype, "nice", void 0);
__decorate([
    Validate(BOOLEAN, { optional: true })
], Axis.prototype, "reverse", void 0);
__decorate([
    Validate(STRING_ARRAY)
], Axis.prototype, "keys", void 0);
__decorate([
    Validate(predicateWithMessage((title) => typeof title == 'object', 'Title object'), { optional: true })
], Axis.prototype, "title", void 0);
//# sourceMappingURL=axis.js.map