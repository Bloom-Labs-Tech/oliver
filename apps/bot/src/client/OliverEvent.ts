import { type ClientEvents } from 'discord.js';
import { client } from '..';

type OliverEventOptions = {
  runOnce: boolean;
};

const defaultOptions: OliverEventOptions = {
  runOnce: false,
};

export abstract class OliverEvent<K extends keyof ClientEvents> {
  public readonly name: K;
  public readonly runOnce: boolean;
  public readonly client = client;

  constructor(name: K, options?: OliverEventOptions) {
    this.name = name;
    this.runOnce = this.parseOption('runOnce', options);
  }

  private parseOption<T extends keyof OliverEventOptions>(
    option: T,
    options?: Partial<OliverEventOptions>,
  ): OliverEventOptions[T] {
    return options?.[option] !== undefined ? options[option] : defaultOptions[option];
  }

  public async execute(...args: ClientEvents[K]): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
