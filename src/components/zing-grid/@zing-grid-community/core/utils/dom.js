import { browserSupportsPreventScroll, isBrowserChrome, isBrowserSafari } from './browser';
import { setAriaHidden } from './aria';
import { camelCaseToHyphenated } from './string';
let rtlNegativeScroll;
export function radioCssClass(element, elementClass, otherElementClass) {
  const parent = element.parentElement;
  let sibling = parent && parent.firstChild;
  while (sibling) {
    if (elementClass) {
      sibling.classList.toggle(elementClass, sibling === element);
    }
    if (otherElementClass) {
      sibling.classList.toggle(otherElementClass, sibling !== element);
    }
    sibling = sibling.nextSibling;
  }
}
export const FOCUSABLE_SELECTOR = '[tabindex], input, select, button, textarea, [href]';
export const FOCUSABLE_EXCLUDE = '[disabled], .zing-disabled:not(.zing-button), .zing-disabled *';
export function isFocusableFormField(element) {
  const matches = Element.prototype.matches || Element.prototype.msMatchesSelector;
  const inputSelector = 'input, select, button, textarea';
  const isFocusable = matches.call(element, inputSelector);
  const isNotFocusable = matches.call(element, FOCUSABLE_EXCLUDE);
  const isElementVisible = isVisible(element);
  const focusable = isFocusable && !isNotFocusable && isElementVisible;
  return focusable;
}
export function setDisplayed(element, displayed, options = {}) {
  const {
    skipAriaHidden
  } = options;
  element.classList.toggle('zing-hidden', !displayed);
  if (!skipAriaHidden) {
    setAriaHidden(element, !displayed);
  }
}
export function setVisible(element, visible, options = {}) {
  const {
    skipAriaHidden
  } = options;
  element.classList.toggle('zing-invisible', !visible);
  if (!skipAriaHidden) {
    setAriaHidden(element, !visible);
  }
}
export function setDisabled(element, disabled) {
  const attributeName = 'disabled';
  const addOrRemoveDisabledAttribute = disabled ? e => e.setAttribute(attributeName, '') : e => e.removeAttribute(attributeName);
  addOrRemoveDisabledAttribute(element);
  nodeListForEach(element.querySelectorAll('input'), input => addOrRemoveDisabledAttribute(input));
}
export function isElementChildOfClass(element, cls, maxNest) {
  let counter = 0;
  while (element) {
    if (element.classList.contains(cls)) {
      return true;
    }
    element = element.parentElement;
    if (typeof maxNest == 'number') {
      if (++counter > maxNest) {
        break;
      }
    } else if (element === maxNest) {
      break;
    }
  }
  return false;
}
export function getElementSize(el) {
  const {
    height,
    width,
    borderTopWidth,
    borderRightWidth,
    borderBottomWidth,
    borderLeftWidth,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    boxSizing
  } = window.getComputedStyle(el);
  return {
    height: parseFloat(height),
    width: parseFloat(width),
    borderTopWidth: parseFloat(borderTopWidth),
    borderRightWidth: parseFloat(borderRightWidth),
    borderBottomWidth: parseFloat(borderBottomWidth),
    borderLeftWidth: parseFloat(borderLeftWidth),
    paddingTop: parseFloat(paddingTop),
    paddingRight: parseFloat(paddingRight),
    paddingBottom: parseFloat(paddingBottom),
    paddingLeft: parseFloat(paddingLeft),
    marginTop: parseFloat(marginTop),
    marginRight: parseFloat(marginRight),
    marginBottom: parseFloat(marginBottom),
    marginLeft: parseFloat(marginLeft),
    boxSizing
  };
}
export function getInnerHeight(el) {
  const size = getElementSize(el);
  if (size.boxSizing === 'border-box') {
    return size.height - size.paddingTop - size.paddingBottom;
  }
  return size.height;
}
export function getInnerWidth(el) {
  const size = getElementSize(el);
  if (size.boxSizing === 'border-box') {
    return size.width - size.paddingLeft - size.paddingRight;
  }
  return size.width;
}
export function getAbsoluteHeight(el) {
  const size = getElementSize(el);
  const marginRight = size.marginBottom + size.marginTop;
  return Math.ceil(el.offsetHeight + marginRight);
}
export function getAbsoluteWidth(el) {
  const size = getElementSize(el);
  const marginWidth = size.marginLeft + size.marginRight;
  return Math.ceil(el.offsetWidth + marginWidth);
}
export function getElementRectWithOffset(el) {
  const offsetElementRect = el.getBoundingClientRect();
  const {
    borderTopWidth,
    borderLeftWidth,
    borderRightWidth,
    borderBottomWidth
  } = getElementSize(el);
  return {
    top: offsetElementRect.top + (borderTopWidth || 0),
    left: offsetElementRect.left + (borderLeftWidth || 0),
    right: offsetElementRect.right + (borderRightWidth || 0),
    bottom: offsetElementRect.bottom + (borderBottomWidth || 0)
  };
}
export function isRtlNegativeScroll() {
  if (typeof rtlNegativeScroll === "boolean") {
    return rtlNegativeScroll;
  }
  const template = document.createElement('div');
  template.style.direction = 'rtl';
  template.style.width = '1px';
  template.style.height = '1px';
  template.style.position = 'fixed';
  template.style.top = '0px';
  template.style.overflow = 'hidden';
  template.dir = 'rtl';
  template.innerHTML = `<div style="width: 2px">
            <span style="display: inline-block; width: 1px"></span>
            <span style="display: inline-block; width: 1px"></span>
        </div>`;
  document.body.appendChild(template);
  template.scrollLeft = 1;
  rtlNegativeScroll = Math.floor(template.scrollLeft) === 0;
  document.body.removeChild(template);
  return rtlNegativeScroll;
}
export function getScrollLeft(element, rtl) {
  let scrollLeft = element.scrollLeft;
  if (rtl) {
    scrollLeft = Math.abs(scrollLeft);
    if (isBrowserChrome() && !isRtlNegativeScroll()) {
      scrollLeft = element.scrollWidth - element.clientWidth - scrollLeft;
    }
  }
  return scrollLeft;
}
export function setScrollLeft(element, value, rtl) {
  if (rtl) {
    if (isRtlNegativeScroll()) {
      value *= -1;
    } else if (isBrowserSafari() || isBrowserChrome()) {
      value = element.scrollWidth - element.clientWidth - value;
    }
  }
  element.scrollLeft = value;
}
export function clearElement(el) {
  while (el && el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
export function removeFromParent(node) {
  if (node && node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
export function isVisible(element) {
  const el = element;
  if (el.checkVisibility) {
    return el.checkVisibility({
      checkVisibilityCSS: true
    });
  }
  const isHidden = !element.offsetParent || window.getComputedStyle(element).visibility !== 'visible';
  return !isHidden;
}
export function loadTemplate(template) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = (template || '').trim();
  return tempDiv.firstChild;
}
export function appendHtml(eContainer, htmlTemplate) {
  if (eContainer.lastChild) {
    eContainer.insertAdjacentHTML('afterbegin', htmlTemplate);
  } else {
    eContainer.innerHTML = htmlTemplate;
  }
}
export function offsetHeight(element) {
  return element && element.clientHeight ? element.clientHeight : 0;
}
export function offsetWidth(element) {
  return element && element.clientWidth ? element.clientWidth : 0;
}
export function ensureDomOrder(eContainer, eChild, eChildBefore) {
  if (eChildBefore && eChildBefore.nextSibling === eChild) {
    return;
  }
  const focusedEl = document.activeElement;
  const eChildHasFocus = eChild.contains(focusedEl);
  if (eChildBefore) {
    if (eChildBefore.nextSibling) {
      eContainer.insertBefore(eChild, eChildBefore.nextSibling);
    } else {
      eContainer.appendChild(eChild);
    }
  } else {
    if (eContainer.firstChild && eContainer.firstChild !== eChild) {
      eContainer.insertAdjacentElement('afterbegin', eChild);
    }
  }
  if (eChildHasFocus && focusedEl && browserSupportsPreventScroll()) {
    focusedEl.focus({
      preventScroll: true
    });
  }
}
export function setDomChildOrder(eContainer, orderedChildren) {
  for (let i = 0; i < orderedChildren.length; i++) {
    const correctCellAtIndex = orderedChildren[i];
    const actualCellAtIndex = eContainer.children[i];
    if (actualCellAtIndex !== correctCellAtIndex) {
      eContainer.insertBefore(correctCellAtIndex, actualCellAtIndex);
    }
  }
}
export function insertWithDomOrder(eContainer, eToInsert, eChildBefore) {
  if (eChildBefore) {
    eChildBefore.insertAdjacentElement('afterend', eToInsert);
  } else {
    if (eContainer.firstChild) {
      eContainer.insertAdjacentElement('afterbegin', eToInsert);
    } else {
      eContainer.appendChild(eToInsert);
    }
  }
}
export function addStylesToElement(eElement, styles) {
  if (!styles) {
    return;
  }
  for (const [key, value] of Object.entries(styles)) {
    if (!key || !key.length || value == null) {
      continue;
    }
    const parsedKey = camelCaseToHyphenated(key);
    const valueAsString = value.toString();
    const parsedValue = valueAsString.replace(/\s*!important/g, '');
    const priority = parsedValue.length != valueAsString.length ? 'important' : undefined;
    eElement.style.setProperty(parsedKey, parsedValue, priority);
  }
}
export function isHorizontalScrollShowing(element) {
  return element.clientWidth < element.scrollWidth;
}
export function isVerticalScrollShowing(element) {
  return element.clientHeight < element.scrollHeight;
}
export function setElementWidth(element, width) {
  if (width === 'flex') {
    element.style.removeProperty('width');
    element.style.removeProperty('minWidth');
    element.style.removeProperty('maxWidth');
    element.style.flex = '1 1 auto';
  } else {
    setFixedWidth(element, width);
  }
}
export function setFixedWidth(element, width) {
  width = formatSize(width);
  element.style.width = width.toString();
  element.style.maxWidth = width.toString();
  element.style.minWidth = width.toString();
}
export function setElementHeight(element, height) {
  if (height === 'flex') {
    element.style.removeProperty('height');
    element.style.removeProperty('minHeight');
    element.style.removeProperty('maxHeight');
    element.style.flex = '1 1 auto';
  } else {
    setFixedHeight(element, height);
  }
}
export function setFixedHeight(element, height) {
  height = formatSize(height);
  element.style.height = height.toString();
  element.style.maxHeight = height.toString();
  element.style.minHeight = height.toString();
}
export function formatSize(size) {
  if (typeof size === 'number') {
    return `${size}px`;
  }
  return size;
}
export function isNodeOrElement(o) {
  return o instanceof Node || o instanceof HTMLElement;
}
export function copyNodeList(nodeList) {
  if (nodeList == null) {
    return [];
  }
  const result = [];
  nodeListForEach(nodeList, node => result.push(node));
  return result;
}
export function iterateNamedNodeMap(map, callback) {
  if (!map) {
    return;
  }
  for (let i = 0; i < map.length; i++) {
    const attr = map[i];
    callback(attr.name, attr.value);
  }
}
export function addOrRemoveAttribute(element, name, value) {
  if (value == null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value.toString());
  }
}
export function nodeListForEach(nodeList, action) {
  if (nodeList == null) {
    return;
  }
  for (let i = 0; i < nodeList.length; i++) {
    action(nodeList[i]);
  }
}
export function bindCellRendererToHtmlElement(cellRendererPromise, eTarget) {
  cellRendererPromise.then(cellRenderer => {
    const gui = cellRenderer.getGui();
    if (gui != null) {
      if (typeof gui === 'object') {
        eTarget.appendChild(gui);
      } else {
        eTarget.innerHTML = gui;
      }
    }
  });
}