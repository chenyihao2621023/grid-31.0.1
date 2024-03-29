var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Component, PostConstruct } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class TitleEdit extends Component {
  constructor(chartMenu) {
    super(TitleEdit.TEMPLATE);
    this.chartMenu = chartMenu;
    this.destroyableChartListeners = [];
    this.editing = false;
  }
  init() {
    this.addManagedListener(this.getGui(), 'keydown', e => {
      if (this.editing && e.key === 'Enter' && !e.shiftKey) {
        this.handleEndEditing();
        e.preventDefault();
      }
    });
    this.addManagedListener(this.getGui(), 'input', () => {
      if (this.editing) {
        this.updateHeight();
      }
    });
    this.addManagedListener(this.getGui(), 'blur', () => this.endEditing());
  }
  refreshTitle(chartController, chartOptionsService) {
    this.chartController = chartController;
    this.chartOptionsService = chartOptionsService;
    for (const destroyFn of this.destroyableChartListeners) {
      destroyFn();
    }
    this.destroyableChartListeners = [];
    const chartProxy = this.chartController.getChartProxy();
    const chart = chartProxy.getChart();
    const canvas = chart.scene.canvas.element;
    const destroyDbleClickListener = this.addManagedListener(canvas, 'dblclick', event => {
      const {
        title
      } = chart;
      if (title && title.node.containsPoint(event.offsetX, event.offsetY)) {
        const bbox = title.node.computeBBox();
        const xy = title.node.inverseTransformPoint(bbox.x, bbox.y);
        this.startEditing(Object.assign(Object.assign({}, bbox), xy), canvas.width);
      }
    });
    let wasInTitle = false;
    const destroyMouseMoveListener = this.addManagedListener(canvas, 'mousemove', event => {
      const {
        title
      } = chart;
      const inTitle = !!(title && title.enabled && title.node.containsPoint(event.offsetX, event.offsetY));
      if (wasInTitle !== inTitle) {
        canvas.style.cursor = inTitle ? 'pointer' : '';
      }
      wasInTitle = inTitle;
    });
    this.destroyableChartListeners = [destroyDbleClickListener, destroyMouseMoveListener];
  }
  startEditing(titleBBox, canvasWidth) {
    if (this.chartMenu && this.chartMenu.isVisible()) {
      return;
    }
    if (this.editing) {
      return;
    }
    this.editing = true;
    const minimumTargetInputWidth = 300;
    const inputWidth = Math.max(Math.min(titleBBox.width + 20, canvasWidth), minimumTargetInputWidth);
    const element = this.getGui();
    element.classList.add('currently-editing');
    const inputStyle = element.style;
    inputStyle.fontFamily = this.chartOptionsService.getChartOption('title.fontFamily');
    inputStyle.fontWeight = this.chartOptionsService.getChartOption('title.fontWeight');
    inputStyle.fontStyle = this.chartOptionsService.getChartOption('title.fontStyle');
    inputStyle.fontSize = this.chartOptionsService.getChartOption('title.fontSize') + 'px';
    inputStyle.color = this.chartOptionsService.getChartOption('title.color');
    const oldTitle = this.chartOptionsService.getChartOption('title.text');
    const isTitlePlaceholder = oldTitle === this.chartTranslationService.translate('titlePlaceholder');
    element.value = isTitlePlaceholder ? '' : oldTitle;
    const oldTitleLines = oldTitle.split(/\r?\n/g).length;
    inputStyle.left = Math.round(titleBBox.x + titleBBox.width / 2 - inputWidth / 2 - 1) + 'px';
    inputStyle.top = Math.round(titleBBox.y + titleBBox.height / 2 - oldTitleLines * this.getLineHeight() / 2 - 2) + 'px';
    inputStyle.width = Math.round(inputWidth) + 'px';
    inputStyle.lineHeight = this.getLineHeight() + 'px';
    this.updateHeight();
    element.focus();
  }
  updateHeight() {
    const element = this.getGui();
    const oldTitleLines = this.chartOptionsService.getChartOption('title.text').split(/\r?\n/g).length;
    const currentTitleLines = element.value.split(/\r?\n/g).length;
    element.style.height = Math.round(Math.max(oldTitleLines, currentTitleLines) * this.getLineHeight()) + 4 + 'px';
  }
  getLineHeight() {
    const fixedLineHeight = this.chartOptionsService.getChartOption('title.lineHeight');
    if (fixedLineHeight) {
      return parseInt(fixedLineHeight);
    }
    return Math.round(parseInt(this.chartOptionsService.getChartOption('title.fontSize')) * 1.2);
  }
  handleEndEditing() {
    const titleColor = this.chartOptionsService.getChartOption('title.color');
    const transparentColor = 'rgba(0, 0, 0, 0)';
    this.chartOptionsService.setChartOption('title.color', transparentColor);
    this.chartOptionsService.awaitChartOptionUpdate(() => this.endEditing());
    this.chartOptionsService.awaitChartOptionUpdate(() => {
      this.chartOptionsService.setChartOption('title.color', titleColor);
    });
  }
  endEditing() {
    if (!this.editing) {
      return;
    }
    this.editing = false;
    const value = this.getGui().value;
    if (value && value.trim() !== '') {
      this.chartOptionsService.setChartOption('title.text', value);
      this.chartOptionsService.setChartOption('title.enabled', true);
    } else {
      this.chartOptionsService.setChartOption('title.text', '');
      this.chartOptionsService.setChartOption('title.enabled', false);
    }
    this.getGui().classList.remove('currently-editing');
    this.chartOptionsService.awaitChartOptionUpdate(() => {
      this.eventService.dispatchEvent({
        type: 'chartTitleEdit'
      });
    });
  }
}
TitleEdit.TEMPLATE = `<textarea
             class="zing-chart-title-edit"
             style="padding:0; border:none; border-radius: 0; min-height: 0; text-align: center; resize: none;" />
        `;
__decorate([Autowired('chartTranslationService')], TitleEdit.prototype, "chartTranslationService", void 0);
__decorate([PostConstruct], TitleEdit.prototype, "init", null);