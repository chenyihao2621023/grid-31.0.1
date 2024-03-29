var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Component, Events, PostConstruct, RefSelector } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { getMaxValue } from "../formatPanel";
export class PaddingPanel extends Component {
  constructor(chartOptionsService, chartController) {
    super();
    this.chartOptionsService = chartOptionsService;
    this.chartController = chartController;
  }
  init() {
    const groupParams = {
      cssIdentifier: 'charts-format-sub-level',
      direction: 'vertical',
      suppressOpenCloseIcons: true
    };
    this.setTemplate(PaddingPanel.TEMPLATE, {
      chartPaddingGroup: groupParams
    });
    this.addManagedListener(this.eventService, Events.EVENT_CHART_OPTIONS_CHANGED, e => {
      this.updateTopPadding(e.chartOptions);
    });
    this.initGroup();
    this.initChartPaddingItems();
  }
  initGroup() {
    this.chartPaddingGroup.setTitle(this.chartTranslationService.translate("padding")).hideOpenCloseIcons(true).hideEnabledCheckbox(true);
  }
  initChartPaddingItems() {
    const initInput = (property, input) => {
      const currentValue = this.chartOptionsService.getChartOption('padding.' + property);
      input.setLabel(this.chartTranslationService.translate(property)).setMaxValue(getMaxValue(currentValue, 200)).setValue(`${currentValue}`).setTextFieldWidth(45).onValueChange(newValue => this.chartOptionsService.setChartOption('padding.' + property, newValue));
    };
    initInput('top', this.paddingTopSlider);
    initInput('right', this.paddingRightSlider);
    initInput('bottom', this.paddingBottomSlider);
    initInput('left', this.paddingLeftSlider);
  }
  updateTopPadding(chartOptions) {
    var _a, _b;
    const seriesType = this.chartController.getChartSeriesTypes()[0];
    const topPadding = (_b = (_a = chartOptions[seriesType]) === null || _a === void 0 ? void 0 : _a.padding) === null || _b === void 0 ? void 0 : _b.top;
    if (topPadding != null) {
      this.paddingTopSlider.setValue(topPadding);
    }
  }
}
PaddingPanel.TEMPLATE = `<div>
            <zing-group-component ref="chartPaddingGroup">
                <zing-slider ref="paddingTopSlider"></zing-slider>
                <zing-slider ref="paddingRightSlider"></zing-slider>
                <zing-slider ref="paddingBottomSlider"></zing-slider>
                <zing-slider ref="paddingLeftSlider"></zing-slider>
            </zing-group-component>
        <div>`;
__decorate([RefSelector('chartPaddingGroup')], PaddingPanel.prototype, "chartPaddingGroup", void 0);
__decorate([RefSelector('paddingTopSlider')], PaddingPanel.prototype, "paddingTopSlider", void 0);
__decorate([RefSelector('paddingRightSlider')], PaddingPanel.prototype, "paddingRightSlider", void 0);
__decorate([RefSelector('paddingBottomSlider')], PaddingPanel.prototype, "paddingBottomSlider", void 0);
__decorate([RefSelector('paddingLeftSlider')], PaddingPanel.prototype, "paddingLeftSlider", void 0);
__decorate([Autowired('chartTranslationService')], PaddingPanel.prototype, "chartTranslationService", void 0);
__decorate([PostConstruct], PaddingPanel.prototype, "init", null);