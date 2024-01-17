import { _Scene } from "@/components/zing-grid/ag-charts-community/main.js";
// import { _Scene } from "ag-charts-enterprise";
import { MiniChartWithAxes } from "../miniChartWithAxes";
export class MiniBar extends MiniChartWithAxes {
    constructor(container, fills, strokes) {
        super(container, "groupedBarTooltip");
        const padding = this.padding;
        const size = this.size;
        const data = [2, 3, 4];
        const yScale = new _Scene.BandScale();
        yScale.domain = [0, 1, 2];
        yScale.range = [padding, size - padding];
        yScale.paddingInner = 0.3;
        yScale.paddingOuter = 0.3;
        const xScale = new _Scene.LinearScale();
        xScale.domain = [0, 4];
        xScale.range = [size - padding, padding];
        const bottom = xScale.convert(0);
        const height = yScale.bandwidth;
        this.bars = data.map((datum, i) => {
            const rect = new _Scene.Rect();
            rect.x = padding;
            rect.y = yScale.convert(i);
            rect.width = bottom - xScale.convert(datum);
            rect.height = height;
            rect.strokeWidth = 1;
            rect.crisp = true;
            return rect;
        });
        this.updateColors(fills, strokes);
        this.root.append(this.bars);
    }
    updateColors(fills, strokes) {
        this.bars.forEach((bar, i) => {
            bar.fill = fills[i];
            bar.stroke = strokes[i];
        });
    }
}
MiniBar.chartType = 'groupedBar';
//# sourceMappingURL=miniBar.js.map