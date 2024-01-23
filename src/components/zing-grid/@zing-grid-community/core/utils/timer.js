export class Timer {
  constructor() {
    this.timestamp = new Date().getTime();
  }
  print(msg) {
    const duration = new Date().getTime() - this.timestamp;
    console.info(`${msg} = ${duration}`);
    this.timestamp = new Date().getTime();
  }
}