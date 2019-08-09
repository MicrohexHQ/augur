import RunWorker from "./Sync.worker";
import { Sync, Getters, Connectors, Events, SubscriptionEventName } from "@augurproject/sdk";

export class WebWorkerConnector extends Connectors.BaseConnector {
  private api: Promise<Getters.API>;
  private worker: any;

  public async connect(ethNodeUrl: string, account?: string): Promise<any> {
    this.worker = new RunWorker();
    this.worker.postMessage({
      method: "start",
      ethNodeUrl,
      account
    });

    this.api = Sync.start(ethNodeUrl, account);
    //Sync.start(message.data.ethNodeUrl, message.data.account);

    this.worker.onmessage = (event: MessageEvent) => {
      try {
        if (event.data.subscribed) {
          this.subscriptions[event.data.subscribed].id = event.data.subscription;
        } else {
          this.messageReceived(event.data);
        }
      } catch (error) {
        console.error("Bad Web Worker response: " + event);
      }
    };
  }

  public messageReceived(data: any) {
    if (this.subscriptions[data.eventName]) {
      this.subscriptions[data.eventName].callback(data.result);
    }
  }

  public async disconnect(): Promise<any> {
    this.worker.terminate();
  }

  public bindTo<R, P>(f: (db: any, augur: any, params: P) => Promise<R>) {
    return async (params: P): Promise<R> => {
      return (await this.api).route(f.name, params);
    };
  }
  public async on(eventName: SubscriptionEventName | string, callback: Events.Callback): Promise<void> {
    this.subscriptions[eventName] = { id: "", callback: this.callbackWrapper(callback) };
    this.worker.postMessage({ subscribe: eventName });
  }

  public async off(eventName: SubscriptionEventName | string): Promise<void> {
    const subscription = this.subscriptions[eventName];

    if (subscription) {
      delete this.subscriptions[eventName];
      this.worker.postMessage({ unsubscribe: subscription.id });
    }
  }
}
