var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, PreConstruct } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { NumberSequence } from "../utils";
import { isNodeOrElement, copyNodeList, iterateNamedNodeMap, loadTemplate, setVisible, setDisplayed } from '../utils/dom';
import { getFunctionName } from '../utils/function';
import { CustomTooltipFeature } from "./customTooltipFeature";
import { CssClassManager } from "../rendering/cssClassManager";
const compIdSequence = new NumberSequence();
export class Component extends BeanStub {
  constructor(template) {
    super();
    this.displayed = true;
    this.visible = true;
    this.compId = compIdSequence.next();
    this.cssClassManager = new CssClassManager(() => this.eGui);
    if (template) {
      this.setTemplate(template);
    }
  }
  preConstructOnComponent() {
    this.usingBrowserTooltips = this.gridOptionsService.get('enableBrowserTooltips');
  }
  getCompId() {
    return this.compId;
  }
  getTooltipParams() {
    return {
      value: this.tooltipText,
      location: 'UNKNOWN'
    };
  }
  setTooltip(newTooltipText, showDelayOverride, hideDelayOverride) {
    const removeTooltip = () => {
      if (this.usingBrowserTooltips) {
        this.getGui().removeAttribute('title');
      } else {
        this.tooltipFeature = this.destroyBean(this.tooltipFeature);
      }
    };
    const addTooltip = () => {
      if (this.usingBrowserTooltips) {
        this.getGui().setAttribute('title', this.tooltipText);
      } else {
        this.tooltipFeature = this.createBean(new CustomTooltipFeature(this, showDelayOverride, hideDelayOverride));
      }
    };
    if (this.tooltipText != newTooltipText) {
      if (this.tooltipText) {
        removeTooltip();
      }
      if (newTooltipText != null) {
        this.tooltipText = newTooltipText;
        if (this.tooltipText) {
          addTooltip();
        }
      }
    }
  }
  createChildComponentsFromTags(parentNode, paramsMap) {
    const childNodeList = copyNodeList(parentNode.childNodes);
    childNodeList.forEach(childNode => {
      if (!(childNode instanceof HTMLElement)) {
        return;
      }
      const childComp = this.createComponentFromElement(childNode, childComp => {
        const childGui = childComp.getGui();
        if (childGui) {
          this.copyAttributesFromNode(childNode, childComp.getGui());
        }
      }, paramsMap);
      if (childComp) {
        if (childComp.addItems && childNode.children.length) {
          this.createChildComponentsFromTags(childNode, paramsMap);
          const items = Array.prototype.slice.call(childNode.children);
          childComp.addItems(items);
        }
        this.swapComponentForNode(childComp, parentNode, childNode);
      } else if (childNode.childNodes) {
        this.createChildComponentsFromTags(childNode, paramsMap);
      }
    });
  }
  createComponentFromElement(element, afterPreCreateCallback, paramsMap) {
    const key = element.nodeName;
    const componentParams = paramsMap ? paramsMap[element.getAttribute('ref')] : undefined;
    const ComponentClass = this.zingStackComponentsRegistry.getComponentClass(key);
    if (ComponentClass) {
      Component.elementGettingCreated = element;
      const newComponent = new ComponentClass(componentParams);
      newComponent.setParentComponent(this);
      this.createBean(newComponent, null, afterPreCreateCallback);
      return newComponent;
    }
    return null;
  }
  copyAttributesFromNode(source, dest) {
    iterateNamedNodeMap(source.attributes, (name, value) => dest.setAttribute(name, value));
  }
  swapComponentForNode(newComponent, parentNode, childNode) {
    const eComponent = newComponent.getGui();
    parentNode.replaceChild(eComponent, childNode);
    parentNode.insertBefore(document.createComment(childNode.nodeName), eComponent);
    this.addDestroyFunc(this.destroyBean.bind(this, newComponent));
    this.swapInComponentForQuerySelectors(newComponent, childNode);
  }
  swapInComponentForQuerySelectors(newComponent, childNode) {
    const thisNoType = this;
    this.iterateOverQuerySelectors(querySelector => {
      if (thisNoType[querySelector.attributeName] === childNode) {
        thisNoType[querySelector.attributeName] = newComponent;
      }
    });
  }
  iterateOverQuerySelectors(action) {
    let thisPrototype = Object.getPrototypeOf(this);
    while (thisPrototype != null) {
      const metaData = thisPrototype.__zingComponentMetaData;
      const currentProtoName = getFunctionName(thisPrototype.constructor);
      if (metaData && metaData[currentProtoName] && metaData[currentProtoName].querySelectors) {
        metaData[currentProtoName].querySelectors.forEach(querySelector => action(querySelector));
      }
      thisPrototype = Object.getPrototypeOf(thisPrototype);
    }
  }
  activateTabIndex(elements) {
    const tabIndex = this.gridOptionsService.get('tabIndex');
    if (!elements) {
      elements = [];
    }
    if (!elements.length) {
      elements.push(this.getGui());
    }
    elements.forEach(el => el.setAttribute('tabindex', tabIndex.toString()));
  }
  setTemplate(template, paramsMap) {
    const eGui = loadTemplate(template);
    this.setTemplateFromElement(eGui, paramsMap);
  }
  setTemplateFromElement(element, paramsMap) {
    this.eGui = element;
    this.eGui.__zingComponent = this;
    this.wireQuerySelectors();
    if (!!this.getContext()) {
      this.createChildComponentsFromTags(this.getGui(), paramsMap);
    }
  }
  createChildComponentsPreConstruct() {
    if (!!this.getGui()) {
      this.createChildComponentsFromTags(this.getGui());
    }
  }
  wireQuerySelectors() {
    if (!this.eGui) {
      return;
    }
    const thisNoType = this;
    this.iterateOverQuerySelectors(querySelector => {
      const setResult = result => thisNoType[querySelector.attributeName] = result;
      const topLevelRefMatch = querySelector.refSelector && this.getAttribute('ref') === querySelector.refSelector;
      if (topLevelRefMatch) {
        setResult(this.eGui);
      } else {
        const resultOfQuery = this.eGui.querySelector(querySelector.querySelector);
        if (resultOfQuery) {
          setResult(resultOfQuery.__zingComponent || resultOfQuery);
        }
      }
    });
  }
  getGui() {
    return this.eGui;
  }
  getFocusableElement() {
    return this.eGui;
  }
  getAriaElement() {
    return this.getFocusableElement();
  }
  setParentComponent(component) {
    this.parentComponent = component;
  }
  getParentComponent() {
    return this.parentComponent;
  }
  setGui(eGui) {
    this.eGui = eGui;
  }
  queryForHtmlElement(cssSelector) {
    return this.eGui.querySelector(cssSelector);
  }
  queryForHtmlInputElement(cssSelector) {
    return this.eGui.querySelector(cssSelector);
  }
  appendChild(newChild, container) {
    if (newChild == null) {
      return;
    }
    if (!container) {
      container = this.eGui;
    }
    if (isNodeOrElement(newChild)) {
      container.appendChild(newChild);
    } else {
      const childComponent = newChild;
      container.appendChild(childComponent.getGui());
    }
  }
  isDisplayed() {
    return this.displayed;
  }
  setVisible(visible, options = {}) {
    if (visible !== this.visible) {
      this.visible = visible;
      const {
        skipAriaHidden
      } = options;
      setVisible(this.eGui, visible, {
        skipAriaHidden
      });
    }
  }
  setDisplayed(displayed, options = {}) {
    if (displayed !== this.displayed) {
      this.displayed = displayed;
      const {
        skipAriaHidden
      } = options;
      setDisplayed(this.eGui, displayed, {
        skipAriaHidden
      });
      const event = {
        type: Component.EVENT_DISPLAYED_CHANGED,
        visible: this.displayed
      };
      this.dispatchEvent(event);
    }
  }
  destroy() {
    if (this.tooltipFeature) {
      this.tooltipFeature = this.destroyBean(this.tooltipFeature);
    }
    if (this.parentComponent) {
      this.parentComponent = undefined;
    }
    const eGui = this.eGui;
    if (eGui && eGui.__zingComponent) {
      eGui.__zingComponent = undefined;
    }
    super.destroy();
  }
  addGuiEventListener(event, listener, options) {
    this.eGui.addEventListener(event, listener, options);
    this.addDestroyFunc(() => this.eGui.removeEventListener(event, listener));
  }
  addCssClass(className) {
    this.cssClassManager.addCssClass(className);
  }
  removeCssClass(className) {
    this.cssClassManager.removeCssClass(className);
  }
  containsCssClass(className) {
    return this.cssClassManager.containsCssClass(className);
  }
  addOrRemoveCssClass(className, addOrRemove) {
    this.cssClassManager.addOrRemoveCssClass(className, addOrRemove);
  }
  getAttribute(key) {
    const {
      eGui
    } = this;
    return eGui ? eGui.getAttribute(key) : null;
  }
  getRefElement(refName) {
    return this.queryForHtmlElement(`[ref="${refName}"]`);
  }
}
Component.EVENT_DISPLAYED_CHANGED = 'displayedChanged';
__decorate([Autowired('zingStackComponentsRegistry')], Component.prototype, "zingStackComponentsRegistry", void 0);
__decorate([PreConstruct], Component.prototype, "preConstructOnComponent", null);
__decorate([PreConstruct], Component.prototype, "createChildComponentsPreConstruct", null);