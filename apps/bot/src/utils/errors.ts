export class OliverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OliverError';
  }
}

export class OliverRouteError extends OliverError {
  constructor(message = 'There was an error handling this request.', public statusCode = 500) {
    super(message);
    this.name = 'OliverRouteError';
  }
}

export class MiddlewareNotPassedError extends OliverError {
  constructor(message = 'You do not have permission to run this command.') {
    super(message);
    this.name = 'MiddlewareNotPassedError';
  }
}

export class CommandExecutionError extends OliverError {
  constructor(message = 'There was an error executing this command.') {
    super(message);
    this.name = 'CommandExecutionError';
  }
}

export class ValidationError extends OliverError {
  constructor(message = 'The provided input is not valid.') {
    super(message);
    this.name = 'ValidationError';
  }
}
