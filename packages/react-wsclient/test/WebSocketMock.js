export class WebSocketMock {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url;
  readyState = 3;
  msg = '';
  onclose = undefined;
  onopen = undefined;
  onmessage = undefined;
  onerror = undefined;

  constructor(url) {
    this.url = url;
  }

  send(msg) {
    this.msg = msg;
  }

  close() {
    this.onclose?.(new CloseEvent('close'));
  }
}

export class WebSocketOpenedMock {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url;
  readyState = 1;
  msg = '';
  onclose = undefined;
  onopen = undefined;
  onmessage = undefined;
  onerror = undefined;

  constructor(url) {
    this.url = url;
    this.onopen?.(new Event('open'));
  }

  send(msg) {
    this.msg = msg;
  }

  close() {
    this.onclose?.(new CloseEvent('close'));
  }
}
