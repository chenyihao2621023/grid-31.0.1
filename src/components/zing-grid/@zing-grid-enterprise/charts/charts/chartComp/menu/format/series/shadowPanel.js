var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Component, PostConstruct, RefSelector } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { getMaxValue } from "../formatPanel";
export class ShadowPanel extends Component {
  constructor(chartOptionsService, getSelectedSeries) {
    super();
    this.chartOptionsService = chartOptionsService;
    this.getSelectedSeries = getSelectedSeries;
  }
  init() {
    const groupParams = {
      cssIdentifier: 'charts-format-sub-level',
      direction: 'vertical',
      suppressOpenCloseIcons: true
    };
    this.setTemplate(ShadowPanel.TEMPLATE, {
      shadowGroup: groupParams
    });
    this.shadowBlurSlider.setTextFieldWidth(45);
    this.shadowXOffsetSlider.setTextFieldWidth(45);
    this.shadowYOffsetSlider.setTextFieldWidth(45);
    this.initSeriesShadow();
  }
  initSeriesShadow() {
    this.shadowGroup.setTitle(this.chartTranslationService.translate("shadow")).setEnabled(this.chartOptionsService.getSeriesOption("shadow.enabled", this.getSelectedSeries())).hideOpenCloseIcons(true).hideEnabledCheckbox(false).onEnableChange(newValue => this.chartOptionsService.setSeriesOption("shadow.enabled", newValue, this.getSelectedSeries()));
    this.shadowColorPicker.setLabel(this.chartTranslationService.translate("color")).setLabelWidth("flex").setInputWidth('flex').setValue(this.chartOptionsService.getSeriesOption("shadow.color", this.getSelectedSeries())).onValueChange(newValue => this.chartOptionsService.setSeriesOption("shadow.color", newValue, this.getSelectedSeries()));
    const initInput = (input, property, minValue, defaultMaxValue) => {
      const currentValue = this.chartOptionsService.getSeriesOption(`shadow.${property}`, this.getSelectedSeries());
      input.setLabel(this.chartTranslationService.translate(property)).setMinValue(minValue).setMaxValue(getMaxValue(currentValue, defaultMaxValue)).setValue(`${currentValue}`).onValueChange(newValue => this.chartOptionsService.setSeriesOption(`shadow.${property}`, newValue, this.getSelectedSeries()));
    };
    initInput(this.shadowBlurSlider, "blur", 0, 20);
    initInput(this.shadowXOffsetSlider, "xOffset", -10, 10);
    initInput(this.shadowYOffsetSlider, "yOffset", -10, 10);
  }
}
ShadowPanel.TEMPLATE = `<div>
            <zing-group-component ref="shadowGroup">
                <zing-color-picker ref="shadowColorPicker"></zing-color-picker>
                <zing-slider ref="shadowBlurSlider"></zing-slider>
                <zing-slider ref="shadowXOffsetSlider"></zing-slider>
                <zing-slider ref="shadowYOffsetSlider"></zing-slider>
            </zing-group-component>
        </div>`;
__decorate([RefSelector('shadowGroup')], ShadowPanel.prototype, "shadowGroup", void 0);
__decorate([RefSelector('shadowColorPicker')], ShadowPanel.prototype, "shadowColorPicker", void 0);
__decorate([RefSelector('shadowBlurSlider')], ShadowPanel.prototype, "shadowBlurSlider", void 0);
__decorate([RefSelector('shadowXOffsetSlider')], ShadowPanel.prototype, "shadowXOffsetSlider", void 0);
__decorate([RefSelector('shadowYOffsetSlider')], ShadowPanel.prototype, "shadowYOffsetSlider", void 0);
__decorate([Autowired('chartTranslationService')], ShadowPanel.prototype, "chartTranslationService", void 0);
__decorate([PostConstruct], ShadowPanel.prototype, "init", null);