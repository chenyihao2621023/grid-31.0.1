import { AgErrorBarSupportedSeriesTypes, _ModuleSupport, _Scene } from '@/components/zing-grid/zing-charts-community/main.js';
import { ErrorBarGroup, ErrorBarNode } from './errorBarNode';
import { ErrorBarProperties } from './errorBarProperties';
const { isDefined, fixNumericExtent, mergeDefaults, valueProperty, ChartAxisDirection } = _ModuleSupport;
function toErrorBoundCartesianSeries(ctx) {
    for (const supportedType of AgErrorBarSupportedSeriesTypes) {
        if (supportedType == ctx.series.type) {
            return ctx.series;
        }
    }
    throw new Error(`AG Charts - unsupported series type '${ctx.series.type}', error bars supported series types: ${AgErrorBarSupportedSeriesTypes.join(', ')}`);
}
export class ErrorBars extends _ModuleSupport.BaseModuleInstance {
    constructor(ctx) {
        super();
        this.properties = new ErrorBarProperties();
        const series = toErrorBoundCartesianSeries(ctx);
        const { annotationGroup, annotationSelections } = series;
        this.cartesianSeries = series;
        this.groupNode = new ErrorBarGroup({
            name: `${annotationGroup.id}-errorBars`,
            zIndex: _ModuleSupport.Layers.SERIES_LAYER_ZINDEX,
            zIndexSubOrder: series.getGroupZIndexSubOrder('annotation'),
        });
        annotationGroup.appendChild(this.groupNode);
        this.selection = _Scene.Selection.select(this.groupNode, () => this.errorBarFactory());
        annotationSelections.add(this.selection);
        this.destroyFns.push(series.addListener('data-processed', (e) => this.onDataProcessed(e)), series.addListener('data-update', (e) => this.onDataUpdate(e)), series.addListener('visibility-changed', (e) => this.onToggleSeriesItem(e)), ctx.highlightManager.addListener('highlight-change', (event) => this.onHighlightChange(event)), () => annotationGroup.removeChild(this.groupNode), () => annotationSelections.delete(this.selection));
    }
    getPropertyDefinitions(opts) {
        const props = [];
        const { cartesianSeries } = this;
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, xErrorsID, yErrorsID } = this.getMaybeFlippedKeys();
        const { isContinuousX, isContinuousY } = opts;
        if (yLowerKey !== undefined && yUpperKey !== undefined) {
            props.push(valueProperty(cartesianSeries, yLowerKey, isContinuousY, { id: yErrorsID }), valueProperty(cartesianSeries, yUpperKey, isContinuousY, { id: yErrorsID }));
        }
        if (xLowerKey !== undefined && xUpperKey !== undefined) {
            props.push(valueProperty(cartesianSeries, xLowerKey, isContinuousX, { id: xErrorsID }), valueProperty(cartesianSeries, xUpperKey, isContinuousX, { id: xErrorsID }));
        }
        return props;
    }
    onDataProcessed(event) {
        this.dataModel = event.dataModel;
        this.processedData = event.processedData;
    }
    getDomain(direction) {
        const { xLowerKey, xUpperKey, xErrorsID, yLowerKey, yUpperKey, yErrorsID } = this.getMaybeFlippedKeys();
        const hasAxisErrors = direction === ChartAxisDirection.X
            ? isDefined(xLowerKey) && isDefined(xUpperKey)
            : isDefined(yLowerKey) && isDefined(yUpperKey);
        if (hasAxisErrors) {
            const { dataModel, processedData, cartesianSeries } = this;
            const axis = cartesianSeries.axes[direction];
            const id = { x: xErrorsID, y: yErrorsID }[direction];
            if (dataModel !== undefined && processedData !== undefined) {
                const domain = dataModel.getDomain(cartesianSeries, id, 'value', processedData);
                return fixNumericExtent(domain, axis);
            }
        }
        return [];
    }
    onDataUpdate(event) {
        this.dataModel = event.dataModel;
        this.processedData = event.processedData;
        if (isDefined(event.dataModel) && isDefined(event.processedData)) {
            this.createNodeData();
            this.update();
        }
    }
    getNodeData() {
        const { contextNodeData } = this.cartesianSeries;
        if (contextNodeData.length > 0) {
            return contextNodeData[0].nodeData;
        }
    }
    createNodeData() {
        var _a, _b;
        const nodeData = this.getNodeData();
        const xScale = (_a = this.cartesianSeries.axes[ChartAxisDirection.X]) === null || _a === void 0 ? void 0 : _a.scale;
        const yScale = (_b = this.cartesianSeries.axes[ChartAxisDirection.Y]) === null || _b === void 0 ? void 0 : _b.scale;
        if (!xScale || !yScale || !nodeData) {
            return;
        }
        for (let i = 0; i < nodeData.length; i++) {
            const { midPoint, xLower, xUpper, yLower, yUpper } = this.getDatum(nodeData, i);
            if (midPoint !== undefined) {
                let xBar, yBar;
                if (isDefined(xLower) && isDefined(xUpper)) {
                    xBar = {
                        lowerPoint: { x: this.convert(xScale, xLower), y: midPoint.y },
                        upperPoint: { x: this.convert(xScale, xUpper), y: midPoint.y },
                    };
                }
                if (isDefined(yLower) && isDefined(yUpper)) {
                    yBar = {
                        lowerPoint: { x: midPoint.x, y: this.convert(yScale, yLower) },
                        upperPoint: { x: midPoint.x, y: this.convert(yScale, yUpper) },
                    };
                }
                nodeData[i].xBar = xBar;
                nodeData[i].yBar = yBar;
            }
        }
    }
    getMaybeFlippedKeys() {
        let { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this.properties;
        let [xErrorsID, yErrorsID] = ['xValue-errors', 'yValue-errors'];
        if (this.cartesianSeries.shouldFlipXY()) {
            [xLowerKey, yLowerKey] = [yLowerKey, xLowerKey];
            [xUpperKey, yUpperKey] = [yUpperKey, xUpperKey];
            [xErrorsID, yErrorsID] = [yErrorsID, xErrorsID];
        }
        return { xLowerKey, xUpperKey, xErrorsID, yLowerKey, yUpperKey, yErrorsID };
    }
    getDatum(nodeData, datumIndex) {
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = this.getMaybeFlippedKeys();
        const datum = nodeData[datumIndex];
        return {
            midPoint: datum.midPoint,
            xLower: datum.datum[xLowerKey !== null && xLowerKey !== void 0 ? xLowerKey : ''],
            xUpper: datum.datum[xUpperKey !== null && xUpperKey !== void 0 ? xUpperKey : ''],
            yLower: datum.datum[yLowerKey !== null && yLowerKey !== void 0 ? yLowerKey : ''],
            yUpper: datum.datum[yUpperKey !== null && yUpperKey !== void 0 ? yUpperKey : ''],
        };
    }
    convert(scale, value) {
        var _a;
        const offset = ((_a = scale.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2;
        return scale.convert(value) + offset;
    }
    update() {
        const nodeData = this.getNodeData();
        if (nodeData !== undefined) {
            this.selection.update(nodeData);
            this.selection.each((node, datum, i) => this.updateNode(node, datum, i));
        }
    }
    updateNode(node, datum, _index) {
        node.datum = datum;
        node.update(this.getDefaultStyle(), this.properties, false);
        node.updateBBoxes();
    }
    pickNodeExact(point) {
        const { x, y } = this.groupNode.transformPoint(point.x, point.y);
        const node = this.groupNode.pickNode(x, y);
        if (node !== undefined) {
            return { datum: node.datum, distanceSquared: 0 };
        }
    }
    pickNodeNearest(point) {
        return this.groupNode.nearestSquared(point);
    }
    pickNodeMainAxisFirst(point) {
        return this.groupNode.nearestSquared(point);
    }
    getTooltipParams() {
        const { xLowerKey, xUpperKey, yLowerKey, yUpperKey, xLowerName = xLowerKey, xUpperName = xUpperKey, yLowerName = yLowerKey, yUpperName = yUpperKey, } = this.properties;
        return { xLowerKey, xLowerName, xUpperKey, xUpperName, yLowerKey, yLowerName, yUpperKey, yUpperName };
    }
    onToggleSeriesItem(event) {
        this.groupNode.visible = event.enabled;
    }
    makeStyle(baseStyle) {
        return {
            visible: baseStyle.visible,
            lineDash: baseStyle.lineDash,
            lineDashOffset: baseStyle.lineDashOffset,
            stroke: baseStyle.stroke,
            strokeWidth: baseStyle.strokeWidth,
            strokeOpacity: baseStyle.strokeOpacity,
            cap: mergeDefaults(this.properties.cap, baseStyle),
        };
    }
    getDefaultStyle() {
        return this.makeStyle(this.getWhiskerProperties());
    }
    getHighlightStyle() {
        // FIXME - at some point we should allow customising this
        return this.makeStyle(this.getWhiskerProperties());
    }
    restyleHighlightChange(highlightChange, style, highlighted) {
        const nodeData = this.getNodeData();
        if (nodeData === undefined)
            return;
        // Search for the ErrorBarNode that matches this highlight change. This
        // isn't a good solution in terms of performance. However, it's assumed
        // that the typical use case for error bars includes few data points
        // (because the chart will get cluttered very quickly if there are many
        // data points with error bars).
        for (let i = 0; i < nodeData.length; i++) {
            if (highlightChange === nodeData[i]) {
                this.selection.nodes()[i].update(style, this.properties, highlighted);
                break;
            }
        }
    }
    onHighlightChange(event) {
        const { previousHighlight, currentHighlight } = event;
        if ((currentHighlight === null || currentHighlight === void 0 ? void 0 : currentHighlight.series) === this.cartesianSeries) {
            // Highlight this node:
            this.restyleHighlightChange(currentHighlight, this.getHighlightStyle(), true);
        }
        if ((previousHighlight === null || previousHighlight === void 0 ? void 0 : previousHighlight.series) === this.cartesianSeries) {
            // Remove node highlight:
            this.restyleHighlightChange(previousHighlight, this.getDefaultStyle(), false);
        }
        this.groupNode.opacity = this.cartesianSeries.getOpacity();
    }
    errorBarFactory() {
        return new ErrorBarNode();
    }
    getWhiskerProperties() {
        const { stroke, strokeWidth, visible, strokeOpacity, lineDash, lineDashOffset } = this.properties;
        return { stroke, strokeWidth, visible, strokeOpacity, lineDash, lineDashOffset };
    }
}
//# sourceMappingURL=errorBar.js.map