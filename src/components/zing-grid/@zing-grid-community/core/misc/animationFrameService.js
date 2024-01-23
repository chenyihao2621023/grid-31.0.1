var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, PostConstruct } from "../context/context";
import { BeanStub } from "../context/beanStub";
let AnimationFrameService = class AnimationFrameService extends BeanStub {
  constructor() {
    super(...arguments);
    this.createTasksP1 = {
      list: [],
      sorted: false
    };
    this.createTasksP2 = {
      list: [],
      sorted: false
    };
    this.destroyTasks = [];
    this.ticking = false;
    this.scrollGoingDown = true;
    this.lastPage = 0;
    this.lastScrollTop = 0;
    this.taskCount = 0;
    this.cancelledTasks = new Set();
  }
  setScrollTop(scrollTop) {
    const isPaginationActive = this.gridOptionsService.get('pagination');
    this.scrollGoingDown = scrollTop >= this.lastScrollTop;
    if (isPaginationActive && scrollTop === 0) {
      const currentPage = this.paginationProxy.getCurrentPage();
      if (currentPage !== this.lastPage) {
        this.lastPage = currentPage;
        this.scrollGoingDown = true;
      }
    }
    this.lastScrollTop = scrollTop;
  }
  init() {
    this.useAnimationFrame = !this.gridOptionsService.get('suppressAnimationFrame');
  }
  isOn() {
    return this.useAnimationFrame;
  }
  verifyAnimationFrameOn(methodName) {
    if (this.useAnimationFrame === false) {
      console.warn(`ZING Grid: AnimationFrameService.${methodName} called but animation frames are off`);
    }
  }
  createTask(task, index, list) {
    this.verifyAnimationFrameOn(list);
    const taskItem = {
      task,
      index,
      createOrder: ++this.taskCount
    };
    this.addTaskToList(this[list], taskItem);
    this.schedule();
  }
  cancelTask(task) {
    this.cancelledTasks.add(task);
  }
  addTaskToList(taskList, task) {
    taskList.list.push(task);
    taskList.sorted = false;
  }
  sortTaskList(taskList) {
    if (taskList.sorted) {
      return;
    }
    const sortDirection = this.scrollGoingDown ? 1 : -1;
    taskList.list.sort((a, b) => a.index !== b.index ? sortDirection * (b.index - a.index) : b.createOrder - a.createOrder);
    taskList.sorted = true;
  }
  addDestroyTask(task) {
    this.verifyAnimationFrameOn('createTasksP3');
    this.destroyTasks.push(task);
    this.schedule();
  }
  executeFrame(millis) {
    this.verifyAnimationFrameOn('executeFrame');
    const p1TaskList = this.createTasksP1;
    const p1Tasks = p1TaskList.list;
    const p2TaskList = this.createTasksP2;
    const p2Tasks = p2TaskList.list;
    const destroyTasks = this.destroyTasks;
    const frameStart = new Date().getTime();
    let duration = new Date().getTime() - frameStart;
    const noMaxMillis = millis <= 0;
    const gridBodyCon = this.ctrlsService.getGridBodyCtrl();
    while (noMaxMillis || duration < millis) {
      const gridBodyDidSomething = gridBodyCon.getScrollFeature().scrollGridIfNeeded();
      if (!gridBodyDidSomething) {
        let task;
        if (p1Tasks.length) {
          this.sortTaskList(p1TaskList);
          task = p1Tasks.pop().task;
        } else if (p2Tasks.length) {
          this.sortTaskList(p2TaskList);
          task = p2Tasks.pop().task;
        } else if (destroyTasks.length) {
          task = destroyTasks.pop();
        } else {
          this.cancelledTasks.clear();
          break;
        }
        if (!this.cancelledTasks.has(task)) {
          task();
        }
      }
      duration = new Date().getTime() - frameStart;
    }
    if (p1Tasks.length || p2Tasks.length || destroyTasks.length) {
      this.requestFrame();
    } else {
      this.stopTicking();
    }
  }
  stopTicking() {
    this.ticking = false;
  }
  flushAllFrames() {
    if (!this.useAnimationFrame) {
      return;
    }
    this.executeFrame(-1);
  }
  schedule() {
    if (!this.useAnimationFrame) {
      return;
    }
    if (!this.ticking) {
      this.ticking = true;
      this.requestFrame();
    }
  }
  requestFrame() {
    const callback = this.executeFrame.bind(this, 60);
    this.requestAnimationFrame(callback);
  }
  requestAnimationFrame(callback) {
    const win = this.gridOptionsService.getWindow();
    if (win.requestAnimationFrame) {
      win.requestAnimationFrame(callback);
    } else if (win.webkitRequestAnimationFrame) {
      win.webkitRequestAnimationFrame(callback);
    } else {
      win.setTimeout(callback, 0);
    }
  }
  isQueueEmpty() {
    return !this.ticking;
  }
  debounce(func) {
    let pending = false;
    return () => {
      if (!this.isOn()) {
        this.getFrameworkOverrides().setTimeout(func, 0);
        return;
      }
      if (pending) {
        return;
      }
      pending = true;
      this.addDestroyTask(() => {
        pending = false;
        func();
      });
    };
  }
};
__decorate([Autowired('ctrlsService')], AnimationFrameService.prototype, "ctrlsService", void 0);
__decorate([Autowired('paginationProxy')], AnimationFrameService.prototype, "paginationProxy", void 0);
__decorate([PostConstruct], AnimationFrameService.prototype, "init", null);
AnimationFrameService = __decorate([Bean('animationFrameService')], AnimationFrameService);
export { AnimationFrameService };