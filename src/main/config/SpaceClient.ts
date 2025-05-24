import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { ServiceModule } from '../api/ServiceModule';

/**
 * The `SpaceClient` class provides an interface to interact with the Space API and WebSocket services.
 * It allows for HTTP requests, WebSocket connections, and event handling for real-time updates.
 */
export class SpaceClient {
  /**
   * The base HTTP URL for the Space API.
   * This URL is derived from the provided `url` in the constructor options and appended with `/api/v1`.
   */
  public httpUrl: string;

  /**
   * The WebSocket client instance used for general communication.
   * This is initialized with the provided `url` in the constructor options.
   */
  private socketClient: Socket;

  /**
   * The WebSocket namespace specifically for pricing-related events.
   */
  private pricingSocketNamespace: Socket; 

  /**
   * The API key used for authenticating requests to the Space API.
   */
  public apiKey: string;

  /**
   * The timeout duration (in milliseconds) for HTTP requests.
   * Defaults to 5000ms if not provided in the constructor options.
   */
  private timeout: number;

  /**
   * A record of callback functions registered for specific events.
   * The keys are event names, and the values are the corresponding callback functions.
   */
  private callBackFunctions: Record<string, (data?: any) => void> = {};

  /**
   * An instance of the `ServiceModule` class, which provides additional service-related functionality.
   */
  public services: ServiceModule;

  /**
   * Constructs a new instance of the `SpaceClient` class.
   * 
   * @param options - Configuration options for the client.
   * @param options.url - The base URL for the Space API.
   * @param options.apiKey - The API key for authenticating requests.
   * @param options.timeout - (Optional) The timeout duration for HTTP requests, in milliseconds.
   */
  constructor(options: { url: string; apiKey: string; timeout?: number }) {
    this.httpUrl = options.url.endsWith('/') ? options.url.slice(0, -1) + '/api/v1' : options.url + '/api/v1';
    this.socketClient = io(options.url.replace(/^http/, 'ws'), {
      path: '/events',
      autoConnect: false,
    });
    this.pricingSocketNamespace = this.socketClient.io.socket('/pricings');
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 5000; // Default timeout to 5000ms if not provided

    this.services = new ServiceModule(this);

    this.configureSocket();
  }

  /**
   * Checks if the client is connected to the Space API by performing a health check.
   * 
   * @returns A promise that resolves to `true` if the connection is healthy, otherwise `false`.
   */
  public async isConnectedToSpace(): Promise<boolean> {
    const response = await axios.get(`${this.httpUrl}/healthcheck`);

    return response.status === 200 && response.data.message;
  }

  /**
   * Registers a callback function for a specific event.
   * 
   * @param event - The name of the event to listen for. Supported events are:
   *   - `'synchronized'`: Triggered when the WebSocket connection is successfully established.
   *   - `'pricing_change'`: Triggered when there is a change in pricing data.
   *   - `'error'`: Triggered when a connection error occurs.
   * @param callback - The function to execute when the event is triggered.
   */
  public on(event: string, callback: (data?: any) => void): void {
    switch (event.toLowerCase()) {
      case 'synchronized':
        this.callBackFunctions['synchronized'] = callback;
        break;
      case 'pricing_change':
        this.callBackFunctions['pricing_change'] = callback;
        break;
      case 'error':
        this.callBackFunctions['error'] = callback;
        break;
      default:
        console.warn(`No handler for event: ${event}`);
        return;
    }
  }

  /**
   * Establishes a connection to the pricing WebSocket namespace.
   * If already connected, this method does nothing.
   */
  public connect(): void {
    if (!this.pricingSocketNamespace.connected) {
      this.pricingSocketNamespace.connect();
    }
  }

  /**
   * Disconnects from the pricing WebSocket namespace and removes all event listeners.
   * If already disconnected, this method does nothing.
   */
  public disconnect(): void {
    if (this.pricingSocketNamespace.connected) {
      this.pricingSocketNamespace.disconnect();
      this.pricingSocketNamespace.removeAllListeners();
    }
  }

  /**
   * Configures the WebSocket namespace for handling events.
   * This method sets up listeners for the following events:
   *   - `'connect'`: Logs a message and triggers the `'synchronized'` callback if registered.
   *   - `'message'`: Handles incoming messages and triggers the appropriate callback based on the message code.
   *   - `'connect_error'`: Triggers the `'error'` callback if registered.
   * 
   * @private
   */
  private configureSocket() {
    this.pricingSocketNamespace.on('connect', () => {
      console.log('Connected to Space WebSocket');
      if (this.callBackFunctions['synchronized']) {
        this.callBackFunctions['synchronized']();
      }
    });

    this.pricingSocketNamespace.on('message', data => {
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

    this.pricingSocketNamespace.on('connect_error', error => {
      if (this.callBackFunctions['error']) {
        this.callBackFunctions['error'](error);
      }
    });
  }
}
