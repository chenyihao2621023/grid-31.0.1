import { _Scale, _Scene, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { defaultTooltipCss } from './tooltip/defaultTooltipCss';
const { extent, isNumber, isString, isStringObject, isDate, createId, Padding } = _Util;
const { LinearScale, BandScale, TimeScale } = _Scale;

export var ZINDICIES;
(function (ZINDICIES) {
    ZINDICIES[ZINDICIES["SERIES_FILL_ZINDEX"] = 50] = "SERIES_FILL_ZINDEX";
    ZINDICIES[ZINDICIES["AXIS_LINE_ZINDEX"] = 500] = "AXIS_LINE_ZINDEX";
    ZINDICIES[ZINDICIES["SERIES_STROKE_ZINDEX"] = 1000] = "SERIES_STROKE_ZINDEX";
    ZINDICIES[ZINDICIES["SERIES_LABEL_ZINDEX"] = 1500] = "SERIES_LABEL_ZINDEX";
    ZINDICIES[ZINDICIES["CROSSHAIR_ZINDEX"] = 2000] = "CROSSHAIR_ZINDEX";
    ZINDICIES[ZINDICIES["SERIES_MARKERS_ZINDEX"] = 2500] = "SERIES_MARKERS_ZINDEX";
})(ZINDICIES || (ZINDICIES = {}));
export class SparklineAxis {
    constructor() {
        this.type = 'category';
        this.stroke = 'rgb(204, 214, 235)';
        this.strokeWidth = 1;
    }
}
export class Sparkline {
    set context(value) {
        if (this._context !== value) {
            this._context = value;
        }
    }
    get context() {
        return this._context;
    }
    set container(value) {
        if (this._container !== value) {
            const { parentNode } = this.canvasElement;
            if (parentNode != null) {
                parentNode.removeChild(this.canvasElement);
            }
            if (value) {
                value.appendChild(this.canvasElement);
            }
            this._container = value;
        }
    }
    get container() {
        return this._container;
    }
    set data(value) {
        if (this._data !== value) {
            this._data = value;
            this.processData();
            if (this.mouseMoveEvent && this.highlightedDatum) {
                this.updateHitPoint(this.mouseMoveEvent);
            }
        }
    }
    get data() {
        return this._data;
    }
    constructor() {
        this.id = createId(this);
        this.seriesRect = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        };
        this._context = undefined;
        this._container = undefined;
        this._data = undefined;
        this.padding = new Padding(3);
        this.xKey = 'x';
        this.yKey = 'y';
        this.dataType = undefined;
        this.xData = [];
        this.yData = [];
        // Minimum y value in provided data.
        this.min = undefined;
        // Maximum y value in provided data.
        this.max = undefined;
        this.yScale = new LinearScale();
        this.axis = new SparklineAxis();
        this.highlightStyle = {
            size: 6,
            fill: 'yellow',
            stroke: 'silver',
            strokeWidth: 1,
        };
        this._width = 100;
        this._height = 100;
        this.smallestInterval = undefined;
        this.layoutId = 0;
        this.defaultDateFormatter = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseOut = this.onMouseOut.bind(this);
        const root = new _Scene.Group();
        this.rootGroup = root;
        const element = document.createElement('div');
        element.setAttribute('class', 'zing-sparkline-wrapper');
        // initialise scene
        const scene = new _Scene.Scene({ window, document });
        this.scene = scene;
        this.canvasElement = scene.canvas.element;
        // set scene properties
        scene.root = root;
        scene.container = element;
        this.resizeAndSetDimensions(this.width, this.height);
        // one style element for tooltip styles per document
        if (!Sparkline.tooltipDocuments.includes(document)) {
            this.initialiseTooltipStyles();
        }
        this.setupDomEventListeners(this.canvasElement);
    }
    resizeAndSetDimensions(width, height) {
        this.scene.resize(width, height);
        this.seriesRect.width = width;
        this.seriesRect.height = height;
    }
    initialiseTooltipStyles() {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = defaultTooltipCss;
        document.head.insertBefore(styleElement, document.head.querySelector('style'));
        Sparkline.tooltipDocuments.push(document);
    }
    set width(value) {
        if (this._width !== value) {
            this._width = value;
            this.scene.resize(value, this.height);
            this.scheduleLayout();
        }
    }
    get width() {
        return this._width;
    }
    set height(value) {
        if (this._height !== value) {
            this._height = value;
            this.scene.resize(this.width, value);
            this.scheduleLayout();
        }
    }
    get height() {
        return this._height;
    }
    
    update() { }
    // Update y scale based on processed data.
    updateYScale() {
        this.updateYScaleRange();
        this.updateYScaleDomain();
    }
    // Update y scale domain based on processed data.
    updateYScaleDomain() { }
    // Update y scale range based on height and padding (seriesRect).
    updateYScaleRange() {
        const { yScale, seriesRect } = this;
        yScale.range = [seriesRect.height, 0];
    }
    // Update x scale based on processed data.
    updateXScale() {
        const { type } = this.axis;
        this.xScale = this.getXScale(type);
        this.updateXScaleRange();
        this.updateXScaleDomain();
    }
    // Update x scale range based on width and padding (seriesRect).
    updateXScaleRange() {
        this.xScale.range = [0, this.seriesRect.width];
    }
    // Update x scale domain based on processed data and type of scale.
    updateXScaleDomain() {
        const { xData, xScale } = this;
        let xMinMax;
        if (xScale instanceof LinearScale || xScale instanceof TimeScale) {
            xMinMax = extent(xData);
        }
        this.xScale.domain = xMinMax ? xMinMax.slice() : xData;
    }
    
    getXScale(type = 'category') {
        switch (type) {
            case 'number':
                return new LinearScale();
            case 'time':
                return new TimeScale();
            case 'category':
            default:
                return new BandScale();
        }
    }
    // Update axis line.
    updateAxisLine() { }
    // Update X and Y scales and the axis line.
    updateAxes() {
        this.updateYScale();
        this.updateXScale();
        this.updateAxisLine();
    }
    // Update horizontal and vertical crosshair lines.
    updateCrosshairs() {
        this.updateXCrosshairLine();
        this.updateYCrosshairLine();
    }
    // Using processed data, generate data that backs visible nodes.
    generateNodeData() {
        return [];
    }
    // Returns persisted node data associated with the sparkline's data.
    getNodeData() {
        return [];
    }
    // Update the selection's nodes.
    updateNodes() { }
    // Update the vertical crosshair line.
    updateXCrosshairLine() { }
    // Update the horizontal crosshair line.
    updateYCrosshairLine() { }
    highlightDatum(closestDatum) {
        this.updateNodes();
    }
    dehighlightDatum() {
        this.highlightedDatum = undefined;
        this.updateNodes();
        this.updateCrosshairs();
    }
    
    onMouseMove(event) {
        this.mouseMoveEvent = event;
        this.updateHitPoint(event);
    }
    updateHitPoint(event) {
        var _a, _b, _c;
        const closestDatum = this.pickClosestSeriesNodeDatum(event.offsetX, event.offsetY);
        if (!closestDatum) {
            return;
        }
        const oldHighlightedDatum = this.highlightedDatum;
        this.highlightedDatum = closestDatum;
        if ((this.highlightedDatum && !oldHighlightedDatum) ||
            (this.highlightedDatum && oldHighlightedDatum && this.highlightedDatum !== oldHighlightedDatum)) {
            this.highlightDatum(closestDatum);
            this.updateCrosshairs();
            this.scene.render().catch((e) => console.error(`ZING Grid - chart rendering failed`, e));
        }
        const tooltipEnabled = (_c = (_b = (_a = this.processedOptions) === null || _a === void 0 ? void 0 : _a.tooltip) === null || _b === void 0 ? void 0 : _b.enabled) !== null && _c !== void 0 ? _c : true;
        if (tooltipEnabled) {
            this.handleTooltip(event, closestDatum);
        }
    }
    
    onMouseOut(event) {
        this.dehighlightDatum();
        this.tooltip.toggle(false);
        this.scene.render().catch((e) => console.error(`ZING Grid - chart rendering failed`, e));
    }
    // Fetch required values from the data object and process them.
    processData() {
        const { data, yData, xData } = this;
        if (!data || this.invalidData(this.data)) {
            return;
        }
        yData.length = 0;
        xData.length = 0;
        const n = data.length;
        const dataType = this.getDataType(data);
        this.dataType = dataType;
        const { type: xValueType } = this.axis;
        const xType = xValueType !== 'number' && xValueType !== 'time' ? 'category' : xValueType;
        const isContinuousX = xType === 'number' || xType === 'time';
        const setSmallestXInterval = (curr, prev) => {
            if (this.smallestInterval == undefined) {
                this.smallestInterval = { x: Infinity, y: Infinity };
            }
            const { x } = this.smallestInterval;
            const interval = Math.abs(curr - prev);
            if (interval > 0 && interval < x) {
                this.smallestInterval.x = interval;
            }
        };
        let prevX;
        if (dataType === 'number') {
            for (let i = 0; i < n; i++) {
                const xDatum = i;
                const yDatum = data[i];
                const x = this.getDatum(xDatum, xType);
                const y = this.getDatum(yDatum, 'number');
                if (isContinuousX) {
                    setSmallestXInterval(x, prevX);
                }
                xData.push(x);
                yData.push(y);
                prevX = x;
            }
        }
        else if (dataType === 'array') {
            for (let i = 0; i < n; i++) {
                const datum = data[i];
                if (Array.isArray(datum)) {
                    const xDatum = datum[0];
                    const yDatum = datum[1];
                    const x = this.getDatum(xDatum, xType);
                    const y = this.getDatum(yDatum, 'number');
                    if (x == undefined) {
                        continue;
                    }
                    if (isContinuousX) {
                        setSmallestXInterval(x, prevX);
                    }
                    xData.push(x);
                    yData.push(y);
                    prevX = x;
                }
            }
        }
        else if (dataType === 'object') {
            const { yKey, xKey } = this;
            for (let i = 0; i < n; i++) {
                const datum = data[i];
                if (typeof datum === 'object' && !Array.isArray(datum)) {
                    const xDatum = datum[xKey];
                    const yDatum = datum[yKey];
                    const x = this.getDatum(xDatum, xType);
                    const y = this.getDatum(yDatum, 'number');
                    if (x == undefined) {
                        continue;
                    }
                    if (isContinuousX) {
                        setSmallestXInterval(x, prevX);
                    }
                    xData.push(x);
                    yData.push(y);
                    prevX = x;
                }
            }
        }
        this.updateAxes();
        this.immediateLayout();
    }
    
    getDataType(data) {
        for (const datum of data) {
            if (datum != undefined) {
                if (isNumber(datum)) {
                    return 'number';
                }
                else if (Array.isArray(datum)) {
                    return 'array';
                }
                else if (typeof datum === 'object') {
                    return 'object';
                }
            }
        }
    }
    
    getDatum(value, type) {
        if ((type === 'number' && isNumber(value)) || (type === 'time' && (isNumber(value) || isDate(value)))) {
            return value;
        }
        else if (type === 'category') {
            if (isString(value) || isDate(value) || isNumber(value)) {
                return { toString: () => String(value) };
            }
            else if (isStringObject(value)) {
                return value;
            }
        }
    }
    
    get layoutScheduled() {
        return !!this.layoutId;
    }
    
    scheduleLayout() {
        if (this.layoutId) {
            cancelAnimationFrame(this.layoutId);
        }
        this.layoutId = requestAnimationFrame(() => {
            this.immediateLayout();
            this.layoutId = 0;
        });
    }
    immediateLayout() {
        this.setSparklineDimensions();
        if (this.invalidData(this.data)) {
            return;
        }
        // update axes ranges
        this.updateXScaleRange();
        this.updateYScaleRange();
        // update axis line
        this.updateAxisLine();
        // produce data joins and update selection's nodes
        this.update();
        this.scene.render().catch((e) => console.error(`ZING Grid - chart rendering failed`, e));
    }
    setSparklineDimensions() {
        const { width, height, padding, seriesRect, rootGroup } = this;
        const shrunkWidth = width - padding.left - padding.right;
        const shrunkHeight = height - padding.top - padding.bottom;
        seriesRect.width = shrunkWidth;
        seriesRect.height = shrunkHeight;
        seriesRect.x = padding.left;
        seriesRect.y = padding.top;
        rootGroup.translationX = seriesRect.x;
        rootGroup.translationY = seriesRect.y;
    }
    
    pickClosestSeriesNodeDatum(x, y) {
        let minDistance = Infinity;
        let closestDatum;
        const hitPoint = this.rootGroup.transformPoint(x, y);
        const nodeData = this.getNodeData();
        for (let i = 0; i < nodeData.length; i++) {
            const datum = nodeData[i];
            if (!datum.point) {
                return;
            }
            const distance = this.getDistance(hitPoint, datum.point);
            if (distance <= minDistance) {
                minDistance = distance;
                closestDatum = datum;
            }
        }
        return closestDatum;
    }
    
    getDistance(p1, p2) {
        return Math.abs(p1.x - p2.x);
    }
    
    handleTooltip(event, datum) {
        var _a, _b;
        const { seriesDatum } = datum;
        const { canvasElement } = this;
        const { clientX, clientY } = event;
        const tooltipOptions = (_a = this.processedOptions) === null || _a === void 0 ? void 0 : _a.tooltip;
        const meta = {
            pageX: clientX,
            pageY: clientY,
            position: {
                xOffset: tooltipOptions === null || tooltipOptions === void 0 ? void 0 : tooltipOptions.xOffset,
                yOffset: tooltipOptions === null || tooltipOptions === void 0 ? void 0 : tooltipOptions.yOffset,
            },
            container: tooltipOptions === null || tooltipOptions === void 0 ? void 0 : tooltipOptions.container,
        };
        // confine tooltip to sparkline width if tooltip container not provided.
        if (meta.container == undefined) {
            meta.container = canvasElement;
        }
        const yValue = seriesDatum.y;
        const xValue = seriesDatum.x;
        // check if tooltip is enabled for this specific data point
        let enabled = (_b = tooltipOptions === null || tooltipOptions === void 0 ? void 0 : tooltipOptions.enabled) !== null && _b !== void 0 ? _b : true;
        const tooltipRenderer = tooltipOptions === null || tooltipOptions === void 0 ? void 0 : tooltipOptions.renderer;
        if (tooltipRenderer) {
            const tooltipRendererResult = tooltipRenderer({
                context: this.context,
                datum: seriesDatum,
                yValue,
                xValue,
            });
            enabled =
                typeof tooltipRendererResult !== 'string' && tooltipRendererResult.enabled !== undefined
                    ? tooltipRendererResult.enabled
                    : enabled;
        }
        const html = enabled && seriesDatum.y !== undefined && this.getTooltipHtml(datum);
        if (html) {
            this.tooltip.show(meta, html);
        }
    }
    formatNumericDatum(datum) {
        return String(Math.round(datum * 10) / 10);
    }
    // locale.format('%m/%d/%y, %H:%M:%S');
    formatDatum(datum) {
        const type = this.axis.type || 'category';
        if (type === 'number' && typeof datum === 'number') {
            return this.formatNumericDatum(datum);
        }
        else if (type === 'time' && (datum instanceof Date || isNumber(datum))) {
            return this.defaultDateFormatter.format(datum);
        }
        else {
            return String(datum);
        }
    }
    setupDomEventListeners(chartElement) {
        chartElement.addEventListener('mousemove', this._onMouseMove);
        chartElement.addEventListener('mouseout', this._onMouseOut);
    }
    cleanupDomEventListeners(chartElement) {
        chartElement.removeEventListener('mousemove', this._onMouseMove);
        chartElement.removeEventListener('mouseout', this._onMouseOut);
    }
    invalidData(data) {
        return !data || !Array.isArray(data) || data.length === 0;
    }
    
    destroy() {
        this.scene.container = undefined;
        // remove canvas element from the DOM
        this.container = undefined;
        this.cleanupDomEventListeners(this.scene.canvas.element);
    }
}
Sparkline.tooltipDocuments = [];
