function linearRoot(a, b) {
  const t = -b / a;
  return a !== 0 && t >= 0 && t <= 1 ? [t] : [];
}
function quadraticRoots(a, b, c) {
  if (a === 0) {
    return linearRoot(b, c);
  }
  const D = b * b - 4 * a * c;
  const roots = [];
  if (D === 0) {
    const t = -b / (2 * a);
    if (t >= 0 && t <= 1) {
      roots.push(t);
    }
  } else if (D > 0) {
    const rD = Math.sqrt(D);
    const t1 = (-b - rD) / (2 * a);
    const t2 = (-b + rD) / (2 * a);
    if (t1 >= 0 && t1 <= 1) {
      roots.push(t1);
    }
    if (t2 >= 0 && t2 <= 1) {
      roots.push(t2);
    }
  }
  return roots;
}
export function cubicRoots(a, b, c, d) {
  if (a === 0) {
    return quadraticRoots(b, c, d);
  }
  const A = b / a;
  const B = c / a;
  const C = d / a;
  const Q = (3 * B - A * A) / 9;
  const R = (9 * A * B - 27 * C - 2 * A * A * A) / 54;
  const D = Q * Q * Q + R * R;
  const third = 1 / 3;
  const roots = [];
  if (D >= 0) {
    const rD = Math.sqrt(D);
    const S = Math.sign(R + rD) * Math.pow(Math.abs(R + rD), third);
    const T = Math.sign(R - rD) * Math.pow(Math.abs(R - rD), third);
    const Im = Math.abs(Math.sqrt(3) * (S - T) / 2);
    const t = -third * A + (S + T);
    if (t >= 0 && t <= 1) {
      roots.push(t);
    }
    if (Im === 0) {
      const t = -third * A - (S + T) / 2;
      if (t >= 0 && t <= 1) {
        roots.push(t);
      }
    }
  } else {
    const theta = Math.acos(R / Math.sqrt(-Q * Q * Q));
    const thirdA = third * A;
    const twoSqrtQ = 2 * Math.sqrt(-Q);
    const t1 = twoSqrtQ * Math.cos(third * theta) - thirdA;
    const t2 = twoSqrtQ * Math.cos(third * (theta + 2 * Math.PI)) - thirdA;
    const t3 = twoSqrtQ * Math.cos(third * (theta + 4 * Math.PI)) - thirdA;
    if (t1 >= 0 && t1 <= 1) {
      roots.push(t1);
    }
    if (t2 >= 0 && t2 <= 1) {
      roots.push(t2);
    }
    if (t3 >= 0 && t3 <= 1) {
      roots.push(t3);
    }
  }
  return roots;
}