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
import { Padding } from '../util/padding';
import { PolarAxis } from './axis/polarAxis';
import { Chart } from './chart';
import { ChartAxisDirection } from './chartAxisDirection';
import { Layers } from './layers';
import { PieSeries } from './series/polar/pieSeries';
import { PolarSeries } from './series/polar/polarSeries';
export class PolarChart extends Chart {
    constructor(specialOverrides, resources) {
        super(specialOverrides, resources);
        this.padding = new Padding(40);
        this.axisGroup.zIndex = Layers.AXIS_FOREGROUND_ZINDEX;
    }
    performLayout() {
        const _super = Object.create(null, {
            performLayout: { get: () => super.performLayout }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const shrinkRect = yield _super.performLayout.call(this);
            const fullSeriesRect = shrinkRect.clone();
            this.computeSeriesRect(shrinkRect);
            yield this.computeCircle(shrinkRect);
            this.axes.forEach((axis) => axis.update());
            this.hoverRect = shrinkRect;
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
    updateAxes(cx, cy, radius) {
        var _a, _b;
        const angleAxis = this.axes.find((axis) => axis.direction === ChartAxisDirection.X);
        const radiusAxis = this.axes.find((axis) => axis.direction === ChartAxisDirection.Y);
        if (!(angleAxis instanceof PolarAxis) || !(radiusAxis instanceof PolarAxis)) {
            return;
        }
        const angleScale = angleAxis.scale;
        const angles = (_a = angleScale.ticks) === null || _a === void 0 ? void 0 : _a.call(angleScale).map((value) => angleScale.convert(value));
        const innerRadiusRatio = radiusAxis.innerRadiusRatio;
        angleAxis.innerRadiusRatio = innerRadiusRatio;
        (_b = angleAxis.computeRange) === null || _b === void 0 ? void 0 : _b.call(angleAxis);
        angleAxis.gridLength = radius;
        radiusAxis.gridAngles = angles;
        radiusAxis.gridRange = angleAxis.range;
        radiusAxis.range = [radius, radius * innerRadiusRatio];
        [angleAxis, radiusAxis].forEach((axis) => {
            axis.translation.x = cx;
            axis.translation.y = cy;
            axis.calculateLayout();
        });
    }
    computeSeriesRect(shrinkRect) {
        const { seriesArea: { padding }, } = this;
        shrinkRect.shrink(padding.left, 'left');
        shrinkRect.shrink(padding.top, 'top');
        shrinkRect.shrink(padding.right, 'right');
        shrinkRect.shrink(padding.bottom, 'bottom');
        this.seriesRect = shrinkRect;
        this.animationRect = shrinkRect;
    }
    computeCircle(seriesBox) {
        return __awaiter(this, void 0, void 0, function* () {
            const polarSeries = this.series.filter((series) => {
                return series instanceof PolarSeries;
            });
            const polarAxes = this.axes.filter((axis) => {
                return axis instanceof PolarAxis;
            });
            const setSeriesCircle = (cx, cy, r) => {
                this.updateAxes(cx, cy, r);
                polarSeries.forEach((series) => {
                    series.centerX = cx;
                    series.centerY = cy;
                    series.radius = r;
                });
                const pieSeries = polarSeries.filter((s) => s instanceof PieSeries);
                if (pieSeries.length > 1) {
                    const innerRadii = pieSeries
                        .map((series) => {
                        const innerRadius = series.getInnerRadius();
                        return { series, innerRadius };
                    })
                        .sort((a, b) => a.innerRadius - b.innerRadius);
                    innerRadii[innerRadii.length - 1].series.surroundingRadius = undefined;
                    for (let i = 0; i < innerRadii.length - 1; i++) {
                        innerRadii[i].series.surroundingRadius = innerRadii[i + 1].innerRadius;
                    }
                }
            };
            const centerX = seriesBox.x + seriesBox.width / 2;
            const centerY = seriesBox.y + seriesBox.height / 2;
            const initialRadius = Math.max(0, Math.min(seriesBox.width, seriesBox.height) / 2);
            let radius = initialRadius;
            setSeriesCircle(centerX, centerY, radius);
            const shake = ({ hideWhenNecessary = false } = {}) => __awaiter(this, void 0, void 0, function* () {
                const labelBoxes = [];
                for (const series of [...polarAxes, ...polarSeries]) {
                    const box = yield series.computeLabelsBBox({ hideWhenNecessary }, seriesBox);
                    if (box) {
                        labelBoxes.push(box);
                    }
                }
                if (labelBoxes.length === 0) {
                    setSeriesCircle(centerX, centerY, initialRadius);
                    return;
                }
                const labelBox = BBox.merge(labelBoxes);
                const refined = this.refineCircle(labelBox, radius, seriesBox);
                setSeriesCircle(refined.centerX, refined.centerY, refined.radius);
                if (refined.radius === radius) {
                    return;
                }
                radius = refined.radius;
            });
            yield shake(); // Initial attempt
            yield shake(); // Precise attempt
            yield shake(); // Just in case
            yield shake({ hideWhenNecessary: true }); // Hide unnecessary labels
            yield shake({ hideWhenNecessary: true }); // Final result
            return { radius, centerX, centerY };
        });
    }
    refineCircle(labelsBox, radius, seriesBox) {
        const minCircleRatio = 0.5; // Prevents reduced circle to be too small
        const circleLeft = -radius;
        const circleTop = -radius;
        const circleRight = radius;
        const circleBottom = radius;
        // Label padding around the circle
        let padLeft = Math.max(0, circleLeft - labelsBox.x);
        let padTop = Math.max(0, circleTop - labelsBox.y);
        let padRight = Math.max(0, labelsBox.x + labelsBox.width - circleRight);
        let padBottom = Math.max(0, labelsBox.y + labelsBox.height - circleBottom);
        padLeft = padRight = Math.max(padLeft, padRight);
        padTop = padBottom = Math.max(padTop, padBottom);
        // Available area for the circle (after the padding will be applied)
        const availCircleWidth = seriesBox.width - padLeft - padRight;
        const availCircleHeight = seriesBox.height - padTop - padBottom;
        let newRadius = Math.min(availCircleWidth, availCircleHeight) / 2;
        const minHorizontalRadius = (minCircleRatio * seriesBox.width) / 2;
        const minVerticalRadius = (minCircleRatio * seriesBox.height) / 2;
        const minRadius = Math.min(minHorizontalRadius, minVerticalRadius);
        if (newRadius < minRadius) {
            // If the radius is too small, reduce the label padding
            newRadius = minRadius;
            const horizontalPadding = padLeft + padRight;
            const verticalPadding = padTop + padBottom;
            if (2 * newRadius + verticalPadding > seriesBox.height) {
                const padHeight = seriesBox.height - 2 * newRadius;
                if (Math.min(padTop, padBottom) * 2 > padHeight) {
                    padTop = padHeight / 2;
                    padBottom = padHeight / 2;
                }
                else if (padTop > padBottom) {
                    padTop = padHeight - padBottom;
                }
                else {
                    padBottom = padHeight - padTop;
                }
            }
            if (2 * newRadius + horizontalPadding > seriesBox.width) {
                const padWidth = seriesBox.width - 2 * newRadius;
                if (Math.min(padLeft, padRight) * 2 > padWidth) {
                    padLeft = padWidth / 2;
                    padRight = padWidth / 2;
                }
                else if (padLeft > padRight) {
                    padLeft = padWidth - padRight;
                }
                else {
                    padRight = padWidth - padLeft;
                }
            }
        }
        const newWidth = padLeft + 2 * newRadius + padRight;
        const newHeight = padTop + 2 * newRadius + padBottom;
        return {
            centerX: seriesBox.x + (seriesBox.width - newWidth) / 2 + padLeft + newRadius,
            centerY: seriesBox.y + (seriesBox.height - newHeight) / 2 + padTop + newRadius,
            radius: newRadius,
        };
    }
}
PolarChart.className = 'PolarChart';
PolarChart.type = 'polar';
