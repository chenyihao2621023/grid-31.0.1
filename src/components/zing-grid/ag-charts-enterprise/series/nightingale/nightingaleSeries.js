import { _Scene, } from '@/components/zing-grid/ag-charts-community/main.js';
import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBaseProperties } from '../radial-column/radialColumnSeriesBaseProperties';
import { prepareNightingaleAnimationFunctions, resetNightingaleSelectionFn } from './nightingaleUtil';
const { Sector } = _Scene;
export class NightingaleSeries extends RadialColumnSeriesBase {
    // TODO: Enable once the options contract has been revisited
    // @Validate(POSITIVE_NUMBER)
    // sectorSpacing = 1;
    constructor(moduleCtx) {
        super(moduleCtx, { animationResetFns: { item: resetNightingaleSelectionFn } });
        this.properties = new RadialColumnSeriesBaseProperties();
    }
    getStackId() {
        var _a, _b;
        const groupIndex = (_b = (_a = this.seriesGrouping) === null || _a === void 0 ? void 0 : _a.groupIndex) !== null && _b !== void 0 ? _b : this.id;
        return `nightingale-stack-${groupIndex}-yValues`;
    }
    nodeFactory() {
        return new Sector();
    }
    updateItemPath(node, datum, highlight, _format) {
        node.centerX = 0;
        node.centerY = 0;
        if (highlight) {
            node.innerRadius = datum.innerRadius;
            node.outerRadius = datum.outerRadius;
            node.startAngle = datum.startAngle;
            node.endAngle = datum.endAngle;
        }
        // TODO: Enable once the options contract has been revisited
        // const appliedHighlightStyle = highlight ? this.highlightStyle.item : undefined;
        // const hasStroke = (format?.stroke ?? appliedHighlightStyle?.stroke ?? this.stroke) != null;
        // const strokeWidth = hasStroke
        //     ? format?.strokeWidth ?? (highlight ? appliedHighlightStyle?.strokeWidth : undefined) ?? this.strokeWidth
        //     : 0;
        // node.inset = (this.sectorSpacing + strokeWidth) / 2;
    }
    getColumnTransitionFunctions() {
        const axisZeroRadius = this.isRadiusAxisReversed() ? this.radius : this.getAxisInnerRadius();
        return prepareNightingaleAnimationFunctions(axisZeroRadius);
    }
}
NightingaleSeries.className = 'NightingaleSeries';
NightingaleSeries.type = 'nightingale';
//# sourceMappingURL=nightingaleSeries.js.map