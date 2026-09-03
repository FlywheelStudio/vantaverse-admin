export type SupabaseError = {
  success: false;
  error: string;
  status?: number;
};

export type SupabaseSuccess<T> = {
  success: true;
  data: T;
};

export type ClientRole = 'authenticated_user' | 'service_role';
