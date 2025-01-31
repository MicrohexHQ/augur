import { Provider, Log, ParsedLog } from "..";
import { abi } from "@augurproject/artifacts";
import { Abi } from "ethereum";

export class Events {
  private readonly provider: Provider;
  private readonly augurAddress: string;

  constructor(provider: Provider, augurAddress: string) {
    this.provider = provider;
    this.augurAddress = augurAddress;
    this.provider.storeAbiData(abi.Augur as Abi, "Augur");
  }

  async getLogs(eventName: string, fromBlock: number, toBlock: number | "latest", additionalTopics?: Array<string | string[]>): Promise<ParsedLog[]> {
    let topics: Array<string | string[]> = this.getEventTopics(eventName);
    if (additionalTopics) {
      topics = topics.concat(additionalTopics);
    }
    const logs = await this.provider.getLogs({ fromBlock, toBlock, topics, address: this.augurAddress });
    return this.parseLogs(logs);
  }

  getEventTopics = (eventName: string) => {
    return [this.provider.getEventTopic("Augur", eventName)];
  };

  parseLogs = (logs: Log[]): ParsedLog[] => {
    return logs.map((log) => {
      const logValues = this.provider.parseLogValues("Augur", log);
      return Object.assign(
        { name: "" },
        logValues,
        {
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          transactionIndex: log.transactionIndex,
          removed: log.removed,
          transactionLogIndex: log.transactionLogIndex,
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
          topics: log.topics,
        }
      );
    });
  }
}
