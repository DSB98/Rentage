// Standard API response envelope
export interface IApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta?: IApiMeta;
}

export interface IApiError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, string[]>;
  };
}

export interface IApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  cursor?: string;
  hasMore?: boolean;
}

export interface IPaginatedResponse<T> {
  items: T[];
  meta: IApiMeta;
}

// Auth response types
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginResponse {
  user: import('./user').IUserWithProfile;
  tokens: IAuthTokens;
}
