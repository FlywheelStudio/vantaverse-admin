import { PostgrestError } from '@supabase/supabase-js';
import { ZodError } from 'zod';
import { createAnonymousClient } from './core/anonymous';
import { createClient } from './core/server';

export type SupabaseError = {
  success: false;
  error: string;
};

export type SupabaseSuccess<T> = {
  success: true;
  data: T;
};

export abstract class SupabaseQuery {
  /**
   * The supabase client
   */
  protected supabase!:
    | Awaited<ReturnType<typeof createClient>>
    | ReturnType<typeof createAnonymousClient>;

  /**
   * The user
   */
  protected user:
    | Awaited<ReturnType<typeof this.supabase.auth.getUser>>['data']['user']
    | null = null;

  constructor() {}

  /**
   * Initialize the query
   * @param auth - Whether authentication is required
   */
  public async init(auth: boolean = true) {
    if (auth) {
      // Use authenticated client
      this.supabase = await createClient();
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (!user) {
        console.error(`Error: Unauthenticated - ${error}`);
        throw new Error('Unauthenticated');
      }

      this.user = user;
    } else {
      // Use anonymous client for public data
      this.supabase = createAnonymousClient();
      this.user = null;
    }
  }

  /**
   * Get the user
   * @returns The user
   */
  public async getUser() {
    return this.user;
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
