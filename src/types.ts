export interface User {
  _id: string;
  phone: string;
  firstname?: string;
  middlename?: string;
  lastname?: string;
  email?: string;
  city?: string;
}

export interface OtpResponse {
  success: boolean;
  reason?: string;
  retryDelay: number;
}

export interface SignInResponse {
  success: boolean;
  token: string;
  user: User;
  reason?: string;
}
export interface SessionResponse {
  success: boolean;
  user: User;
  reason?: string;
}