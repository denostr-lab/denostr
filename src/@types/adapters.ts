import { EventEmitter } from "node:events";

import { Bulk } from "redis";

import { SubscriptionFilter } from "./subscription.ts";

export interface IWebSocketServerAdapter
  extends EventEmitter, IWebServerAdapter {
  getConnectedClients(): number;
  close(callback?: () => void): void;
  removeClient(client: WebSocket): void;
}

export interface IWebServerAdapter extends EventEmitter {
  listen(port: number): void;
  close(callback?: () => void): void;
}

export type IWebSocketAdapter = EventEmitter & {
  getClientId(): string;
  getClientAddress(): string;
  getSubscriptions(): Map<string, SubscriptionFilter[]>;
};

export interface ICacheAdapter {
  getKey(key: string): Promise<Bulk>;
  hasKey(key: string): Promise<boolean>;
  setKey(key: string, value: string): Promise<boolean>;
  addToSortedSet(
    key: string,
    set: Record<string, string> | Record<string, string>[],
  ): Promise<number>;
  removeRangeByScoreFromSortedSet(
    key: string,
    min: number,
    max: number,
  ): Promise<number>;
  getRangeFromSortedSet(
    key: string,
    start: number,
    stop: number,
  ): Promise<string[]>;
  setKeyExpiry(key: string, expiry: number): Promise<void>;
}
