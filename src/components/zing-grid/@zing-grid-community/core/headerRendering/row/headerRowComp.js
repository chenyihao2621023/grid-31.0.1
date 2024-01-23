var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PostConstruct, PreDestroy } from '../../context/context';
import { setAriaRowIndex } from '../../utils/aria';
import { setDomChildOrder } from '../../utils/dom';
import { getAllValuesInObject, iterateObject } from '../../utils/object';
import { Component } from '../../widgets/component';
import { HeaderCellComp } from '../cells/column/headerCellComp';
import { HeaderGroupCellComp } from '../cells/columnGroup/headerGroupCellComp';
import { HeaderFilterCellComp } from '../cells/floatingFilter/headerFilterCellComp';
export var HeaderRowType;
(function (HeaderRowType) {
  HeaderRowType["COLUMN_GROUP"] = "group";
  HeaderRowType["COLUMN"] = "column";
  HeaderRowType["FLOATING_FILTER"] = "filter";
})(HeaderRowType || (HeaderRowType = {}));
export class HeaderRowComp extends Component {
  constructor(ctrl) {
    super();
    this.headerComps = {};
    this.ctrl = ctrl;
    this.setTemplate(`<div class="${this.ctrl.getHeaderRowClass()}" role="row"></div>`);
  }
  init() {
    this.getGui().style.transform = this.ctrl.getTransform();
    setAriaRowIndex(this.getGui(), this.ctrl.getAriaRowIndex());
    const compProxy = {
      setHeight: height => this.getGui().style.height = height,
      setTop: top => this.getGui().style.top = top,
      setHeaderCtrls: (ctrls, forceOrder) => this.setHeaderCtrls(ctrls, forceOrder),
      setWidth: width => this.getGui().style.width = width
    };
    this.ctrl.setComp(compProxy);
  }
  destroyHeaderCtrls() {
    this.setHeaderCtrls([], false);
  }
  setHeaderCtrls(ctrls, forceOrder) {
    if (!this.isAlive()) {
      return;
    }
    const oldComps = this.headerComps;
    this.headerComps = {};
    ctrls.forEach(ctrl => {
      const id = ctrl.getInstanceId();
      let comp = oldComps[id];
      delete oldComps[id];
      if (comp == null) {
        comp = this.createHeaderComp(ctrl);
        this.getGui().appendChild(comp.getGui());
      }
      this.headerComps[id] = comp;
    });
    iterateObject(oldComps, (id, comp) => {
      this.getGui().removeChild(comp.getGui());
      this.destroyBean(comp);
    });
    if (forceOrder) {
      const comps = getAllValuesInObject(this.headerComps);
      comps.sort((a, b) => {
        const leftA = a.getCtrl().getColumnGroupChild().getLeft();
        const leftB = b.getCtrl().getColumnGroupChild().getLeft();
        return leftA - leftB;
      });
      const elementsInOrder = comps.map(c => c.getGui());
      setDomChildOrder(this.getGui(), elementsInOrder);
    }
  }
  createHeaderComp(headerCtrl) {
    let result;
    switch (this.ctrl.getType()) {
      case HeaderRowType.COLUMN_GROUP:
        result = new HeaderGroupCellComp(headerCtrl);
        break;
      case HeaderRowType.FLOATING_FILTER:
        result = new HeaderFilterCellComp(headerCtrl);
        break;
      default:
        result = new HeaderCellComp(headerCtrl);
        break;
    }
    this.createBean(result);
    result.setParentComponent(this);
    return result;
  }
}
__decorate([PostConstruct], HeaderRowComp.prototype, "init", null);
__decorate([PreDestroy], HeaderRowComp.prototype, "destroyHeaderCtrls", null);