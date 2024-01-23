import { Debug } from '../util/debug';
import { Node } from './node';
export class Selection {
  static select(parent, classOrFactory, garbageCollection = true) {
    return new Selection(parent, classOrFactory, garbageCollection);
  }
  static selectAll(parent, predicate) {
    const results = [];
    const traverse = node => {
      if (predicate(node)) {
        results.push(node);
      }
      node.children.forEach(traverse);
    };
    traverse(parent);
    return results;
  }
  static selectByClass(node, Class) {
    return Selection.selectAll(node, node => node instanceof Class);
  }
  static selectByTag(node, tag) {
    return Selection.selectAll(node, node => node.tag === tag);
  }
  constructor(parentNode, classOrFactory, autoCleanup = true) {
    this.parentNode = parentNode;
    this.autoCleanup = autoCleanup;
    this.garbageBin = new Set();
    this._nodesMap = new Map();
    this._nodes = [];
    this.data = [];
    this.debug = Debug.create(true, 'scene', 'scene:selections');
    this.nodeFactory = Object.prototype.isPrototypeOf.call(Node, classOrFactory) ? () => new classOrFactory() : classOrFactory;
  }
  createNode(datum, initializer, idx) {
    const node = this.nodeFactory(datum);
    node.datum = datum;
    initializer === null || initializer === void 0 ? void 0 : initializer(node);
    if (idx != null) {
      this._nodes.splice(idx, 0, node);
    } else {
      this._nodes.push(node);
    }
    this.parentNode.appendChild(node);
    return node;
  }
  update(data, initializer, getDatumId) {
    if (this.garbageBin.size > 0) {
      this.debug(`Selection - update() called with pending garbage: ${data}`);
    }
    if (getDatumId) {
      const dataMap = new Map(data.map((datum, idx) => [getDatumId(datum), [datum, idx]]));
      for (const [node, datumId] of this._nodesMap.entries()) {
        if (dataMap.has(datumId)) {
          const [newDatum] = dataMap.get(datumId);
          node.datum = newDatum;
          this.garbageBin.delete(node);
          dataMap.delete(datumId);
        } else {
          this.garbageBin.add(node);
        }
      }
      for (const [datumId, [datum, idx]] of dataMap.entries()) {
        this._nodesMap.set(this.createNode(datum, initializer, idx), datumId);
      }
    } else {
      const maxLength = Math.max(data.length, this.data.length);
      for (let i = 0; i < maxLength; i++) {
        if (i >= data.length) {
          this.garbageBin.add(this._nodes[i]);
        } else if (i >= this._nodes.length) {
          this.createNode(data[i], initializer);
        } else {
          this._nodes[i].datum = data[i];
          this.garbageBin.delete(this._nodes[i]);
        }
      }
    }
    this.data = data.slice();
    if (this.autoCleanup) {
      this.cleanup();
    }
    return this;
  }
  cleanup() {
    if (this.garbageBin.size === 0) {
      return this;
    }
    this._nodes = this._nodes.filter(node => {
      if (this.garbageBin.has(node)) {
        this._nodesMap.delete(node);
        this.garbageBin.delete(node);
        this.parentNode.removeChild(node);
        return false;
      }
      return true;
    });
    return this;
  }
  clear() {
    this.update([]);
    return this;
  }
  isGarbage(node) {
    return this.garbageBin.has(node);
  }
  hasGarbage() {
    return this.garbageBin.size > 0;
  }
  each(iterate) {
    this._nodes.forEach((node, i) => iterate(node, node.datum, i));
    return this;
  }
  *[Symbol.iterator]() {
    for (let index = 0; index < this._nodes.length; index++) {
      const node = this._nodes[index];
      const datum = this._nodes[index].datum;
      yield {
        node,
        datum,
        index
      };
    }
  }
  select(predicate) {
    return Selection.selectAll(this.parentNode, predicate);
  }
  selectByClass(Class) {
    return Selection.selectByClass(this.parentNode, Class);
  }
  selectByTag(tag) {
    return Selection.selectByTag(this.parentNode, tag);
  }
  nodes() {
    return this._nodes;
  }
}