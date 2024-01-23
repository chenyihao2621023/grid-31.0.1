import { Component } from "../../widgets/component";
export class LoadingOverlayComponent extends Component {
  constructor() {
    super();
  }
  destroy() {
    super.destroy();
  }
  init(params) {
    var _a;
    const template = (_a = this.gridOptionsService.get('overlayLoadingTemplate')) !== null && _a !== void 0 ? _a : LoadingOverlayComponent.DEFAULT_LOADING_OVERLAY_TEMPLATE;
    const localeTextFunc = this.localeService.getLocaleTextFunc();
    const localisedTemplate = template.replace('[LOADING...]', localeTextFunc('loadingOoo', 'Loading...'));
    this.setTemplate(localisedTemplate);
  }
}
LoadingOverlayComponent.DEFAULT_LOADING_OVERLAY_TEMPLATE = '<span class="zing-overlay-loading-center">[LOADING...]</span>';