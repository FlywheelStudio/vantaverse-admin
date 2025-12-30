import { PostgrestError, type User } from '@supabase/supabase-js';
import { ZodError } from 'zod';
import { createClient } from './core/server';
import { createAdminClient } from './core/admin';

export type SupabaseError = {
  success: false;
  error: string;
};

export type SupabaseSuccess<T> = {
  success: true;
  data: T;
};

export type ClientRole = 'authenticated_user' | 'service_role';

type SupabaseClientType =
  | Awaited<ReturnType<typeof createClient>>
  | Awaited<ReturnType<typeof createAdminClient>>;

export abstract class SupabaseQuery {
  /**
   * The supabase client (lazy initialized)
   */
  private _supabase: SupabaseClientType | null = null;

  /**
   * The user (lazy initialized)
   */
  private _user: User | null = null;

  /**
   * Current client role
   */
  private _clientRole: ClientRole | null = null;

  constructor() {}

  /**
   * Get the supabase client with the specified role
   * @param role - The client role ('authenticated_user' or 'service_role')
   * @returns The supabase client
   */
  protected async getClient(
    role: ClientRole = 'authenticated_user',
  ): Promise<
    | Awaited<ReturnType<typeof createClient>>
    | Awaited<ReturnType<typeof createAdminClient>>
  > {
    // Return cached client if role matches
    if (this._supabase && this._clientRole === role) {
      return this._supabase;
    }

    if (role === 'service_role') {
      this._supabase = await createAdminClient();
      this._user = null;
      this._clientRole = 'service_role';
      return this._supabase;
    }

    // Use authenticated client
    this._supabase = await createClient();
    const {
      data: { user },
      error,
    } = await this._supabase.auth.getUser();

    if (!user) {
      console.error(`Error: Unauthenticated - ${error}`);
      throw new Error('Unauthenticated');
    }

    this._user = user;
    this._clientRole = 'authenticated_user';
    return this._supabase;
  }

  /**
   * Get the user (only available when using 'user' role)
   * @returns The user
   */
  public async getUser() {
    if (this._clientRole !== 'authenticated_user') {
      await this.getClient('authenticated_user');
    }
    return this._user;
  }

  /**
   * Execute a query with the specified client role
   * @param role - The client role to use
   * @param queryFn - The query function to execute
   * @returns The result of the query
   */
  protected async withClient<T>(
    role: ClientRole = 'authenticated_user',
    queryFn: (
      client:
        | Awaited<ReturnType<typeof createClient>>
        | Awaited<ReturnType<typeof createAdminClient>>,
    ) => Promise<T>,
  ): Promise<T> {
    const client = await this.getClient(role);
    return queryFn(client);
  }

  /**
   * Parse the error code
   * @param error - The error
   * @returns The status code
   */
  protected parsePostgresErrorCode(error: PostgrestError) {
    switch (error.code) {
      case 'P0400':
        return 400;
      case 'P0401':
        return 401;
      case 'P0403':
        return 403;
      case 'P0404':
        return 404;
      case 'P0500':
        return 500;
      default:
        return 500;
    }
  }

  /**
   * Parse the Postgres error code
   * @param error - The error
   * @returns The status code
   */
  protected parsePostgrestErrorMessage(
    code: number,
    error: PostgrestError,
    messageErrorDefault: string,
  ): string {
    return code === 500 ? error.message || messageErrorDefault : error.message;
  }

  /**
   * Parse the error
   * @param error - The error
   * @param messageErrorDefault - The default message
   * @returns The error
   */
  protected parseResponsePostgresError(
    error: PostgrestError,
    messageErrorDefault: string,
  ): SupabaseError {
    const code = this.parsePostgresErrorCode(error);
    const message = this.parsePostgrestErrorMessage(
      code,
      error,
      messageErrorDefault,
    );
    console.log('Postgres Error:', {
      code,
      message,
      error: error.message,
      details: error.details,
      hint: error.hint,
    });

    return {
      success: false,
      error: message,
    };
  }

  /**
   * Parse the error
   * @param error - The error
   * @param messageDefault - The default message
   * @returns The error
   */
  protected parseResponseZodError(error: ZodError): SupabaseError {
    const formattedErrors = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    console.error('Zod Error:', formattedErrors);

    const message = formattedErrors
      .map((error) => `${error.path}: ${error.message}`)
      .join(', ');

    return {
      success: false,
      error: message,
    };
  }
}
