var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired } from "../../../context/context";
import { ProvidedColumnGroup } from "../../../entities/providedColumnGroup";
import { setDisplayed } from "../../../utils/dom";
import { isStopPropagationForZingGrid, stopPropagationForZingGrid } from "../../../utils/event";
import { warnOnce } from "../../../utils/function";
import { exists } from "../../../utils/generic";
import { createIconNoSpan } from "../../../utils/icon";
import { escapeString } from "../../../utils/string";
import { Component } from "../../../widgets/component";
import { RefSelector } from "../../../widgets/componentAnnotations";
import { TouchListener } from "../../../widgets/touchListener";
export class HeaderGroupComp extends Component {
  constructor() {
    super(HeaderGroupComp.TEMPLATE);
  }
  destroy() {
    super.destroy();
  }
  init(params) {
    this.params = params;
    this.checkWarnings();
    this.setupLabel();
    this.addGroupExpandIcon();
    this.setupExpandIcons();
  }
  checkWarnings() {
    const paramsAny = this.params;
    if (paramsAny.template) {
      warnOnce(`A template was provided for Header Group Comp - templates are only supported for Header Comps (not groups)`);
    }
  }
  setupExpandIcons() {
    this.addInIcon("columnGroupOpened", "zingOpened");
    this.addInIcon("columnGroupClosed", "zingClosed");
    const expandAction = event => {
      if (isStopPropagationForZingGrid(event)) {
        return;
      }
      const newExpandedValue = !this.params.columnGroup.isExpanded();
      this.columnModel.setColumnGroupOpened(this.params.columnGroup.getProvidedColumnGroup(), newExpandedValue, "uiColumnExpanded");
    };
    this.addTouchAndClickListeners(this.eCloseIcon, expandAction);
    this.addTouchAndClickListeners(this.eOpenIcon, expandAction);
    const stopPropagationAction = event => {
      stopPropagationForZingGrid(event);
    };
    this.addManagedListener(this.eCloseIcon, "dblclick", stopPropagationAction);
    this.addManagedListener(this.eOpenIcon, "dblclick", stopPropagationAction);
    this.addManagedListener(this.getGui(), "dblclick", expandAction);
    this.updateIconVisibility();
    const providedColumnGroup = this.params.columnGroup.getProvidedColumnGroup();
    this.addManagedListener(providedColumnGroup, ProvidedColumnGroup.EVENT_EXPANDED_CHANGED, this.updateIconVisibility.bind(this));
    this.addManagedListener(providedColumnGroup, ProvidedColumnGroup.EVENT_EXPANDABLE_CHANGED, this.updateIconVisibility.bind(this));
  }
  addTouchAndClickListeners(eElement, action) {
    const touchListener = new TouchListener(eElement, true);
    this.addManagedListener(touchListener, TouchListener.EVENT_TAP, action);
    this.addDestroyFunc(() => touchListener.destroy());
    this.addManagedListener(eElement, "click", action);
  }
  updateIconVisibility() {
    const columnGroup = this.params.columnGroup;
    if (columnGroup.isExpandable()) {
      const expanded = this.params.columnGroup.isExpanded();
      setDisplayed(this.eOpenIcon, expanded);
      setDisplayed(this.eCloseIcon, !expanded);
    } else {
      setDisplayed(this.eOpenIcon, false);
      setDisplayed(this.eCloseIcon, false);
    }
  }
  addInIcon(iconName, refName) {
    const eIcon = createIconNoSpan(iconName, this.gridOptionsService, null);
    if (eIcon) {
      this.getRefElement(refName).appendChild(eIcon);
    }
  }
  addGroupExpandIcon() {
    if (!this.params.columnGroup.isExpandable()) {
      setDisplayed(this.eOpenIcon, false);
      setDisplayed(this.eCloseIcon, false);
      return;
    }
  }
  setupLabel() {
    var _a;
    const {
      displayName,
      columnGroup
    } = this.params;
    if (exists(displayName)) {
      const displayNameSanitised = escapeString(displayName);
      this.getRefElement('zingLabel').innerHTML = displayNameSanitised;
    }
    this.addOrRemoveCssClass('zing-sticky-label', !((_a = columnGroup.getColGroupDef()) === null || _a === void 0 ? void 0 : _a.suppressStickyLabel));
  }
}
HeaderGroupComp.TEMPLATE = `<div class="zing-header-group-cell-label" ref="zingContainer" role="presentation">
            <span ref="zingLabel" class="zing-header-group-text" role="presentation"></span>
            <span ref="zingOpened" class="zing-header-icon zing-header-expand-icon zing-header-expand-icon-expanded"></span>
            <span ref="zingClosed" class="zing-header-icon zing-header-expand-icon zing-header-expand-icon-collapsed"></span>
        </div>`;
__decorate([Autowired("columnModel")], HeaderGroupComp.prototype, "columnModel", void 0);
__decorate([RefSelector("zingOpened")], HeaderGroupComp.prototype, "eOpenIcon", void 0);
__decorate([RefSelector("zingClosed")], HeaderGroupComp.prototype, "eCloseIcon", void 0);