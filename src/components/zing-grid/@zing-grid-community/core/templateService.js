var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Bean } from "./context/context";
import { BeanStub } from "./context/beanStub";
let TemplateService = class TemplateService extends BeanStub {
  constructor() {
    super(...arguments);
    this.templateCache = {};
    this.waitingCallbacks = {};
  }
  getTemplate(url, callback) {
    const templateFromCache = this.templateCache[url];
    if (templateFromCache) {
      return templateFromCache;
    }
    let callbackList = this.waitingCallbacks[url];
    const that = this;
    if (!callbackList) {
      callbackList = [];
      this.waitingCallbacks[url] = callbackList;
      const client = new XMLHttpRequest();
      client.onload = function () {
        that.handleHttpResult(this, url);
      };
      client.open("GET", url);
      client.send();
    }
    if (callback) {
      callbackList.push(callback);
    }
    return null;
  }
  handleHttpResult(httpResult, url) {
    if (httpResult.status !== 200 || httpResult.response === null) {
      console.warn(`ZING Grid: Unable to get template error ${httpResult.status} - ${url}`);
      return;
    }
    this.templateCache[url] = httpResult.response || httpResult.responseText;
    const callbacks = this.waitingCallbacks[url];
    for (let i = 0; i < callbacks.length; i++) {
      const callback = callbacks[i];
      callback();
    }
  }
};
TemplateService = __decorate([Bean('templateService')], TemplateService);
export { TemplateService };