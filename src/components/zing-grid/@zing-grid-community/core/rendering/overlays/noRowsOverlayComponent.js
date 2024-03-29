import { Component } from "../../widgets/component";
export class NoRowsOverlayComponent extends Component {
  constructor() {
    super();
  }
  destroy() {
    super.destroy();
  }
  init(params) {
    var _a;
    const template = (_a = this.gridOptionsService.get('overlayNoRowsTemplate')) !== null && _a !== void 0 ? _a : NoRowsOverlayComponent.DEFAULT_NO_ROWS_TEMPLATE;
    const localeTextFunc = this.localeService.getLocaleTextFunc();
    const localisedTemplate = template.replace('[NO_ROWS_TO_SHOW]', localeTextFunc('noRowsToShow', 'No Rows To Show'));
    this.setTemplate(localisedTemplate);
  }
}
NoRowsOverlayComponent.DEFAULT_NO_ROWS_TEMPLATE = '<span class="zing-overlay-no-rows-center">[NO_ROWS_TO_SHOW]</span>';