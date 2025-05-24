import { io, Socket } from 'socket.io-client';

export class SpaceClient {
  private httpUrl: string;
  private socketClient: Socket;
  private apiKey: string;
  private timeout: number;
  private callBackFunctions: Record<string, (data: any) => void> = {};

  constructor(options: { url: string; apiKey: string; timeout?: number }) {
    this.httpUrl = options.url;
    this.socketClient = io(options.url.replace(/^http/, 'ws'), {
      path: '/events',
      autoConnect: false,
    });
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 5000; // Default timeout to 5000ms if not provided

    this.configureSocket();
  }

  public on(event: string, callback: (data: any) => void): void {
    switch (event.toLowerCase()) {
      case 'pricing_change':
        this.callBackFunctions['pricing_change'] = callback;
        break;
      default:
        console.warn(`No handler for event: ${event}`);
        return;
    }
  }

  private configureSocket() {
    this.socketClient.on('connect', () => {
      console.log('Connected to Space server at', this.httpUrl);
    });

    this.socketClient.on('message', data => {
      switch (data.code.toLowerCase()) {
        case 'pricing_change':
          if (!this.callBackFunctions['pricing_change']) {
            console.warn("No callback function registered for 'pricing_change' event");
            return;
          }
          this.callBackFunctions['pricing_change'](data.details);
          break;
        default:
          console.warn(`Unhandled message code: ${data.code}`);
      }
    });

    this.socketClient.on('connect_error', error => {
      console.error('Websockects connection error:', error);
    });

    this.socketClient.on('disconnect', () => {
      console.log('Disconnected from Space server');
    });
  }
}
