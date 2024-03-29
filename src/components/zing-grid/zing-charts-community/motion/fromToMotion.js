var __rest = this && this.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
import { zipObject } from '../util/zip';
import { ADD_PHASE, INITIAL_LOAD, REMOVE_PHASE, UPDATE_PHASE, deconstructSelectionsOrNodes } from './animation';
import * as easing from './easing';
export const NODE_UPDATE_PHASES = ['removed', 'updated', 'added'];
export const FROM_TO_MIXINS = {
  added: ADD_PHASE,
  updated: UPDATE_PHASE,
  removed: REMOVE_PHASE,
  unknown: INITIAL_LOAD
};
export function fromToMotion(groupId, subId, animationManager, selectionsOrNodes, fns, getDatumId, diff) {
  const {
    defaultDuration
  } = animationManager;
  const {
    fromFn,
    toFn,
    intermediateFn
  } = fns;
  const {
    nodes,
    selections
  } = deconstructSelectionsOrNodes(selectionsOrNodes);
  const ids = {
    added: {},
    removed: {}
  };
  if (getDatumId && diff) {
    ids.added = zipObject(diff.added, true);
    ids.removed = zipObject(diff.removed, true);
  }
  const processNodes = (liveNodes, nodes) => {
    var _a, _b;
    let prevFromProps;
    let liveNodeIndex = 0;
    let nodeIndex = 0;
    for (const node of nodes) {
      const isLive = liveNodes[liveNodeIndex] === node;
      const ctx = {
        last: nodeIndex >= nodes.length - 1,
        lastLive: liveNodeIndex >= liveNodes.length - 1,
        prev: nodes[nodeIndex - 1],
        prevFromProps,
        prevLive: liveNodes[liveNodeIndex - 1],
        next: nodes[nodeIndex + 1],
        nextLive: liveNodes[liveNodeIndex + (isLive ? 1 : 0)]
      };
      const animationId = `${groupId}_${subId}_${node.id}`;
      animationManager.stopByAnimationId(animationId);
      let status = 'unknown';
      if (!isLive) {
        status = 'removed';
      } else if (getDatumId && diff) {
        status = calculateStatus(node, node.datum, getDatumId, ids);
      }
      const _c = fromFn(node, node.datum, status, ctx),
        {
          animationDelay: delay,
          animationDuration: duration,
          start = {},
          finish = {}
        } = _c,
        from = __rest(_c, ["animationDelay", "animationDuration", "start", "finish"]);
      const _d = toFn(node, node.datum, status, ctx),
        {
          animationDelay: toDelay,
          animationDuration: toDuration,
          start: toStart = {},
          finish: toFinish = {}
        } = _d,
        to = __rest(_d, ["animationDelay", "animationDuration", "start", "finish"]);
      animationManager.animate({
        id: animationId,
        groupId,
        from: from,
        to: to,
        ease: easing.easeOut,
        onPlay: () => {
          node.setProperties(Object.assign(Object.assign({}, start), toStart));
        },
        onUpdate(props) {
          node.setProperties(props);
          if (intermediateFn) {
            node.setProperties(intermediateFn(node, node.datum, status, ctx));
          }
        },
        onStop: () => {
          node.setProperties(Object.assign(Object.assign(Object.assign({}, to), finish), toFinish));
        },
        duration: ((_a = duration !== null && duration !== void 0 ? duration : toDuration) !== null && _a !== void 0 ? _a : 1) * defaultDuration,
        delay: ((_b = delay !== null && delay !== void 0 ? delay : toDelay) !== null && _b !== void 0 ? _b : 0) * defaultDuration
      });
      if (isLive) {
        liveNodeIndex++;
      }
      nodeIndex++;
      prevFromProps = from;
    }
  };
  let selectionIndex = 0;
  for (const selection of selections) {
    const nodes = selection.nodes();
    const liveNodes = nodes.filter(n => !selection.isGarbage(n));
    processNodes(liveNodes, nodes);
    animationManager.animate({
      id: `${groupId}_${subId}_selection_${selectionIndex}`,
      groupId,
      from: 0,
      to: 1,
      ease: easing.easeOut,
      onStop() {
        selection.cleanup();
      }
    });
    selectionIndex++;
  }
  processNodes(nodes, nodes);
}
export function staticFromToMotion(groupId, subId, animationManager, selectionsOrNodes, from, to, extraOpts = {}) {
  const {
    nodes,
    selections
  } = deconstructSelectionsOrNodes(selectionsOrNodes);
  const {
    animationDelay = 0,
    animationDuration = 1,
    start = {},
    finish = {}
  } = extraOpts;
  const {
    defaultDuration
  } = animationManager;
  animationManager.animate({
    id: `${groupId}_${subId}`,
    groupId,
    from,
    to,
    ease: easing.easeOut,
    onPlay: () => {
      for (const node of nodes) {
        node.setProperties(start);
      }
      for (const selection of selections) {
        for (const node of selection.nodes()) {
          node.setProperties(start);
        }
      }
    },
    onUpdate(props) {
      for (const node of nodes) {
        node.setProperties(props);
      }
      for (const selection of selections) {
        for (const node of selection.nodes()) {
          node.setProperties(props);
        }
      }
    },
    onStop: () => {
      for (const node of nodes) {
        node.setProperties(Object.assign(Object.assign({}, to), finish));
      }
      for (const selection of selections) {
        for (const node of selection.nodes()) {
          node.setProperties(Object.assign(Object.assign({}, to), finish));
        }
      }
    },
    duration: animationDuration * defaultDuration,
    delay: animationDelay * defaultDuration
  });
}
function calculateStatus(node, datum, getDatumId, ids) {
  const id = getDatumId(node, datum);
  if (ids.added[id]) {
    return 'added';
  } else if (ids.removed[id]) {
    return 'removed';
  }
  return 'updated';
}