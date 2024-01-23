export var RedrawType;
(function (RedrawType) {
  RedrawType[RedrawType["NONE"] = 0] = "NONE";
  RedrawType[RedrawType["TRIVIAL"] = 1] = "TRIVIAL";
  RedrawType[RedrawType["MINOR"] = 2] = "MINOR";
  RedrawType[RedrawType["MAJOR"] = 3] = "MAJOR";
})(RedrawType || (RedrawType = {}));
function functionConstructorAvailable() {
  try {
    new Function('return true');
    return true;
  } catch (e) {
    return false;
  }
}
const STRING_FUNCTION_USEABLE = functionConstructorAvailable();
export function SceneChangeDetection(opts) {
  const {
    changeCb,
    convertor
  } = opts !== null && opts !== void 0 ? opts : {};
  return function (target, key) {
    const privateKey = `__${key}`;
    if (target[key]) {
      return;
    }
    if (STRING_FUNCTION_USEABLE && changeCb == null && convertor == null) {
      prepareFastGetSet(target, key, privateKey, opts);
    } else {
      prepareSlowGetSet(target, key, privateKey, opts);
    }
  };
}
function prepareFastGetSet(target, key, privateKey, opts) {
  const {
    redraw = RedrawType.TRIVIAL,
    type = 'normal',
    checkDirtyOnAssignment = false
  } = opts !== null && opts !== void 0 ? opts : {};
  const setterJs = new Function('value', `
        const oldValue = this.${privateKey};
        if (value !== oldValue) {
            this.${privateKey} = value;
            ${type === 'normal' ? `this.markDirty(this, ${redraw});` : ''}
            ${type === 'transform' ? `this.markDirtyTransform(${redraw});` : ''}
            ${type === 'path' ? `if (!this._dirtyPath) { this._dirtyPath = true; this.markDirty(this, ${redraw}); }` : ''}
            ${type === 'font' ? `if (!this._dirtyFont) { this._dirtyFont = true; this.markDirty(this, ${redraw}); }` : ''}
        }
        ${checkDirtyOnAssignment ? `if (value != null && value._dirty > ${RedrawType.NONE}) { this.markDirty(value, value._dirty); }` : ''}
`);
  const getterJs = new Function(`return this.${privateKey};`);
  Object.defineProperty(target, key, {
    set: setterJs,
    get: getterJs,
    enumerable: true,
    configurable: true
  });
}
function prepareSlowGetSet(target, key, privateKey, opts) {
  const {
    redraw = RedrawType.TRIVIAL,
    type = 'normal',
    changeCb,
    convertor,
    checkDirtyOnAssignment = false
  } = opts !== null && opts !== void 0 ? opts : {};
  const setter = function (value) {
    const oldValue = this[privateKey];
    value = convertor ? convertor(value) : value;
    if (value !== oldValue) {
      this[privateKey] = value;
      if (type === 'normal') this.markDirty(this, redraw);
      if (type === 'transform') this.markDirtyTransform(redraw);
      if (type === 'path' && !this._dirtyPath) {
        this._dirtyPath = true;
        this.markDirty(this, redraw);
      }
      if (type === 'font' && !this._dirtyFont) {
        this._dirtyFont = true;
        this.markDirty(this, redraw);
      }
      if (changeCb) changeCb(this);
    }
    if (checkDirtyOnAssignment && value != null && value._dirty > RedrawType.NONE) this.markDirty(value, value._dirty);
  };
  const getter = function () {
    return this[privateKey];
  };
  Object.defineProperty(target, key, {
    set: setter,
    get: getter,
    enumerable: true,
    configurable: true
  });
}
export class ChangeDetectable {
  constructor() {
    this._dirty = RedrawType.MAJOR;
  }
  markDirty(_source, type = RedrawType.TRIVIAL) {
    if (this._dirty > type) {
      return;
    }
    this._dirty = type;
  }
  markClean(_opts) {
    this._dirty = RedrawType.NONE;
  }
  isDirty() {
    return this._dirty > RedrawType.NONE;
  }
}