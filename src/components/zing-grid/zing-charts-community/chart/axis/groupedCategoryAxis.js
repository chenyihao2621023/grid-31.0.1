var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BandScale } from '../../scale/bandScale';
import { BBox } from '../../scene/bbox';
import { Matrix } from '../../scene/matrix';
import { Selection } from '../../scene/selection';
import { Line } from '../../scene/shape/line';
import { Text } from '../../scene/shape/text';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { extent } from '../../util/array';
import { BOOLEAN, COLOR_STRING, Validate } from '../../util/validation';
import { ChartAxisDirection } from '../chartAxisDirection';
import { calculateLabelRotation } from '../label';
import { AxisLabel } from './axisLabel';
import { AxisLine } from './axisLine';
import { CartesianAxis } from './cartesianAxis';
import { ticksToTree, treeLayout } from './tree';
class GroupedCategoryAxisLabel extends AxisLabel {
  constructor() {
    super(...arguments);
    this.grid = false;
  }
}
__decorate([Validate(BOOLEAN)], GroupedCategoryAxisLabel.prototype, "grid", void 0);
export class GroupedCategoryAxis extends CartesianAxis {
  constructor(moduleCtx) {
    super(moduleCtx, new BandScale());
    this.tickScale = new BandScale();
    this.line = new AxisLine();
    this.label = new GroupedCategoryAxisLabel();
    this.labelColor = 'rgba(87, 87, 87, 1)';
    this.includeInvisibleDomains = true;
    const {
      tickLineGroup,
      tickLabelGroup,
      gridLineGroup,
      tickScale,
      scale
    } = this;
    scale.paddingOuter = 0.1;
    scale.paddingInner = scale.paddingOuter * 2;
    this.range = scale.range.slice();
    this.refreshScale();
    tickScale.paddingInner = 1;
    tickScale.paddingOuter = 0;
    this.gridLineSelection = Selection.select(gridLineGroup, Line);
    this.axisLineSelection = Selection.select(tickLineGroup, Line);
    this.separatorSelection = Selection.select(tickLineGroup, Line);
    this.labelSelection = Selection.select(tickLabelGroup, Text);
  }
  updateRange() {
    const {
      range: rr,
      visibleRange: vr,
      scale
    } = this;
    const span = (rr[1] - rr[0]) / (vr[1] - vr[0]);
    const shift = span * vr[0];
    const start = rr[0] - shift;
    this.tickScale.range = scale.range = [start, start + span];
    this.resizeTickTree();
  }
  resizeTickTree() {
    var _a;
    const s = this.scale;
    const range = s.domain.length ? [s.convert(s.domain[0]), s.convert(s.domain[s.domain.length - 1])] : s.range;
    const layout = this.tickTreeLayout;
    const lineHeight = this.lineHeight;
    if (layout) {
      layout.resize(Math.abs(range[1] - range[0]), layout.depth * lineHeight, (Math.min(range[0], range[1]) || 0) + ((_a = s.bandwidth) !== null && _a !== void 0 ? _a : 0) / 2, -layout.depth * lineHeight, range[1] - range[0] < 0);
    }
  }
  get lineHeight() {
    return this.label.fontSize * 1.5;
  }
  set gridLength(value) {
    if (this._gridLength && !value || !this._gridLength && value) {
      this.gridLineSelection.clear();
      this.labelSelection.clear();
    }
    this._gridLength = value;
  }
  get gridLength() {
    return this._gridLength;
  }
  calculateDomain() {
    var _a;
    const {
      direction
    } = this;
    const domains = [];
    let isNumericX;
    this.boundSeries.filter(s => s.visible).forEach(series => {
      if (direction === ChartAxisDirection.X) {
        if (isNumericX === undefined) {
          const domain = series.getDomain(direction);
          domains.push(domain);
          isNumericX = typeof domain[0] === 'number';
        } else if (isNumericX) {
          domains.push(series.getDomain(direction));
        }
      } else {
        domains.push(series.getDomain(direction));
      }
    });
    const domain = new Array().concat(...domains);
    const domainExtent = (_a = extent(domain)) !== null && _a !== void 0 ? _a : domain;
    const values = this.reverse ? [...domainExtent].reverse() : domainExtent;
    const {
      domain: normalisedDataDomain,
      clipped
    } = this.normaliseDataDomain(values);
    this.dataDomain = {
      domain: normalisedDataDomain,
      clipped
    };
    this.scale.domain = normalisedDataDomain;
  }
  normaliseDataDomain(d) {
    const values = d.filter((s, i, arr) => arr.indexOf(s) === i);
    const tickTree = ticksToTree(values);
    this.tickTreeLayout = treeLayout(tickTree);
    const tickScaleDomain = values.slice();
    tickScaleDomain.push('');
    this.tickScale.domain = tickScaleDomain;
    this.resizeTickTree();
    return {
      domain: values,
      clipped: false
    };
  }
  update() {
    if (!this.computedLayout) {
      return;
    }
    this.updatePosition();
    this.updateTitleCaption();
    this.updateCategoryLabels();
    this.updateSeparators();
    this.updateAxisLines();
    this.updateCategoryGridLines();
    this.resetSelectionNodes();
    return undefined;
  }
  updateTitleCaption() {
    const {
      _titleCaption
    } = this;
    _titleCaption.node.visible = false;
  }
  updateCategoryLabels() {
    if (!this.computedLayout) return;
    const {
      tickLabelLayout
    } = this.computedLayout;
    const labelSelection = this.labelSelection.update(tickLabelLayout);
    labelSelection.each((node, datum) => {
      node.setProperties(datum);
    });
  }
  updateSeparators() {
    if (!this.computedLayout) return;
    const {
      separatorLayout
    } = this.computedLayout;
    const {
      range
    } = this;
    const epsilon = 0.0000001;
    const separatorSelection = this.separatorSelection.update(separatorLayout);
    separatorSelection.each((line, datum) => {
      line.x1 = datum.x1;
      line.x2 = datum.x2;
      line.y1 = datum.y;
      line.y2 = datum.y;
      line.visible = datum.y >= range[0] - epsilon && datum.y <= range[1] + epsilon;
      line.stroke = this.tick.color;
      line.fill = undefined;
      line.strokeWidth = 1;
    });
  }
  updateAxisLines() {
    if (!this.computedLayout) return;
    const {
      axisLineLayout
    } = this.computedLayout;
    const axisLineSelection = this.axisLineSelection.update(axisLineLayout);
    axisLineSelection.each((line, datum) => {
      line.setProperties(Object.assign(Object.assign({}, datum), {
        stroke: this.line.color,
        strokeWidth: this.line.width
      }));
      line.x1 = datum.x;
      line.x2 = datum.x;
      line.y1 = datum.y1;
      line.y2 = datum.y2;
      line.strokeWidth = this.line.width;
      line.stroke = this.line.color;
    });
  }
  updateCategoryGridLines() {
    const {
      gridLength,
      gridLine,
      label,
      range,
      tickScale
    } = this;
    const ticks = tickScale.ticks();
    const sideFlag = label.getSideFlag();
    const gridSelection = this.gridLineSelection.update(gridLength ? ticks : []);
    if (gridLength) {
      const {
        width,
        style
      } = gridLine;
      const styleCount = style.length;
      gridSelection.each((line, datum, index) => {
        const y = Math.round(tickScale.convert(datum));
        line.x1 = 0;
        line.x2 = -sideFlag * gridLength;
        line.y1 = y;
        line.y2 = y;
        line.visible = y >= range[0] && y <= range[1];
        const {
          stroke,
          lineDash
        } = style[index % styleCount];
        line.stroke = stroke;
        line.strokeWidth = width;
        line.lineDash = lineDash;
        line.fill = undefined;
      });
    }
  }
  computeLayout() {
    this.updateDirection();
    this.calculateDomain();
    this.updateRange();
    const {
      scale,
      label,
      label: {
        parallel
      },
      moduleCtx: {
        callbackCache
      },
      range,
      title,
      title: {
        formatter = p => p.defaultValue
      } = {}
    } = this;
    const rangeStart = scale.range[0];
    const rangeEnd = scale.range[1];
    const rangeLength = Math.abs(rangeEnd - rangeStart);
    const bandwidth = rangeLength / scale.domain.length || 0;
    const rotation = toRadians(this.rotation);
    const isHorizontal = Math.abs(Math.cos(rotation)) < 1e-8;
    const sideFlag = label.getSideFlag();
    const lineHeight = this.lineHeight;
    const tickTreeLayout = this.tickTreeLayout;
    const labels = scale.ticks();
    const treeLabels = tickTreeLayout ? tickTreeLayout.nodes : [];
    const isLabelTree = tickTreeLayout ? tickTreeLayout.depth > 1 : false;
    const {
      defaultRotation,
      configuredRotation,
      parallelFlipFlag
    } = calculateLabelRotation({
      rotation: label.rotation,
      parallel,
      regularFlipRotation: normalizeAngle360(rotation - Math.PI / 2),
      parallelFlipRotation: normalizeAngle360(rotation)
    });
    const tickLabelLayout = [];
    const copyLabelProps = node => {
      return {
        fill: node.fill,
        fontFamily: node.fontFamily,
        fontSize: node.fontSize,
        fontStyle: node.fontStyle,
        fontWeight: node.fontWeight,
        rotation: node.rotation,
        rotationCenterX: node.rotationCenterX,
        rotationCenterY: node.rotationCenterY,
        text: node.text,
        textAlign: node.textAlign,
        textBaseline: node.textBaseline,
        translationX: node.translationX,
        translationY: node.translationY,
        visible: node.visible,
        x: node.x,
        y: node.y
      };
    };
    const labelBBoxes = new Map();
    let maxLeafLabelWidth = 0;
    const tempText = new Text();
    const setLabelProps = (datum, index) => {
      var _a;
      tempText.setProperties({
        fill: label.color,
        fontFamily: label.fontFamily,
        fontSize: label.fontSize,
        fontStyle: label.fontStyle,
        fontWeight: label.fontWeight,
        textAlign: 'center',
        textBaseline: parallelFlipFlag === -1 ? 'bottom' : 'hanging',
        translationX: datum.screenY - label.fontSize * 0.25,
        translationY: datum.screenX
      });
      if (index === 0) {
        const isCaptionEnabled = (title === null || title === void 0 ? void 0 : title.enabled) && labels.length > 0;
        if (!isCaptionEnabled) {
          return false;
        }
        const text = callbackCache.call(formatter, this.getTitleFormatterParams());
        tempText.setProperties({
          fill: title.color,
          fontFamily: title.fontFamily,
          fontSize: title.fontSize,
          fontStyle: title.fontStyle,
          fontWeight: title.fontWeight,
          text,
          textBaseline: 'hanging',
          translationX: datum.screenY - label.fontSize * 0.25,
          translationY: datum.screenX
        });
      } else {
        const isInRange = datum.screenX >= range[0] && datum.screenX <= range[1];
        if (!isInRange) {
          return false;
        }
        if (label.formatter) {
          tempText.text = (_a = callbackCache.call(label.formatter, {
            value: String(datum.label),
            index
          })) !== null && _a !== void 0 ? _a : String(datum.label);
        } else {
          tempText.text = String(datum.label);
        }
      }
      return true;
    };
    treeLabels.forEach((datum, index) => {
      const isVisible = setLabelProps(datum, index);
      if (isVisible) {
        const bbox = tempText.computeTransformedBBox();
        if (bbox) {
          labelBBoxes.set(index, bbox);
          const isLeaf = !datum.children.length;
          if (isLeaf && bbox.width > maxLeafLabelWidth) {
            maxLeafLabelWidth = bbox.width;
          }
        }
      }
    });
    const labelX = sideFlag * label.padding;
    const labelGrid = this.label.grid;
    const separatorData = [];
    treeLabels.forEach((datum, index) => {
      let visible = setLabelProps(datum, index);
      const id = index;
      tempText.x = labelX;
      tempText.rotationCenterX = labelX;
      const isLeaf = !datum.children.length;
      if (isLeaf) {
        tempText.rotation = configuredRotation;
        tempText.textAlign = 'end';
        tempText.textBaseline = 'middle';
        const bbox = labelBBoxes.get(id);
        if (bbox && bbox.height > bandwidth) {
          visible = false;
          labelBBoxes.delete(id);
        }
      } else {
        tempText.translationX -= maxLeafLabelWidth - lineHeight + this.label.padding;
        const availableRange = datum.leafCount * bandwidth;
        const bbox = labelBBoxes.get(id);
        if (bbox && bbox.width > availableRange) {
          visible = false;
          labelBBoxes.delete(id);
        } else if (isHorizontal) {
          tempText.rotation = defaultRotation;
        } else {
          tempText.rotation = -Math.PI / 2;
        }
      }
      if (datum.parent && isLabelTree) {
        const y = isLeaf ? datum.screenX - bandwidth / 2 : datum.screenX - datum.leafCount * bandwidth / 2;
        if (isLeaf) {
          if (datum.number !== datum.children.length - 1 || labelGrid) {
            separatorData.push({
              y,
              x1: 0,
              x2: -maxLeafLabelWidth - this.label.padding * 2
            });
          }
        } else {
          const x = -maxLeafLabelWidth - this.label.padding * 2 + datum.screenY;
          separatorData.push({
            y,
            x1: x + lineHeight,
            x2: x
          });
        }
      }
      let props;
      if (visible) {
        const bbox = tempText.computeTransformedBBox();
        if (bbox) {
          labelBBoxes.set(index, bbox);
        }
        props = Object.assign(Object.assign({}, copyLabelProps(tempText)), {
          visible
        });
      } else {
        labelBBoxes.delete(index);
        props = {
          visible
        };
      }
      tickLabelLayout.push(props);
    });
    let minX = 0;
    separatorData.forEach(d => minX = Math.min(minX, d.x2));
    separatorData.push({
      y: Math.max(rangeStart, rangeEnd),
      x1: 0,
      x2: minX
    });
    const separatorLayout = [];
    const separatorBoxes = [];
    const epsilon = 0.0000001;
    separatorData.forEach(datum => {
      if (datum.y >= range[0] - epsilon && datum.y <= range[1] + epsilon) {
        const {
          x1,
          x2,
          y
        } = datum;
        const separatorBox = new BBox(Math.min(x1, x2), y, Math.abs(x1 - x2), 0);
        separatorBoxes.push(separatorBox);
        separatorLayout.push({
          x1,
          x2,
          y
        });
      }
    });
    const axisLineLayout = [];
    const axisLineBoxes = [];
    const lineCount = tickTreeLayout ? tickTreeLayout.depth + 1 : 1;
    for (let i = 0; i < lineCount; i++) {
      const visible = labels.length > 0 && (i === 0 || labelGrid && isLabelTree);
      const x = i > 0 ? -maxLeafLabelWidth - this.label.padding * 2 - (i - 1) * lineHeight : 0;
      const lineBox = new BBox(x, Math.min(...range), 0, Math.abs(range[1] - range[0]));
      axisLineBoxes.push(lineBox);
      axisLineLayout.push({
        x,
        y1: range[0],
        y2: range[1],
        visible
      });
    }
    const getTransformBox = bbox => {
      const matrix = new Matrix();
      const {
        rotation: axisRotation,
        translationX,
        translationY,
        rotationCenterX,
        rotationCenterY
      } = this.getAxisTransform();
      Matrix.updateTransformMatrix(matrix, 1, 1, axisRotation, translationX, translationY, {
        scalingCenterX: 0,
        scalingCenterY: 0,
        rotationCenterX,
        rotationCenterY
      });
      return matrix.transformBBox(bbox);
    };
    const bbox = BBox.merge([...labelBBoxes.values(), ...separatorBoxes, ...axisLineBoxes]);
    const transformedBBox = getTransformBox(bbox);
    return {
      bbox: transformedBBox,
      tickLabelLayout,
      separatorLayout,
      axisLineLayout
    };
  }
  calculateLayout() {
    const {
      axisLineLayout,
      separatorLayout,
      tickLabelLayout,
      bbox
    } = this.computeLayout();
    this.computedLayout = {
      axisLineLayout,
      separatorLayout,
      tickLabelLayout
    };
    return {
      bbox,
      primaryTickCount: undefined
    };
  }
}
GroupedCategoryAxis.className = 'GroupedCategoryAxis';
GroupedCategoryAxis.type = 'grouped-category';
__decorate([Validate(COLOR_STRING, {
  optional: true
})], GroupedCategoryAxis.prototype, "labelColor", void 0);