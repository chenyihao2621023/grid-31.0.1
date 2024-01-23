export class CssClassManager {
  constructor(getGui) {
    this.cssClassStates = {};
    this.getGui = getGui;
  }
  addCssClass(className) {
    const list = (className || '').split(' ');
    if (list.length > 1) {
      list.forEach(cls => this.addCssClass(cls));
      return;
    }
    const updateNeeded = this.cssClassStates[className] !== true;
    if (updateNeeded && className.length) {
      const eGui = this.getGui();
      if (eGui) {
        eGui.classList.add(className);
      }
      this.cssClassStates[className] = true;
    }
  }
  removeCssClass(className) {
    const list = (className || '').split(' ');
    if (list.length > 1) {
      list.forEach(cls => this.removeCssClass(cls));
      return;
    }
    const updateNeeded = this.cssClassStates[className] !== false;
    if (updateNeeded && className.length) {
      const eGui = this.getGui();
      if (eGui) {
        eGui.classList.remove(className);
      }
      this.cssClassStates[className] = false;
    }
  }
  containsCssClass(className) {
    const eGui = this.getGui();
    if (!eGui) {
      return false;
    }
    return eGui.classList.contains(className);
  }
  addOrRemoveCssClass(className, addOrRemove) {
    if (!className) {
      return;
    }
    if (className.indexOf(' ') >= 0) {
      const list = (className || '').split(' ');
      if (list.length > 1) {
        list.forEach(cls => this.addOrRemoveCssClass(cls, addOrRemove));
        return;
      }
    }
    const updateNeeded = this.cssClassStates[className] !== addOrRemove;
    if (updateNeeded && className.length) {
      const eGui = this.getGui();
      if (eGui) {
        eGui.classList.toggle(className, addOrRemove);
      }
      this.cssClassStates[className] = addOrRemove;
    }
  }
}