var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BBox } from '../scene/bbox';
import { Chart } from './chart';
export class HierarchyChart extends Chart {
    constructor(specialOverrides, resources) {
        super(specialOverrides, resources);
        this._data = {};
    }
    performLayout() {
        const _super = Object.create(null, {
            performLayout: { get: () => super.performLayout }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const shrinkRect = yield _super.performLayout.call(this);
            const { seriesArea: { padding }, seriesRoot, } = this;
            const fullSeriesRect = shrinkRect.clone();
            shrinkRect.shrink(padding.left, 'left');
            shrinkRect.shrink(padding.top, 'top');
            shrinkRect.shrink(padding.right, 'right');
            shrinkRect.shrink(padding.bottom, 'bottom');
            this.seriesRect = shrinkRect;
            this.animationRect = shrinkRect;
            this.hoverRect = shrinkRect;
            seriesRoot.translationX = Math.floor(shrinkRect.x);
            seriesRoot.translationY = Math.floor(shrinkRect.y);
            yield Promise.all(this.series.map((series) => __awaiter(this, void 0, void 0, function* () {
                yield series.update({ seriesRect: shrinkRect }); // this has to happen after the `updateAxes` call
            })));
            seriesRoot.visible = this.series[0].visible;
            seriesRoot.setClipRectInGroupCoordinateSpace(new BBox(shrinkRect.x, shrinkRect.y, shrinkRect.width, shrinkRect.height));
            this.layoutService.dispatchLayoutComplete({
                type: 'layout-complete',
                chart: { width: this.scene.width, height: this.scene.height },
                clipSeries: false,
                series: { rect: fullSeriesRect, paddedRect: shrinkRect, visible: true },
                axes: [],
            });
            return shrinkRect;
        });
    }
}
HierarchyChart.className = 'HierarchyChart';
HierarchyChart.type = 'hierarchy';
//# sourceMappingURL=hierarchyChart.js.map