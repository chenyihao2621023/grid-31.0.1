import { hasConstrainedCanvasMemory } from '../../util/userAgent';
export class HdpiCanvas {
  constructor(opts) {
    this._enabled = true;
    this._pixelRatio = NaN;
    this._width = 0;
    this._height = 0;
    const {
      document,
      window,
      width = 600,
      height = 300,
      domLayer = false,
      zIndex = 0,
      name = undefined,
      overrideDevicePixelRatio = undefined
    } = opts;
    this.document = document;
    this.window = window;
    HdpiCanvas.document = document;
    this.element = document.createElement('canvas');
    this.element.width = width;
    this.element.height = height;
    this.realContext = this.element.getContext('2d');
    this.imageSource = this.realContext.canvas;
    const {
      style
    } = this.element;
    style.userSelect = 'none';
    style.display = 'block';
    if (domLayer) {
      style.position = 'absolute';
      style.zIndex = String(zIndex);
      style.top = '0';
      style.left = '0';
      style.pointerEvents = 'none';
      style.opacity = `1`;
      if (name) {
        this.element.id = name;
      }
    }
    this.context = this.setPixelRatio(overrideDevicePixelRatio);
    this.resize(width, height);
  }
  set container(value) {
    if (this._container !== value) {
      this.remove();
      if (value) {
        value.appendChild(this.element);
      }
      this._container = value;
    }
  }
  get container() {
    return this._container;
  }
  set enabled(value) {
    this.element.style.display = value ? 'block' : 'none';
    this._enabled = !!value;
  }
  get enabled() {
    return this._enabled;
  }
  remove() {
    const {
      parentNode
    } = this.element;
    if (parentNode != null) {
      parentNode.removeChild(this.element);
    }
  }
  destroy() {
    this.element.remove();
    this.element.width = 0;
    this.element.height = 0;
    this.context.clearRect(0, 0, 0, 0);
    Object.freeze(this);
  }
  snapshot() {}
  clear() {
    this.context.save();
    this.context.resetTransform();
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.restore();
  }
  toImage() {
    const img = this.document.createElement('img');
    img.src = this.getDataURL();
    return img;
  }
  getDataURL(type) {
    return this.element.toDataURL(type);
  }
  download(fileName, fileFormat = 'image/png') {
    fileName = (fileName !== null && fileName !== void 0 ? fileName : '').trim() || 'image';
    const dataUrl = this.getDataURL(fileFormat);
    const document = this.document;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  get pixelRatio() {
    return this._pixelRatio;
  }
  setPixelRatio(ratio) {
    let pixelRatio = ratio !== null && ratio !== void 0 ? ratio : this.window.devicePixelRatio;
    if (hasConstrainedCanvasMemory()) {
      pixelRatio = 1;
    }
    this._pixelRatio = pixelRatio;
    return HdpiCanvas.overrideScale(this.realContext, pixelRatio);
  }
  set pixelated(value) {
    this.element.style.imageRendering = value ? 'pixelated' : 'auto';
  }
  get pixelated() {
    return this.element.style.imageRendering === 'pixelated';
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  resize(width, height) {
    if (!(width > 0 && height > 0)) {
      return;
    }
    const {
      element,
      context,
      pixelRatio
    } = this;
    element.width = Math.round(width * pixelRatio);
    element.height = Math.round(height * pixelRatio);
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    context.resetTransform();
    this._width = width;
    this._height = height;
  }
  static get textMeasuringContext() {
    if (this._textMeasuringContext) {
      return this._textMeasuringContext;
    }
    const canvas = this.document.createElement('canvas');
    this._textMeasuringContext = canvas.getContext('2d');
    return this._textMeasuringContext;
  }
  static get svgText() {
    if (this._svgText) {
      return this._svgText;
    }
    const xmlns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(xmlns, 'svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');
    if (svg.classList) {
      svg.classList.add('text-measuring-svg');
    } else {
      svg.setAttribute('class', 'text-measuring-svg');
    }
    svg.style.position = 'absolute';
    svg.style.top = '-1000px';
    svg.style.visibility = 'hidden';
    const svgText = document.createElementNS(xmlns, 'text');
    svgText.setAttribute('x', '0');
    svgText.setAttribute('y', '30');
    svgText.setAttribute('text', 'black');
    svg.appendChild(svgText);
    document.body.appendChild(svg);
    this._svgText = svgText;
    return svgText;
  }
  static get has() {
    if (this._has) {
      return this._has;
    }
    const isChrome = typeof navigator === 'undefined' || navigator.userAgent.indexOf('Chrome') > -1;
    const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Firefox') > -1;
    const isSafari = !isChrome && typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Safari') > -1;
    this._has = Object.freeze({
      textMetrics: this.textMeasuringContext.measureText('test').actualBoundingBoxDescent !== undefined && !isFirefox && !isSafari,
      getTransform: this.textMeasuringContext.getTransform !== undefined
    });
    return this._has;
  }
  static measureText(text, font, textBaseline, textAlign) {
    const ctx = this.textMeasuringContext;
    ctx.font = font;
    ctx.textBaseline = textBaseline;
    ctx.textAlign = textAlign;
    return ctx.measureText(text);
  }
  static getTextSize(text, font) {
    if (this.has.textMetrics) {
      const ctx = this.textMeasuringContext;
      ctx.font = font;
      const metrics = ctx.measureText(text);
      return {
        width: metrics.width,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
      };
    } else {
      return this.measureSvgText(text, font);
    }
  }
  static measureSvgText(text, font) {
    const cache = this.textSizeCache;
    const fontCache = cache[font];
    if (fontCache) {
      const size = fontCache[text];
      if (size) {
        return size;
      }
    } else {
      cache[font] = {};
    }
    const svgText = this.svgText;
    svgText.style.font = font;
    svgText.textContent = text;
    const bbox = svgText.getBBox();
    const size = {
      width: bbox.width,
      height: bbox.height
    };
    cache[font][text] = size;
    return size;
  }
  static overrideScale(ctx, scale) {
    let depth = 0;
    const overrides = {
      save() {
        this.$save();
        depth++;
      },
      restore() {
        if (depth > 0) {
          this.$restore();
          depth--;
        } else {
          throw new Error('ZING Charts - Unable to restore() past depth 0');
        }
      },
      setTransform(a, b, c, d, e, f) {
        if (typeof a === 'object') {
          this.$setTransform(a);
        } else {
          this.$setTransform(a * scale, b * scale, c * scale, d * scale, e * scale, f * scale);
        }
      },
      resetTransform() {
        this.$setTransform(scale, 0, 0, scale, 0, 0);
      },
      verifyDepthZero() {
        if (depth !== 0) {
          throw new Error('ZING Charts - Save/restore depth is non-zero: ' + depth);
        }
      }
    };
    for (const name in overrides) {
      if (Object.hasOwn(overrides, name)) {
        if (!ctx['$' + name]) {
          ctx['$' + name] = ctx[name];
        }
        ctx[name] = overrides[name];
      }
    }
    return ctx;
  }
}
HdpiCanvas.document = globalThis.document;
HdpiCanvas.textSizeCache = {};