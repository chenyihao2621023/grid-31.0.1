import { LABEL_PHASE } from '../../motion/animation';
import { staticFromToMotion } from '../../motion/fromToMotion';
export function seriesLabelFadeInAnimation({
  id
}, subId, animationManager, labelSelections) {
  staticFromToMotion(id, subId, animationManager, labelSelections, {
    opacity: 0
  }, {
    opacity: 1
  }, LABEL_PHASE);
}
export function seriesLabelFadeOutAnimation({
  id
}, subId, animationManager, labelSelections) {
  staticFromToMotion(id, subId, animationManager, labelSelections, {
    opacity: 1
  }, {
    opacity: 0
  }, LABEL_PHASE);
}
export function resetLabelFn(_node) {
  return {
    opacity: 1
  };
}