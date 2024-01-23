import { arcIntersections, cubicSegmentIntersections, segmentIntersection } from './intersection';
var Command;
(function (Command) {
  Command[Command["Move"] = 0] = "Move";
  Command[Command["Line"] = 1] = "Line";
  Command[Command["Arc"] = 2] = "Arc";
  Command[Command["Curve"] = 3] = "Curve";
  Command[Command["ClosePath"] = 4] = "ClosePath";
})(Command || (Command = {}));
export class Path2D {
  constructor() {
    this.previousCommands = [];
    this.previousParams = [];
    this.previousClosedPath = false;
    this.commands = [];
    this.params = [];
    this._closedPath = false;
  }
  isDirty() {
    if (this._closedPath !== this.previousClosedPath) {
      return true;
    }
    if (this.previousCommands.length !== this.commands.length) {
      return true;
    }
    if (this.previousParams.length !== this.params.length) {
      return true;
    }
    for (let i = 0; i < this.commands.length; i++) {
      if (this.commands[i] !== this.previousCommands[i]) {
        return true;
      }
    }
    for (let i = 0; i < this.params.length; i++) {
      if (this.params[i] !== this.previousParams[i]) {
        return true;
      }
    }
    return false;
  }
  draw(ctx) {
    const commands = this.commands;
    const params = this.params;
    let j = 0;
    ctx.beginPath();
    for (const command of commands) {
      switch (command) {
        case Command.Move:
          ctx.moveTo(params[j++], params[j++]);
          break;
        case Command.Line:
          ctx.lineTo(params[j++], params[j++]);
          break;
        case Command.Curve:
          ctx.bezierCurveTo(params[j++], params[j++], params[j++], params[j++], params[j++], params[j++]);
          break;
        case Command.Arc:
          ctx.arc(params[j++], params[j++], params[j++], params[j++], params[j++], params[j++] === 1);
          break;
        case Command.ClosePath:
          ctx.closePath();
          break;
      }
    }
    if (commands.length === 0) {
      ctx.closePath();
    }
  }
  moveTo(x, y) {
    if (this.xy) {
      this.xy[0] = x;
      this.xy[1] = y;
    } else {
      this.xy = [x, y];
    }
    this.commands.push(Command.Move);
    this.params.push(x, y);
  }
  lineTo(x, y) {
    if (this.xy) {
      this.commands.push(Command.Line);
      this.params.push(x, y);
      this.xy[0] = x;
      this.xy[1] = y;
    } else {
      this.moveTo(x, y);
    }
  }
  rect(x, y, width, height) {
    this.moveTo(x, y);
    this.lineTo(x + width, y);
    this.lineTo(x + width, y + height);
    this.lineTo(x, y + height);
    this.closePath();
  }
  roundRect(x, y, width, height, radii) {
    radii = Math.min(radii, width / 2, height / 2);
    this.moveTo(x, y + radii);
    this.arc(x + radii, y + radii, radii, Math.PI, 3 * Math.PI / 2);
    this.lineTo(x + radii, y);
    this.lineTo(x + width - radii, y);
    this.arc(x + width - radii, y + radii, radii, 3 * Math.PI / 2, 2 * Math.PI);
    this.lineTo(x + width, y + radii);
    this.lineTo(x + width, y + height - radii);
    this.arc(x + width - radii, y + height - radii, radii, 0, Math.PI / 2);
    this.lineTo(x + width - radii, y + height);
    this.lineTo(x + radii, y + height);
    this.arc(x + +radii, y + height - radii, radii, Math.PI / 2, Math.PI);
    this.lineTo(x, y + height - radii);
    this.closePath();
  }
  arc(x, y, r, sAngle, eAngle, antiClockwise = false) {
    const endX = x + r * Math.cos(eAngle);
    const endY = y + r * Math.sin(eAngle);
    if (this.xy) {
      this.xy[0] = endX;
      this.xy[1] = endY;
    } else {
      this.xy = [endX, endY];
    }
    this.commands.push(Command.Arc);
    this.params.push(x, y, r, sAngle, eAngle, antiClockwise ? 1 : 0);
  }
  cubicCurveTo(cx1, cy1, cx2, cy2, x, y) {
    if (!this.xy) {
      this.moveTo(cx1, cy1);
    }
    this.commands.push(Command.Curve);
    this.params.push(cx1, cy1, cx2, cy2, x, y);
    if (this.xy) {
      this.xy[0] = x;
      this.xy[1] = y;
    }
  }
  get closedPath() {
    return this._closedPath;
  }
  closePath() {
    if (this.xy) {
      this.xy = undefined;
      this.commands.push(Command.ClosePath);
      this._closedPath = true;
    }
  }
  clear({
    trackChanges
  } = {
    trackChanges: false
  }) {
    if (trackChanges) {
      this.previousCommands = this.commands;
      this.previousParams = this.params;
      this.previousClosedPath = this._closedPath;
      this.commands = [];
      this.params = [];
    } else {
      this.commands.length = 0;
      this.params.length = 0;
    }
    this.xy = undefined;
    this._closedPath = false;
  }
  isPointInPath(x, y) {
    const commands = this.commands;
    const params = this.params;
    const cn = commands.length;
    const ox = -10000;
    const oy = -10000;
    let sx = NaN;
    let sy = NaN;
    let px = 0;
    let py = 0;
    let intersectionCount = 0;
    for (let ci = 0, pi = 0; ci < cn; ci++) {
      switch (commands[ci]) {
        case Command.Move:
          if (!isNaN(sx) && segmentIntersection(sx, sy, px, py, ox, oy, x, y)) {
            intersectionCount++;
          }
          px = params[pi++];
          sx = px;
          py = params[pi++];
          sy = py;
          break;
        case Command.Line:
          if (segmentIntersection(px, py, params[pi++], params[pi++], ox, oy, x, y)) {
            intersectionCount++;
          }
          px = params[pi - 2];
          py = params[pi - 1];
          break;
        case Command.Curve:
          intersectionCount += cubicSegmentIntersections(px, py, params[pi++], params[pi++], params[pi++], params[pi++], params[pi++], params[pi++], ox, oy, x, y).length;
          px = params[pi - 2];
          py = params[pi - 1];
          break;
        case Command.Arc:
          const cx = params[pi++];
          const cy = params[pi++];
          const r = params[pi++];
          const startAngle = params[pi++];
          const endAngle = params[pi++];
          const counterClockwise = Boolean(params[pi++]);
          intersectionCount += arcIntersections(cx, cy, r, startAngle, endAngle, counterClockwise, ox, oy, x, y).length;
          px = cx + Math.cos(endAngle) * r;
          py = cy + Math.sin(endAngle) * r;
          break;
        case Command.ClosePath:
          if (!isNaN(sx) && segmentIntersection(sx, sy, px, py, ox, oy, x, y)) {
            intersectionCount++;
          }
          break;
      }
    }
    return intersectionCount % 2 === 1;
  }
  getPoints() {
    const {
      commands,
      params
    } = this;
    const coords = [];
    let pi = 0;
    for (let ci = 0; ci < commands.length; ci++) {
      switch (commands[ci]) {
        case Command.Move:
        case Command.Line:
          coords.push({
            x: params[pi++],
            y: params[pi++]
          });
          break;
        case Command.Curve:
          pi += 4;
          coords.push({
            x: params[pi++],
            y: params[pi++]
          });
          break;
        case Command.Arc:
          coords.push({
            x: params[pi++],
            y: params[pi++]
          });
          pi += 4;
          break;
        case Command.ClosePath:
          break;
      }
    }
    return coords;
  }
}