import type { ClientEvents } from 'discord.js';
import { OliverBot, OliverEvent } from '.';
import { getFiles } from '../utils/helpers';

export class EventHandler {
  private events: Map<string, OliverEvent<keyof ClientEvents>> = new Map();

  constructor(private client: OliverBot) {}

  public async registerEvent(event: OliverEvent<keyof ClientEvents>): Promise<void> {
    if (event.runOnce) {
      this.client.once(event.name, (...args) =>
        event.execute(...args).catch((error) => this.client.logger.error(`${event.name} error: `, error)),
      );
    } else {
      this.client.on(event.name, (...args) =>
        event.execute(...args).catch((error) => this.client.logger.error(`${event.name} error: `, error)),
      );
    }
    this.events.set(event.name, event);
  }

  public async unregisterEvent(event: OliverEvent<keyof ClientEvents>): Promise<void> {
    this.client.off(event.name, (...args) =>
      event.execute(...args).catch((error) => this.client.logger.error(`${event.name} error: `, error)),
    );
    this.events.delete(event.name);
  }

  public async registerEvents(): Promise<void> {
    const start = Date.now();

    const eventFiles = await getFiles('./src/events');

    for (const file of eventFiles) {
      const relativePath = `../${file.replace('src/', '')}`;
      try {
        const EventClass = (await import(relativePath)).default;
        if (EventClass && EventClass.prototype instanceof OliverEvent) {
          const event = new EventClass();
          await this.registerEvent(event);
        } else {
          this.client.logger.warn(`Event file ${file} does not export a valid event class`);
        }
      } catch (error) {
        this.client.logger.error(`Failed to register event from file ${file}`, error);
      }
    }

    this.client.logger.info(`Registered ${this.events.size} events`);

    const end = Date.now();
    this.client.logger.info(`Event registration took ${end - start}ms`);
  }

  public async unregisterEvents(): Promise<void> {
    for (const event of this.events.values()) {
      await this.unregisterEvent(event);
    }
  }

  public async reloadEvents(): Promise<void> {
    await this.unregisterEvents();
    await this.registerEvents();
  }
}
