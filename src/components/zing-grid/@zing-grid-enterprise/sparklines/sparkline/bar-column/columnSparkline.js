import { _Scale, _Scene, _Util } from '@/components/zing-grid/zing-charts-community/main.js';
import { BarColumnLabelPlacement, BarColumnSparkline } from './barColumnSparkline';
const {
  isNumber
} = _Util;
const {
  BandScale
} = _Scale;
export class ColumnSparkline extends BarColumnSparkline {
  updateYScaleRange() {
    const {
      seriesRect,
      yScale
    } = this;
    yScale.range = [seriesRect.height, 0];
  }
  updateXScaleRange() {
    const {
      xScale,
      seriesRect,
      paddingOuter,
      paddingInner
    } = this;
    if (xScale instanceof BandScale) {
      xScale.range = [0, seriesRect.width];
      xScale.paddingInner = paddingInner;
      xScale.paddingOuter = paddingOuter;
    } else {
      const step = this.calculateStep(seriesRect.width);
      const padding = step * paddingOuter;
      this.bandWidth = step * (1 - paddingInner);
      xScale.range = [padding, seriesRect.width - padding - this.bandWidth];
    }
  }
  updateAxisLine() {
    const {
      yScale,
      axis,
      axisLine,
      seriesRect
    } = this;
    const {
      strokeWidth
    } = axis;
    axisLine.x1 = 0;
    axisLine.x2 = seriesRect.width;
    axisLine.y1 = 0;
    axisLine.y2 = 0;
    axisLine.stroke = axis.stroke;
    axisLine.strokeWidth = strokeWidth + (strokeWidth % 2 === 1 ? 1 : 0);
    const yZero = yScale.convert(0);
    axisLine.translationY = yZero;
  }
  generateNodeData() {
    const {
      data,
      yData,
      xData,
      xScale,
      yScale,
      fill,
      stroke,
      strokeWidth,
      label
    } = this;
    if (!data) {
      return;
    }
    const {
      fontStyle: labelFontStyle,
      fontWeight: labelFontWeight,
      fontSize: labelFontSize,
      fontFamily: labelFontFamily,
      color: labelColor,
      formatter: labelFormatter,
      placement: labelPlacement
    } = label;
    const nodeData = [];
    const yZero = yScale.convert(0);
    const continuous = !(xScale instanceof BandScale);
    for (let i = 0, n = yData.length; i < n; i++) {
      let yDatum = yData[i];
      const xDatum = xData[i];
      const invalidDatum = yDatum === undefined;
      if (invalidDatum) {
        yDatum = 0;
      }
      const y = Math.min(yDatum === undefined ? NaN : yScale.convert(yDatum), yZero);
      const x = xScale.convert(continuous ? xScale.toDomain(xDatum) : xDatum);
      const bottom = Math.max(yDatum === undefined ? NaN : yScale.convert(yDatum), yZero);
      const width = !continuous ? xScale.bandwidth : this.bandWidth;
      const height = bottom - y;
      const midPoint = {
        x: x + width / 2,
        y: yZero
      };
      let labelText;
      if (labelFormatter) {
        labelText = labelFormatter({
          value: yDatum
        });
      } else {
        labelText = yDatum !== undefined && isNumber(yDatum) ? this.formatLabelValue(yDatum) : '';
      }
      const labelX = x + width / 2;
      let labelY;
      const labelTextAlign = 'center';
      let labelTextBaseline;
      const isPositiveY = yDatum !== undefined && yDatum >= 0;
      const labelPadding = 2;
      if (labelPlacement === BarColumnLabelPlacement.Center) {
        labelY = y + height / 2;
        labelTextBaseline = 'middle';
      } else if (labelPlacement === BarColumnLabelPlacement.OutsideEnd) {
        labelY = y + (isPositiveY ? -labelPadding : height + labelPadding);
        labelTextBaseline = isPositiveY ? 'bottom' : 'top';
      } else if (labelPlacement === BarColumnLabelPlacement.InsideEnd) {
        labelY = y + (isPositiveY ? labelPadding : height - labelPadding);
        labelTextBaseline = isPositiveY ? 'top' : 'bottom';
        const textSize = _Scene.HdpiCanvas.getTextSize(labelText, labelFontFamily);
        const textHeight = textSize.height || 10;
        const positiveBoundary = yZero - textHeight;
        const negativeBoundary = yZero + textHeight;
        const exceedsBoundaries = isPositiveY && labelY > positiveBoundary || !isPositiveY && labelY < negativeBoundary;
        if (exceedsBoundaries) {
          labelY = yZero + labelPadding * (isPositiveY ? -1 : 1);
          labelTextBaseline = isPositiveY ? 'bottom' : 'top';
        }
      } else {
        labelY = yZero + labelPadding * (isPositiveY ? -1 : 1);
        labelTextBaseline = isPositiveY ? 'bottom' : 'top';
      }
      nodeData.push({
        x,
        y,
        width,
        height,
        fill,
        stroke,
        strokeWidth,
        seriesDatum: {
          x: xDatum,
          y: invalidDatum ? undefined : yDatum
        },
        point: midPoint,
        label: {
          x: labelX,
          y: labelY,
          text: labelText,
          fontStyle: labelFontStyle,
          fontWeight: labelFontWeight,
          fontSize: labelFontSize,
          fontFamily: labelFontFamily,
          textAlign: labelTextAlign,
          textBaseline: labelTextBaseline,
          fill: labelColor
        }
      });
    }
    return nodeData;
  }
}
ColumnSparkline.className = 'ColumnSparkline';