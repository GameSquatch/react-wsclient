/**
 * @typedef {object} Subscriber
 * @property {(data: any) => void} onMessage
 */

export class WSClient {
  /** @type {Subscriber[]} */
  subs = [];
  /** @type {WebSocket | null} */
  connection = null;
  /** @type {string[]} */
  messageQueue = [];
  /** @type {string} */
  url;
  /** @type {boolean} */
  useJson;
  /** @type {(retryCount: number) => number} */
  retryInterval;
  /** @type {boolean} */
  retry;
  retryCount = 0;
  /** @type {number} */
  maxRetries;

  /**
   * @param {object} options
   * @param {string} options.url
   * @param {boolean} options.useJson
   * @param {boolean} options.retry
   * @param {(retryCount: number) => number} options.retryInterval
   * @param {number} options.maxRetries
   */
  constructor({ url, useJson, retry, retryInterval, maxRetries }) {
    this.url = url;
    this.useJson = useJson;
    this.retry = retry;
    this.retryInterval = retryInterval;
    this.maxRetries = maxRetries;
    // this.connection = new WebSocket(url);
    // this.#addListeners();
  }

  /**
   * Sends data over the connection to the server.
   * @param {string} data
   */
  send(data) {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      this.connection.send(data);
    } else {
      this.messageQueue.push(data);
    }
  }

  /**
   *
   * @param {Subscriber} subscriber
   */
  subscribe(subscriber) {
    const index = this.subs.push(subscriber) - 1;

    return () => {
      this.subs.splice(index, 1);
    };
  }

  connect() {
    this.connection = new WebSocket(this.url);
    this.#addListeners(this.connection);
  }

  get isConnected() {
    return this.connection !== null;
  }

  disconnect() {
    if (this.connection !== null) {
      this.connection.onclose = () => {
        console.warn("Websocket closing due to strict mode's double run.");
      };
      this.connection.close();
      this.connection = null;
    }
  }

  /**
   *
   * @param {WebSocket} newConnection
   */
  #addListeners(newConnection) {
    newConnection.onopen = () => {
      this.retryCount = 0;
      let msg = this.messageQueue.shift();
      while (msg !== undefined) {
        this.connection?.send(msg);
        msg = this.messageQueue.shift();
      }
    };

    newConnection.onmessage = (/** @type {MessageEvent<string>} */ e) => {
      const message = this.useJson ? JSON.parse(e.data) : e.data;
      this.subs.forEach((sub) => {
        sub.onMessage(message);
      });
    };

    newConnection.onclose = () => {
      console.warn(`WebSocket connection is closing.`);
      if (this.retry && this.retryCount < this.maxRetries) {
        this.retryCount += 1;
        const interval = this.retryInterval(this.retryCount);
        console.log(`Will retry connection in ${interval} ms`);

        window.setTimeout(() => {
          this.connection = new WebSocket(this.url);
          this.#addListeners(this.connection);
        }, interval);
      }
    };

    newConnection.onerror = (e) => {
      console.error(`Error with websocket connection: `, e);
    };
  }
}
