import { Overlay } from './overlay';
export class ChartOverlays {
    constructor(parent) {
        this.noData = new Overlay('zing-chart-no-data-overlay', parent);
        this.noVisibleSeries = new Overlay('zing-chart-no-visible-series', parent);
        this.noVisibleSeries.text = 'No visible series';
    }
    destroy() {
        this.noData.hide();
        this.noVisibleSeries.hide();
    }
}
