var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { _ModuleSupport, _Scale, _Scene, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { RadiusCategoryAxis } from '../../axes/radius-category/radiusCategoryAxis';
import { RadialBarSeriesProperties } from './radialBarSeriesProperties';
import { prepareRadialBarSeriesAnimationFunctions, resetRadialBarSelectionsFn } from './radialBarUtil';
const { ChartAxisDirection, PolarAxis, diff, isDefined, groupAccumulativeValueProperty, keyProperty, normaliseGroupTo, valueProperty, fixNumericExtent, resetLabelFn, seriesLabelFadeInAnimation, seriesLabelFadeOutAnimation, animationValidation, } = _ModuleSupport;
const { BandScale } = _Scale;
const { Sector, motion } = _Scene;
const { angleBetween, isNumber, sanitizeHtml } = _Util;
class RadialBarSeriesNodeClickEvent extends _ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.properties.angleKey;
        this.radiusKey = series.properties.radiusKey;
    }
}
export class RadialBarSeries extends _ModuleSupport.PolarSeries {
    constructor(moduleCtx) {
        super({
            moduleCtx,
            useLabelLayer: true,
            canHaveAxes: true,
            animationResetFns: {
                item: resetRadialBarSelectionsFn,
                label: resetLabelFn,
            },
        });
        this.properties = new RadialBarSeriesProperties();
        this.NodeClickEvent = RadialBarSeriesNodeClickEvent;
        this.nodeData = [];
        this.groupScale = new BandScale();
        this.circleCache = { r: 0, cx: 0, cy: 0 };
    }
    nodeFactory() {
        return new Sector();
    }
    addChartEventListeners() {
        var _a, _b;
        (_a = this.ctx.chartEventManager) === null || _a === void 0 ? void 0 : _a.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
        (_b = this.ctx.chartEventManager) === null || _b === void 0 ? void 0 : _b.addListener('legend-item-double-click', (event) => this.onLegendItemDoubleClick(event));
    }
    getSeriesDomain(direction) {
        const { axes, dataModel, processedData } = this;
        if (!processedData || !dataModel)
            return [];
        if (direction === ChartAxisDirection.X) {
            const angleAxis = axes[ChartAxisDirection.X];
            const xExtent = dataModel.getDomain(this, 'angleValue-end', 'value', processedData);
            const fixedXExtent = [xExtent[0] > 0 ? 0 : xExtent[0], xExtent[1] < 0 ? 0 : xExtent[1]];
            return fixNumericExtent(fixedXExtent, angleAxis);
        }
        else {
            return dataModel.getDomain(this, 'radiusValue', 'key', processedData);
        }
    }
    processData(dataController) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.isValid()) {
                return;
            }
            const stackGroupId = this.getStackId();
            const stackGroupTrailingId = `${stackGroupId}-trailing`;
            const { angleKey, radiusKey, normalizedTo, visible } = this.properties;
            const extraProps = [];
            if (isDefined(normalizedTo)) {
                extraProps.push(normaliseGroupTo(this, [stackGroupId, stackGroupTrailingId], Math.abs(normalizedTo), 'range'));
            }
            const animationEnabled = !this.ctx.animationManager.isSkipped();
            if (animationEnabled) {
                if (this.processedData) {
                    extraProps.push(diff(this.processedData));
                }
                extraProps.push(animationValidation(this));
            }
            const visibleProps = this.visible || !animationEnabled ? {} : { forceValue: 0 };
            yield this.requestDataModel(dataController, (_a = this.data) !== null && _a !== void 0 ? _a : [], {
                props: [
                    keyProperty(this, radiusKey, false, { id: 'radiusValue' }),
                    valueProperty(this, angleKey, true, Object.assign({ id: 'angleValue-raw', invalidValue: null }, visibleProps)),
                    ...groupAccumulativeValueProperty(this, angleKey, true, 'normal', 'current', Object.assign({ id: `angleValue-end`, invalidValue: null, groupId: stackGroupId }, visibleProps)),
                    ...groupAccumulativeValueProperty(this, angleKey, true, 'trailing', 'current', Object.assign({ id: `angleValue-start`, invalidValue: null, groupId: stackGroupTrailingId }, visibleProps)),
                    ...extraProps,
                ],
                dataVisible: visible || animationEnabled,
            });
            this.animationState.transition('updateData');
        });
    }
    didCircleChange() {
        const r = this.radius;
        const cx = this.centerX;
        const cy = this.centerY;
        const cache = this.circleCache;
        if (!(r === cache.r && cx === cache.cx && cy === cache.cy)) {
            this.circleCache = { r, cx, cy };
            return true;
        }
        return false;
    }
    maybeRefreshNodeData() {
        return __awaiter(this, void 0, void 0, function* () {
            const circleChanged = this.didCircleChange();
            if (!circleChanged && !this.nodeDataRefresh)
                return;
            const [{ nodeData = [] } = {}] = yield this.createNodeData();
            this.nodeData = nodeData;
            this.nodeDataRefresh = false;
        });
    }
    getAxisInnerRadius() {
        const radiusAxis = this.axes[ChartAxisDirection.Y];
        return radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;
    }
    createNodeData() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { processedData, dataModel } = this;
            if (!processedData || !dataModel || !this.properties.isValid()) {
                return [];
            }
            const angleAxis = this.axes[ChartAxisDirection.X];
            const radiusAxis = this.axes[ChartAxisDirection.Y];
            const angleScale = angleAxis === null || angleAxis === void 0 ? void 0 : angleAxis.scale;
            const radiusScale = radiusAxis === null || radiusAxis === void 0 ? void 0 : radiusAxis.scale;
            if (!angleScale || !radiusScale) {
                return [];
            }
            const angleStartIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-start`).index;
            const angleEndIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-end`).index;
            const angleRawIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-raw`).index;
            let groupPaddingInner = 0;
            if (radiusAxis instanceof RadiusCategoryAxis) {
                groupPaddingInner = radiusAxis.groupPaddingInner;
            }
            const { groupScale } = this;
            const { index: groupIndex, visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
            groupScale.domain = Array.from({ length: visibleGroupCount }).map((_, i) => String(i));
            groupScale.range = [0, Math.abs((_a = radiusScale.bandwidth) !== null && _a !== void 0 ? _a : 0)];
            groupScale.paddingInner = visibleGroupCount > 1 ? groupPaddingInner : 0;
            const barWidth = groupScale.bandwidth >= 1 ? groupScale.bandwidth : groupScale.rawBandwidth;
            const radiusAxisReversed = (_b = this.axes[ChartAxisDirection.Y]) === null || _b === void 0 ? void 0 : _b.isReversed();
            const axisInnerRadius = radiusAxisReversed ? this.radius : this.getAxisInnerRadius();
            const axisOuterRadius = radiusAxisReversed ? this.getAxisInnerRadius() : this.radius;
            const axisTotalRadius = axisOuterRadius + axisInnerRadius;
            const { angleKey, radiusKey, angleName, radiusName, label } = this.properties;
            const getLabelNodeDatum = (datum, angleDatum, x, y) => {
                const labelText = this.getLabelText(label, { value: angleDatum, datum, angleKey, radiusKey, angleName, radiusName }, (value) => (isNumber(value) ? value.toFixed(2) : String(value)));
                if (labelText) {
                    return { x, y, text: labelText, textAlign: 'center', textBaseline: 'middle' };
                }
            };
            const nodeData = processedData.data.map((group, index) => {
                const { datum, keys, values } = group;
                const radiusDatum = keys[0];
                const angleDatum = values[angleRawIndex];
                const angleStartDatum = values[angleStartIndex];
                const angleEndDatum = values[angleEndIndex];
                let startAngle = Math.max(angleScale.convert(angleStartDatum), angleScale.range[0]);
                let endAngle = Math.min(angleScale.convert(angleEndDatum), angleScale.range[1]);
                if (startAngle > endAngle) {
                    [startAngle, endAngle] = [endAngle, startAngle];
                }
                if (angleDatum < 0) {
                    [startAngle, endAngle] = [endAngle, startAngle];
                }
                const dataRadius = axisTotalRadius - radiusScale.convert(radiusDatum);
                const innerRadius = dataRadius + groupScale.convert(String(groupIndex));
                const outerRadius = innerRadius + barWidth;
                const midRadius = (innerRadius + outerRadius) / 2;
                const midAngle = startAngle + angleBetween(startAngle, endAngle) / 2;
                const x = Math.cos(midAngle) * midRadius;
                const y = Math.sin(midAngle) * midRadius;
                const labelNodeDatum = this.properties.label.enabled
                    ? getLabelNodeDatum(datum, angleDatum, x, y)
                    : undefined;
                return {
                    series: this,
                    datum,
                    point: { x, y, size: 0 },
                    midPoint: { x, y },
                    label: labelNodeDatum,
                    angleValue: angleDatum,
                    radiusValue: radiusDatum,
                    innerRadius,
                    outerRadius,
                    startAngle,
                    endAngle,
                    index,
                };
            });
            return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
        });
    }
    update({ seriesRect }) {
        return __awaiter(this, void 0, void 0, function* () {
            const resize = this.checkResize(seriesRect);
            yield this.maybeRefreshNodeData();
            this.contentGroup.translationX = this.centerX;
            this.contentGroup.translationY = this.centerY;
            this.highlightGroup.translationX = this.centerX;
            this.highlightGroup.translationY = this.centerY;
            if (this.labelGroup) {
                this.labelGroup.translationX = this.centerX;
                this.labelGroup.translationY = this.centerY;
            }
            this.updateSectorSelection(this.itemSelection, false);
            this.updateSectorSelection(this.highlightSelection, true);
            this.updateLabels();
            if (resize) {
                this.animationState.transition('resize');
            }
            this.animationState.transition('update');
        });
    }
    updateSectorSelection(selection, highlight) {
        var _a, _b, _c, _d, _e;
        let selectionData = [];
        if (highlight) {
            const highlighted = (_a = this.ctx.highlightManager) === null || _a === void 0 ? void 0 : _a.getActiveHighlight();
            if ((highlighted === null || highlighted === void 0 ? void 0 : highlighted.datum) && highlighted.series === this) {
                selectionData = [highlighted];
            }
        }
        else {
            selectionData = this.nodeData;
        }
        const highlightedStyle = highlight ? this.properties.highlightStyle.item : undefined;
        const fill = (_b = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fill) !== null && _b !== void 0 ? _b : this.properties.fill;
        const fillOpacity = (_c = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.fillOpacity) !== null && _c !== void 0 ? _c : this.properties.fillOpacity;
        const stroke = (_d = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.stroke) !== null && _d !== void 0 ? _d : this.properties.stroke;
        const strokeOpacity = this.properties.strokeOpacity;
        const strokeWidth = (_e = highlightedStyle === null || highlightedStyle === void 0 ? void 0 : highlightedStyle.strokeWidth) !== null && _e !== void 0 ? _e : this.properties.strokeWidth;
        const idFn = (datum) => datum.radiusValue;
        selection.update(selectionData, undefined, idFn).each((node, datum) => {
            var _a, _b, _c, _d, _e;
            const format = this.properties.formatter
                ? this.ctx.callbackCache.call(this.properties.formatter, {
                    datum,
                    fill,
                    stroke,
                    strokeWidth,
                    highlighted: highlight,
                    angleKey: this.properties.angleKey,
                    radiusKey: this.properties.radiusKey,
                    seriesId: this.id,
                })
                : undefined;
            node.fill = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill;
            node.fillOpacity = (_b = format === null || format === void 0 ? void 0 : format.fillOpacity) !== null && _b !== void 0 ? _b : fillOpacity;
            node.stroke = (_c = format === null || format === void 0 ? void 0 : format.stroke) !== null && _c !== void 0 ? _c : stroke;
            node.strokeOpacity = strokeOpacity;
            node.strokeWidth = (_d = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _d !== void 0 ? _d : strokeWidth;
            node.lineDash = this.properties.lineDash;
            node.lineJoin = 'round';
            node.inset = stroke != null ? ((_e = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _e !== void 0 ? _e : strokeWidth) / 2 : 0;
            if (highlight) {
                node.startAngle = datum.startAngle;
                node.endAngle = datum.endAngle;
                node.innerRadius = datum.innerRadius;
                node.outerRadius = datum.outerRadius;
            }
        });
    }
    updateLabels() {
        const { label } = this.properties;
        this.labelSelection.update(this.nodeData).each((node, datum) => {
            if (label.enabled && datum.label) {
                node.x = datum.label.x;
                node.y = datum.label.y;
                node.fill = label.color;
                node.fontFamily = label.fontFamily;
                node.fontSize = label.fontSize;
                node.fontStyle = label.fontStyle;
                node.fontWeight = label.fontWeight;
                node.text = datum.label.text;
                node.textAlign = datum.label.textAlign;
                node.textBaseline = datum.label.textBaseline;
                node.visible = true;
            }
            else {
                node.visible = false;
            }
        });
    }
    getBarTransitionFunctions() {
        var _a;
        const angleScale = (_a = this.axes[ChartAxisDirection.X]) === null || _a === void 0 ? void 0 : _a.scale;
        let axisZeroAngle = 0;
        if (!angleScale) {
            return prepareRadialBarSeriesAnimationFunctions(axisZeroAngle);
        }
        const d0 = Math.min(angleScale.domain[0], angleScale.domain[1]);
        const d1 = Math.max(angleScale.domain[0], angleScale.domain[1]);
        if (d0 <= 0 && d1 >= 0) {
            axisZeroAngle = angleScale.convert(0);
        }
        return prepareRadialBarSeriesAnimationFunctions(axisZeroAngle);
    }
    animateEmptyUpdateReady() {
        const { labelSelection } = this;
        const fns = this.getBarTransitionFunctions();
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [this.itemSelection], fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, [labelSelection]);
    }
    animateClearingUpdateEmpty() {
        const { itemSelection } = this;
        const { animationManager } = this.ctx;
        const fns = this.getBarTransitionFunctions();
        motion.fromToMotion(this.id, 'datums', animationManager, [itemSelection], fns);
        seriesLabelFadeOutAnimation(this, 'labels', animationManager, [this.labelSelection]);
    }
    getTooltipHtml(nodeDatum) {
        var _a;
        const { id: seriesId, axes, dataModel } = this;
        const { angleKey, angleName, radiusKey, radiusName, fill, stroke, strokeWidth, formatter, tooltip } = this.properties;
        const { angleValue, radiusValue, datum } = nodeDatum;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        if (!this.properties.isValid() || !(xAxis && yAxis && isNumber(angleValue)) || !dataModel) {
            return '';
        }
        const angleString = xAxis.formatDatum(angleValue);
        const radiusString = yAxis.formatDatum(radiusValue);
        const title = sanitizeHtml(angleName);
        const content = sanitizeHtml(`${radiusString}: ${angleString}`);
        const { fill: color } = (_a = (formatter &&
            this.ctx.callbackCache.call(formatter, {
                datum,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                angleKey,
                radiusKey,
                seriesId,
            }))) !== null && _a !== void 0 ? _a : { fill };
        return tooltip.toTooltipHtml({ title, backgroundColor: fill, content }, { seriesId, datum, color, title, angleKey, radiusKey, angleName, radiusName });
    }
    getLegendData(legendType) {
        var _a;
        if (!((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || !this.properties.isValid() || legendType !== 'category') {
            return [];
        }
        const { angleKey, angleName, fill, stroke, fillOpacity, strokeOpacity, strokeWidth, visible } = this.properties;
        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: angleKey,
                seriesId: this.id,
                enabled: visible,
                label: {
                    text: angleName !== null && angleName !== void 0 ? angleName : angleKey,
                },
                marker: {
                    fill: fill !== null && fill !== void 0 ? fill : 'rgba(0, 0, 0, 0)',
                    stroke: stroke !== null && stroke !== void 0 ? stroke : 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity !== null && fillOpacity !== void 0 ? fillOpacity : 1,
                    strokeOpacity: strokeOpacity !== null && strokeOpacity !== void 0 ? strokeOpacity : 1,
                    strokeWidth,
                },
            },
        ];
    }
    onLegendItemClick(event) {
        const { enabled, itemId, series } = event;
        if (series.id === this.id) {
            this.toggleSeriesItem(itemId, enabled);
        }
    }
    onLegendItemDoubleClick(event) {
        const { enabled, itemId, series, numVisibleItems } = event;
        const wasClicked = series.id === this.id;
        const newEnabled = wasClicked || (enabled && numVisibleItems === 1);
        this.toggleSeriesItem(itemId, newEnabled);
    }
    computeLabelsBBox() {
        return null;
    }
    getStackId() {
        var _a, _b;
        const groupIndex = (_b = (_a = this.seriesGrouping) === null || _a === void 0 ? void 0 : _a.groupIndex) !== null && _b !== void 0 ? _b : this.id;
        return `radialBar-stack-${groupIndex}-xValues`;
    }
}
RadialBarSeries.className = 'RadialBarSeries';
RadialBarSeries.type = 'radial-bar';
//# sourceMappingURL=radialBarSeries.js.map