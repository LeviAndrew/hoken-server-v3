export abstract class BasicRTC {
  protected _handler;
  private _config: any;
  private _socket: any;
  protected _interfaceListeners: object;

  constructor(rtcNome, handler, config) {
    this._handler = handler;
    this.config = config;
    this.socket = this.config.socket;
    // Todo, temporario...
    console.log('conectado no rtc', rtcNome);
  }

  abstract set interfaceListeners(interfaceListeners);

  abstract get interfaceListeners();

  abstract set handler(handler);

  abstract get handler();

  get config(): any {
    return this._config;
  }

  set config(value: any) {
    this._config = value;
  }

  get socket(): any {
    return this._socket;
  }

  set socket(value: any) {
    this._socket = value;
  }

  /**
   * Funcao responsavel por passar para o client o retorno dos pedidos dele.
   * @param dado
   */
  sendToBrowser(dado) {
    this.socket.emit('response', dado);
  }

  /**
   * Destroy o objeto, desconectando ele de todos os eventos.
   */
  destroy() {
    for (let event in this.interfaceListeners) {
      if (this.interfaceListeners.hasOwnProperty(event)) {
        this.socket.removeListener(event, this.interfaceListeners[event]);
      }
    }
    this.socket = null;
  }

  /**
   * Liga os eventos do interfaceListeners no socket.
   */
  wiring() {
    this.interfaceListeners['disconnect'] = this.destroy.bind(this);
    for (let name in this.interfaceListeners) {
      if (this.interfaceListeners.hasOwnProperty(name)) {
        this.socket.on(name, this.interfaceListeners[name]);
      }
    }
  }
}