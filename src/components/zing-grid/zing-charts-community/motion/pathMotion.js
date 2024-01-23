import * as easing from './easing';
import { FROM_TO_MIXINS } from './fromToMotion';
export function pathMotion(groupId, subId, animationManager, paths, fns) {
  const {
    defaultDuration
  } = animationManager;
  const {
    addPhaseFn,
    updatePhaseFn,
    removePhaseFn
  } = fns;
  const animate = (phase, path, updateFn) => {
    animationManager.animate({
      id: `${groupId}_${subId}_${path.id}_${phase}`,
      groupId,
      from: 0,
      to: 1,
      ease: easing.easeOut,
      onUpdate(ratio, preInit) {
        if (preInit && phase !== 'removed') return;
        path.path.clear({
          trackChanges: true
        });
        updateFn(ratio, path);
        path.checkPathDirty();
      },
      onStop() {
        if (phase !== 'added') return;
        path.path.clear({
          trackChanges: true
        });
        updateFn(1, path);
        path.checkPathDirty();
      },
      duration: FROM_TO_MIXINS[phase].animationDuration * defaultDuration,
      delay: FROM_TO_MIXINS[phase].animationDelay * defaultDuration
    });
  };
  for (const path of paths) {
    if (!animationManager.isSkipped()) {
      animate('removed', path, removePhaseFn);
      animate('updated', path, updatePhaseFn);
    }
    animate('added', path, addPhaseFn);
  }
}