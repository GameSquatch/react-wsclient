/**
 * @typedef {object} Options
 * @property {(data: any) => void} [onMessage] Callback function that is called when a message is received from the server. The message is passed as an argument to the callback.
 * @property {(data: any) => boolean} [filter] Optional function that filters incoming messages. Called before onMessage, if provided. If it returns false, the message is not passed to onMessage.
 * @property {(e: Event) => void} [onOpen] Optional callback invoked when the connection opens.
 * @property {(e: CloseEvent, manualDisconnect: boolean) => void} [onClose] Optional callback invoked when the connection closes. The second argument indicates whether the disconnection was initiated manually via the disconnect method.
 * @property {(e: Event) => void} [onError] Optional callback invoked when the connection receives an error, like when the server disconnect unexpectedly.
 * @property {(newStatus: WSClient['connectionStatus']) => void} [onStatusChange] Optional callback invoked when the status of the connection changes.
 */

export class WSClient {
  id = crypto.randomUUID();
  /** @type {(() => Options)[]} */
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
  /** @type {boolean} */
  manualDisconnect = false;
  retryCount = 0;
  /** @type {number} */
  maxRetries;
  /** @type {'closed' | 'connecting' | 'open' | 'closing' | 'retrying'} */
  connectionStatus = 'closed';

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
   * @param {() => Options} subscriber
   */
  subscribe(subscriber) {
    this.subs.push(subscriber);

    return () => {
      this.subs = this.subs.filter((sub) => sub !== subscriber);
    };
  }

  connect() {
    this.manualDisconnect = false;
    if (this.connection !== null) {
      return;
    }
    this.#notifyStatusChange('connecting');
    this.connection = new WebSocket(this.url);
    this.#addListeners(this.connection);
  }

  get isConnected() {
    return this.connection?.readyState === WebSocket.OPEN;
  }

  disconnect() {
    this.#disconnector();
  }

  disconnectManually() {
    this.manualDisconnect = true;
    this.#disconnector();
  }

  #disconnector() {
    this.#notifyStatusChange('closing');
    if (this.connection) {
      this.connection?.close();

      this.connection = null;
    }
  }

  /**
   * Adds listeners to a websocket instance
   * @param {WebSocket} newConnection
   */
  #addListeners(newConnection) {
    newConnection.onopen = (e) => {
      this.#notifyOpen(e);
      this.#notifyStatusChange('open');
      this.retryCount = 0;

      let msg = this.messageQueue.shift();
      while (msg !== undefined) {
        this.send(msg);
        msg = this.messageQueue.shift();
      }
    };

    newConnection.onmessage = (/** @type {MessageEvent<string>} */ e) => {
      let message;
      if (this.useJson) {
        try {
          message = JSON.parse(e.data);
        } catch (err) {
          console.error('Failed to parse JSON message when useJson flag true.', err, e.data);
          return;
        }
      } else {
        message = e.data;
      }

      this.subs.forEach((getSub) => {
        const sub = getSub();
        if (!sub.filter || sub.filter(message)) {
          sub.onMessage?.(message);
        }
      });
    };

    newConnection.onclose = (e) => {
      this.#notifyClose(e, this.manualDisconnect);
      if (this.manualDisconnect) {
        this.#notifyStatusChange('closed');
        return;
      }

      if (this.retry && this.retryCount < this.maxRetries) {
        this.#notifyStatusChange('retrying');
        this.retryCount += 1;
        const interval = this.retryInterval(this.retryCount);

        window.setTimeout(() => {
          this.connection = new WebSocket(this.url);
          this.#addListeners(this.connection);
        }, interval);
      } else {
        this.#notifyStatusChange('closed');
      }
    };

    newConnection.onerror = (e) => {
      this.#notifyError(e);
      console.error(`Error with websocket connection: `, e);
    };
  }

  /**
   * Notify subscribers of an open event.
   * @param {Event} e
   */
  #notifyOpen(e) {
    this.subs.forEach((getSub) => {
      getSub().onOpen?.(e);
    });
  }

  /**
   * Notify subscribers of a close event.
   * @param {CloseEvent} e
   * @param {boolean} manualDisconnect
   */
  #notifyClose(e, manualDisconnect) {
    this.subs.forEach((getSub) => {
      getSub().onClose?.(e, manualDisconnect);
    });
  }

  /**
   * Notify subscribers of an error event.
   * @param {Event} e
   */
  #notifyError(e) {
    this.subs.forEach((getSub) => {
      getSub().onClose?.(e);
    });
  }

  /**
   * Notify subscribers of a status change.
   * @param {WSClient['connectionStatus']} newStatus
   */
  #notifyStatusChange(newStatus) {
    this.connectionStatus = newStatus;
    this.subs.forEach((getSub) => {
      getSub().onConnectionStatusChange?.(newStatus);
    });
  }
}
