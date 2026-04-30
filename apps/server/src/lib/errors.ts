export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
