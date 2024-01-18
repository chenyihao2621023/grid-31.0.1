import { Overlay } from './overlay';
export class ChartOverlays {
    constructor(parent) {
        this.noData = new Overlay('ag-chart-no-data-overlay', parent);
        this.noVisibleSeries = new Overlay('ag-chart-no-visible-series', parent);
        this.noVisibleSeries.text = 'No visible series';
    }
    destroy() {
        this.noData.hide();
        this.noVisibleSeries.hide();
    }
}
//# sourceMappingURL=chartOverlays.js.map