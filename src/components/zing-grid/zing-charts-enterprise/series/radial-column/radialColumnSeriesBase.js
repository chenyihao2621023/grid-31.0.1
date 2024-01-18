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
import { AngleCategoryAxis } from '../../axes/angle-category/angleCategoryAxis';
const { isDefined, ChartAxisDirection, PolarAxis, diff, fixNumericExtent, groupAccumulativeValueProperty, keyProperty, normaliseGroupTo, resetLabelFn, seriesLabelFadeInAnimation, seriesLabelFadeOutAnimation, valueProperty, animationValidation, } = _ModuleSupport;
const { BandScale } = _Scale;
const { motion } = _Scene;
const { isNumber, normalizeAngle360, sanitizeHtml } = _Util;
class RadialColumnSeriesNodeClickEvent extends _ModuleSupport.SeriesNodeClickEvent {
    constructor(type, nativeEvent, datum, series) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.properties.angleKey;
        this.radiusKey = series.properties.radiusKey;
    }
}
export class RadialColumnSeriesBase extends _ModuleSupport.PolarSeries {
    constructor(moduleCtx, { animationResetFns, }) {
        super({
            moduleCtx,
            useLabelLayer: true,
            canHaveAxes: true,
            animationResetFns: Object.assign(Object.assign({}, animationResetFns), { label: resetLabelFn }),
        });
        this.NodeClickEvent = RadialColumnSeriesNodeClickEvent;
        this.nodeData = [];
        this.groupScale = new BandScale();
        this.circleCache = { r: 0, cx: 0, cy: 0 };
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
            return dataModel.getDomain(this, 'angleValue', 'key', processedData);
        }
        else {
            const radiusAxis = axes[ChartAxisDirection.Y];
            const yExtent = dataModel.getDomain(this, 'radiusValue-end', 'value', processedData);
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return fixNumericExtent(fixedYExtent, radiusAxis);
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
            if (animationEnabled && this.processedData) {
                extraProps.push(diff(this.processedData));
            }
            if (animationEnabled) {
                extraProps.push(animationValidation(this));
            }
            const visibleProps = visible || !animationEnabled ? {} : { forceValue: 0 };
            yield this.requestDataModel(dataController, (_a = this.data) !== null && _a !== void 0 ? _a : [], {
                props: [
                    keyProperty(this, angleKey, false, { id: 'angleValue' }),
                    valueProperty(this, radiusKey, true, Object.assign({ id: 'radiusValue-raw', invalidValue: null }, visibleProps)),
                    ...groupAccumulativeValueProperty(this, radiusKey, true, 'normal', 'current', Object.assign({ id: `radiusValue-end`, invalidValue: null, groupId: stackGroupId }, visibleProps)),
                    ...groupAccumulativeValueProperty(this, radiusKey, true, 'trailing', 'current', Object.assign({ id: `radiusValue-start`, invalidValue: null, groupId: stackGroupTrailingId }, visibleProps)),
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
    isRadiusAxisReversed() {
        var _a;
        return (_a = this.axes[ChartAxisDirection.Y]) === null || _a === void 0 ? void 0 : _a.isReversed();
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { processedData, dataModel, groupScale } = this;
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
            const radiusStartIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-start`).index;
            const radiusEndIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-end`).index;
            const radiusRawIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-raw`).index;
            let groupPaddingInner = 0;
            let groupPaddingOuter = 0;
            if (angleAxis instanceof AngleCategoryAxis) {
                groupPaddingInner = angleAxis.groupPaddingInner;
                groupPaddingOuter = angleAxis.paddingInner;
            }
            const groupAngleStep = (_a = angleScale.bandwidth) !== null && _a !== void 0 ? _a : 0;
            const paddedGroupAngleStep = groupAngleStep * (1 - groupPaddingOuter);
            const { index: groupIndex, visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
            groupScale.domain = Array.from({ length: visibleGroupCount }).map((_, i) => String(i));
            groupScale.range = [-paddedGroupAngleStep / 2, paddedGroupAngleStep / 2];
            groupScale.paddingInner = visibleGroupCount > 1 ? groupPaddingInner : 0;
            const radiusAxisReversed = this.isRadiusAxisReversed();
            const axisInnerRadius = radiusAxisReversed ? this.radius : this.getAxisInnerRadius();
            const axisOuterRadius = radiusAxisReversed ? this.getAxisInnerRadius() : this.radius;
            const axisTotalRadius = axisOuterRadius + axisInnerRadius;
            const { angleKey, radiusKey, angleName, radiusName, label } = this.properties;
            const getLabelNodeDatum = (datum, radiusDatum, x, y) => {
                const labelText = this.getLabelText(label, { value: radiusDatum, datum, angleKey, radiusKey, angleName, radiusName }, (value) => (isNumber(value) ? value.toFixed(2) : String(value)));
                if (labelText) {
                    return { x, y, text: labelText, textAlign: 'center', textBaseline: 'middle' };
                }
            };
            const nodeData = processedData.data.map((group, index) => {
                const { datum, keys, values } = group;
                const angleDatum = keys[0];
                const radiusDatum = values[radiusRawIndex];
                const innerRadiusDatum = values[radiusStartIndex];
                const outerRadiusDatum = values[radiusEndIndex];
                const groupAngle = angleScale.convert(angleDatum);
                const startAngle = normalizeAngle360(groupAngle + groupScale.convert(String(groupIndex)));
                const endAngle = normalizeAngle360(startAngle + groupScale.bandwidth);
                const angle = startAngle + groupScale.bandwidth / 2;
                const innerRadius = axisTotalRadius - radiusScale.convert(innerRadiusDatum);
                const outerRadius = axisTotalRadius - radiusScale.convert(outerRadiusDatum);
                const midRadius = (innerRadius + outerRadius) / 2;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const x = cos * midRadius;
                const y = sin * midRadius;
                const labelNodeDatum = this.properties.label.enabled
                    ? getLabelNodeDatum(datum, radiusDatum, x, y)
                    : undefined;
                const columnWidth = this.getColumnWidth(startAngle, endAngle);
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
                    axisInnerRadius,
                    axisOuterRadius,
                    columnWidth,
                    index,
                };
            });
            return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
        });
    }
    getColumnWidth(_startAngle, _endAngle) {
        return NaN;
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
        const idFn = (datum) => datum.angleValue;
        selection.update(selectionData, undefined, idFn).each((node, datum) => {
            var _a, _b, _c, _d;
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
            this.updateItemPath(node, datum, highlight, format);
            node.fill = (_a = format === null || format === void 0 ? void 0 : format.fill) !== null && _a !== void 0 ? _a : fill;
            node.fillOpacity = (_b = format === null || format === void 0 ? void 0 : format.fillOpacity) !== null && _b !== void 0 ? _b : fillOpacity;
            node.stroke = (_c = format === null || format === void 0 ? void 0 : format.stroke) !== null && _c !== void 0 ? _c : stroke;
            node.strokeOpacity = strokeOpacity;
            node.strokeWidth = (_d = format === null || format === void 0 ? void 0 : format.strokeWidth) !== null && _d !== void 0 ? _d : strokeWidth;
            node.lineDash = this.properties.lineDash;
            node.lineJoin = 'round';
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
    animateEmptyUpdateReady() {
        const { labelSelection } = this;
        const fns = this.getColumnTransitionFunctions();
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [this.itemSelection], fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, [labelSelection]);
    }
    animateClearingUpdateEmpty() {
        const { itemSelection } = this;
        const { animationManager } = this.ctx;
        const fns = this.getColumnTransitionFunctions();
        motion.fromToMotion(this.id, 'datums', animationManager, [itemSelection], fns);
        seriesLabelFadeOutAnimation(this, 'labels', animationManager, [this.labelSelection]);
    }
    getTooltipHtml(nodeDatum) {
        var _a;
        const { id: seriesId, axes, dataModel } = this;
        const { angleKey, radiusKey, angleName, radiusName, fill, stroke, strokeWidth, formatter, tooltip } = this.properties;
        const { angleValue, radiusValue, datum } = nodeDatum;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        if (!this.properties.isValid() || !(xAxis && yAxis && isNumber(radiusValue)) || !dataModel) {
            return '';
        }
        const angleString = xAxis.formatDatum(angleValue);
        const radiusString = yAxis.formatDatum(radiusValue);
        const title = sanitizeHtml(radiusName);
        const content = sanitizeHtml(`${angleString}: ${radiusString}`);
        const { fill: color } = (_a = (formatter &&
            this.ctx.callbackCache.call(formatter, {
                seriesId,
                datum,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                angleKey,
                radiusKey,
            }))) !== null && _a !== void 0 ? _a : { fill };
        return tooltip.toTooltipHtml({ title, backgroundColor: fill, content }, { seriesId, datum, color, title, angleKey, radiusKey, angleName, radiusName });
    }
    getLegendData(legendType) {
        var _a;
        if (!((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || !this.properties.isValid() || legendType !== 'category') {
            return [];
        }
        const { radiusKey, radiusName, fill, stroke, fillOpacity, strokeOpacity, strokeWidth, visible } = this.properties;
        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: radiusKey,
                seriesId: this.id,
                enabled: visible,
                label: {
                    text: radiusName !== null && radiusName !== void 0 ? radiusName : radiusKey,
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
}
//# sourceMappingURL=radialColumnSeriesBase.js.map