import { PostgrestError, type User } from '@supabase/supabase-js';
import { ZodError } from 'zod';
import { createClient } from './core/server';
import { createAdminClient } from './core/admin';
import { resolveActionResult } from '../server';

type ActionFailure = {
  success: false;
  status: number;
  error: string;
};

type ActionSuccess<T> = {
  success: true;
  data: T;
};

type ActionResult<T> = ActionSuccess<T> | ActionFailure;

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

type SupabaseClientType =
  | Awaited<ReturnType<typeof createClient>>
  | Awaited<ReturnType<typeof createAdminClient>>;

let adminClientInstance: Awaited<ReturnType<typeof createAdminClient>> | null =
  null;

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
      // Use singleton admin client
      if (!adminClientInstance) {
        adminClientInstance = await createAdminClient();
      }
      this._supabase = adminClientInstance;
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
      status: code,
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
      status: 400,
    };
  }
}

/**
 * Convert Supabase result to ActionResult format
 * @param result - The Supabase result (Success or Error)
 * @param defaultStatus - Default status code if error doesn't have one
 * @returns ActionResult with proper status code
 */
function toActionResult<T>(
  result: SupabaseSuccess<T> | SupabaseError,
  defaultStatus: number = 500,
): ActionResult<T> {
  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    status: result.status ?? defaultStatus,
    error: result.error,
  };
}

/**
 * Base query configuration without dependencies
 */
export type IndependentQueryConfig<T> = {
  query: () => Promise<SupabaseSuccess<T> | SupabaseError>;
  required?: boolean;
  defaultValue?: T;
  statusCode?: number;
  condition?: boolean;
};

/**
 * Query configuration with dependencies on other queries
 * @template T - The return type of this query
 * @template TDeps - Record of dependency results keyed by query name
 */
export type DependentQueryConfig<T, TDeps = Record<string, unknown>> = {
  query: (deps: TDeps) => Promise<SupabaseSuccess<T> | SupabaseError>;
  required?: boolean;
  defaultValue?: T;
  statusCode?: number;
  dependsOn: ReadonlyArray<string>;
  condition?: boolean;
};

/**
 * Union type for query configurations (independent or dependent)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryConfig<T, TDeps = any> =
  | IndependentQueryConfig<T>
  | DependentQueryConfig<T, TDeps>;

/**
 * Configuration for a conditional query
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConditionalQueryConfig<T, TDeps = any> = QueryConfig<T, TDeps> & {
  condition: boolean;
};

/**
 * Schema type for parallel queries
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QuerySchema = Record<string, QueryConfig<any, any>>;

/**
 * Extract the result type from a query config
 */
type ExtractResultType<T> = T extends
  | IndependentQueryConfig<infer U>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | DependentQueryConfig<infer U, any>
  ? U
  : never;

/**
 * Extract result types from a query schema
 */
type QueryResults<T extends QuerySchema> = {
  [K in keyof T]: ExtractResultType<T[K]>;
};

/**
 * Execute multiple queries in parallel with support for conditional queries,
 * required vs optional queries, dependency chains, and automatic error handling.
 *
 * @param schema - Object defining queries to execute
 * @returns Promise resolving to type-safe object with query results
 *
 * @example
 * ```typescript
 * const data = await createParallelQueries({
 *   appointments: {
 *     query: () => appointmentsQuery.getAppointmentsByUserId(id),
 *     defaultValue: [],
 *   },
 *   hpLevelThreshold: {
 *     condition: user.current_level !== null,
 *     query: () => hpPointsQuery.getHpLevelThresholdByLevel(user.current_level!),
 *     defaultValue: null,
 *   },
 *   organization: {
 *     query: () => orgQuery.getById(id),
 *     required: true, // Will call resolveActionResult if fails
 *   },
 *   assignment: {
 *     query: (deps) => {
 *       // deps.template and deps.schedule available here
 *       return assignmentQuery.update(deps.template.id, deps.schedule.id);
 *     },
 *     dependsOn: ['template', 'schedule'],
 *     required: false,
 *   },
 * });
 * ```
 */
