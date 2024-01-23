import { RadarSeries } from '../radar/radarSeries';
export class RadarLineSeries extends RadarSeries {
    updatePathSelections() {
        this.lineSelection.update(this.visible ? [true] : []);
    }
}
RadarLineSeries.className = 'RadarLineSeries';
RadarLineSeries.type = 'radar-line';
