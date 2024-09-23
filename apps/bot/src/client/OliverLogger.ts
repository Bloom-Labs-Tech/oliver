import colors from 'colors';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type ConsoleData = any[];

export class OliverLogger {
  private static instance: OliverLogger;

  private constructor() {}

  public static getInstance(): OliverLogger {
    if (!OliverLogger.instance) {
      OliverLogger.instance = new OliverLogger();
    }

    return OliverLogger.instance;
  }

  public info(message: string, ...data: ConsoleData): void {
    const formattedMessage = this.formatMessage('INFO', message, colors.green);
    this.handleLog(formattedMessage, ...data);
  }

  public error(message: string, ...data: ConsoleData): void {
    const formattedMessage = this.formatMessage('ERROR', message, colors.red);
    this.handleLog(formattedMessage, ...data);
  }

  public warn(message: string, ...data: ConsoleData): void {
    const formattedMessage = this.formatMessage('WARN', message, colors.yellow);
    this.handleLog(formattedMessage, ...data);
  }

  public debug(message: string, ...data: ConsoleData): void {
    const formattedMessage = this.formatMessage('DEBUG', message, colors.blue);
    this.handleLog(formattedMessage, ...data);
  }

  private formatMessage(level: string, message: string, color: (text: string) => string): string {
    return `[${new Date().toLocaleString()}] ${color(`[${level}] ${message}`)}`;
  }

  private handleLog(message: string, ...data: ConsoleData): void {
    console.log(message, ...data);
  }
}
