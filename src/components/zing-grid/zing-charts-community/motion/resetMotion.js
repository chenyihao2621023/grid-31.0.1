import { deconstructSelectionsOrNodes } from './animation';
export function resetMotion(selectionsOrNodes, propsFn) {
  const {
    nodes,
    selections
  } = deconstructSelectionsOrNodes(selectionsOrNodes);
  for (const selection of selections) {
    for (const node of selection.nodes()) {
      const from = propsFn(node, node.datum);
      node.setProperties(from);
    }
    selection.cleanup();
  }
  for (const node of nodes) {
    const from = propsFn(node, node.datum);
    node.setProperties(from);
  }
}