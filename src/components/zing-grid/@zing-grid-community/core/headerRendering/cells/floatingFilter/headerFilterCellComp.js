var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PostConstruct, PreDestroy } from '../../../context/context';
import { setDisplayed } from "../../../utils/dom";
import { RefSelector } from '../../../widgets/componentAnnotations';
import { AbstractHeaderCellComp } from '../abstractCell/abstractHeaderCellComp';
export class HeaderFilterCellComp extends AbstractHeaderCellComp {
  constructor(ctrl) {
    super(HeaderFilterCellComp.TEMPLATE, ctrl);
  }
  postConstruct() {
    const eGui = this.getGui();
    const compProxy = {
      addOrRemoveCssClass: (cssClassName, on) => this.addOrRemoveCssClass(cssClassName, on),
      addOrRemoveBodyCssClass: (cssClassName, on) => this.eFloatingFilterBody.classList.toggle(cssClassName, on),
      setButtonWrapperDisplayed: displayed => setDisplayed(this.eButtonWrapper, displayed),
      setCompDetails: compDetails => this.setCompDetails(compDetails),
      getFloatingFilterComp: () => this.compPromise,
      setWidth: width => eGui.style.width = width,
      setMenuIcon: eIcon => this.eButtonShowMainFilter.appendChild(eIcon)
    };
    this.ctrl.setComp(compProxy, eGui, this.eButtonShowMainFilter, this.eFloatingFilterBody);
  }
  setCompDetails(compDetails) {
    if (!compDetails) {
      this.destroyFloatingFilterComp();
      this.compPromise = null;
      return;
    }
    this.compPromise = compDetails.newZingStackInstance();
    this.compPromise.then(comp => this.afterCompCreated(comp));
  }
  destroyFloatingFilterComp() {
    if (this.floatingFilterComp) {
      this.eFloatingFilterBody.removeChild(this.floatingFilterComp.getGui());
      this.floatingFilterComp = this.destroyBean(this.floatingFilterComp);
    }
  }
  afterCompCreated(comp) {
    if (!comp) {
      return;
    }
    if (!this.isAlive()) {
      this.destroyBean(comp);
      return;
    }
    this.destroyFloatingFilterComp();
    this.floatingFilterComp = comp;
    this.eFloatingFilterBody.appendChild(comp.getGui());
    if (comp.afterGuiAttached) {
      comp.afterGuiAttached();
    }
  }
}
HeaderFilterCellComp.TEMPLATE = `<div class="zing-header-cell zing-floating-filter" role="gridcell" tabindex="-1">
            <div ref="eFloatingFilterBody" role="presentation"></div>
            <div class="zing-floating-filter-button zing-hidden" ref="eButtonWrapper" role="presentation">
                <button type="button" class="zing-button zing-floating-filter-button-button" ref="eButtonShowMainFilter" tabindex="-1"></button>
            </div>
        </div>`;
__decorate([RefSelector('eFloatingFilterBody')], HeaderFilterCellComp.prototype, "eFloatingFilterBody", void 0);
__decorate([RefSelector('eButtonWrapper')], HeaderFilterCellComp.prototype, "eButtonWrapper", void 0);
__decorate([RefSelector('eButtonShowMainFilter')], HeaderFilterCellComp.prototype, "eButtonShowMainFilter", void 0);
__decorate([PostConstruct], HeaderFilterCellComp.prototype, "postConstruct", null);
__decorate([PreDestroy], HeaderFilterCellComp.prototype, "destroyFloatingFilterComp", null);