export async function createParallelQueries<T extends QuerySchema>(
  schema: T,
): Promise<QueryResults<T>> {
  // Filter and prepare queries based on conditions
  const activeQueries = Object.entries(schema)
    .filter(([, def]) => {
      if (def.condition !== undefined) {
        return def.condition;
      }
      return true;
    })
    .map(([key, def]) => {
      const dependsOn =
        'dependsOn' in def && def.dependsOn
          ? Array.isArray(def.dependsOn)
            ? (def.dependsOn as readonly string[]).slice()
            : []
          : [];

      return {
        key,
        query: def.query,
        required: def.required ?? false,
        defaultValue: def.defaultValue,
        statusCode: def.statusCode,
        dependsOn,
      };
    });

  // Validate dependencies exist
  const queryKeys = new Set(activeQueries.map((q) => q.key));
  for (const query of activeQueries) {
    for (const dep of query.dependsOn) {
      if (!queryKeys.has(dep)) {
        throw new Error(
          `Query "${query.key}" depends on "${dep}" which is not in the schema`,
        );
      }
    }
  }

  // Detect circular dependencies
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(key: string): boolean {
    if (recStack.has(key)) {
      return true;
    }
    if (visited.has(key)) {
      return false;
    }

    visited.add(key);
    recStack.add(key);

    const query = activeQueries.find((q) => q.key === key);
    if (query) {
      for (const dep of query.dependsOn) {
        if (hasCycle(dep)) {
          return true;
        }
      }
    }

    recStack.delete(key);
    return false;
  }

  for (const query of activeQueries) {
    if (hasCycle(query.key)) {
      throw new Error(
        `Circular dependency detected involving query "${query.key}"`,
      );
    }
  }

  // Group queries by dependency level (topological sort)
  const levels: (typeof activeQueries)[] = [];
  const scheduled = new Set<string>();
  const remaining = new Set(activeQueries.map((q) => q.key));

  while (remaining.size > 0) {
    const currentLevel: typeof activeQueries = [];

    for (const query of activeQueries) {
      if (!remaining.has(query.key)) continue;

      // Check if all dependencies are satisfied
      const allDepsSatisfied = query.dependsOn.every((dep) =>
        scheduled.has(dep),
      );

      if (allDepsSatisfied) {
        currentLevel.push(query);
        remaining.delete(query.key);
      }
    }

    if (currentLevel.length === 0) {
      // Debug information
      const remainingQueries = Array.from(remaining);
      const debugInfo = remainingQueries
        .map((key) => {
          const query = activeQueries.find((q) => q.key === key);
          return `"${key}" depends on [${query?.dependsOn.join(', ')}]`;
        })
        .join(', ');

      throw new Error(
        `Cannot resolve dependencies - possible circular dependency. Remaining: ${debugInfo}. Scheduled: ${Array.from(scheduled).join(', ')}`,
      );
    }

    // Mark all queries in current level as scheduled AFTER building the level
    for (const query of currentLevel) {
      scheduled.add(query.key);
    }

    levels.push(currentLevel);
  }

  // Execute queries level by level
  const output = {} as QueryResults<T>;

  for (const level of levels) {
    // Execute all queries in this level in parallel
    const results = await Promise.all(
      level.map(async ({ key, query, required, defaultValue, statusCode }) => {
        const result = await query(output as Record<string, unknown>);
        const actionResult = toActionResult(result, statusCode);

        return { key, result: actionResult, required, defaultValue };
      }),
    );

    // Process results and handle errors
    for (const { key, result, required, defaultValue } of results) {
      if (required && !result.success) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to execute required query:', key, result);
        }
        resolveActionResult(result);
      }

      output[key as keyof T] = (
        result.success ? result.data : (defaultValue ?? null)
      ) as ExtractResultType<T[typeof key]>;
    }
  }

  return output;
}
