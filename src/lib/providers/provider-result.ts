export interface ProviderStatus {
  name: string;
  configured: boolean;
  isMock: boolean;
  details: string;
}

export interface ProviderExecutionResult<T = unknown> {
  success: boolean;
  configured: boolean;
  isMock: boolean;
  data?: T;
  error?: string;
}
