import { Buffer } from 'node:buffer';
import { createAdminClient } from './core/admin';
import { SupabaseError, SupabaseSuccess } from './query';

/**
 * The result of an upload to Supabase Storage.
 */
interface UploadResult {
  path: string;
  publicUrl?: string;
}

type UploadBody = string;

/**
 * Parameters for uploading to Supabase Storage.
 */
interface UploadParams {
  bucket: string;
  path: string;
  body: UploadBody;
  contentType?: string;
  upsert?: boolean;
  getPublicUrl?: boolean;
}

/**
 * Handles interactions with Supabase Storage, including error handling for RLS violations.
 */
export class SupabaseStorage {
  private client: Awaited<ReturnType<typeof createAdminClient>> | null = null;

  /**
   * Resolves the admin Supabase client (bypasses RLS).
   * @returns Initialized admin Supabase client.
   */
  private async resolveClient(): Promise<
    Awaited<ReturnType<typeof createAdminClient>>
  > {
    this.client ??= await createAdminClient();
    return this.client;
  }

  /**
   * Converts base64 content into an ArrayBuffer payload.
   * @param body - Base64 string to upload.
   * @returns ArrayBuffer ready for upload.
   */
  private prepareBody(body: UploadBody): ArrayBuffer {
    const normalized = this.normalizeBase64(body);
    const buffer = Buffer.from(normalized, 'base64');
    return this.toArrayBuffer(buffer);
  }

  /**
   * Creates an ArrayBuffer copy from a byte array.
   * @param value - Byte array input.
   * @returns ArrayBuffer containing the bytes.
   */
  private toArrayBuffer(value: Uint8Array): ArrayBuffer {
    return value.buffer.slice(
      value.byteOffset,
      value.byteOffset + value.byteLength,
    ) as ArrayBuffer;
  }

  /**
   * Strips data URL metadata from base64 strings.
   * @param value - Base64 input string.
   * @returns Base64 content without metadata.
   */
  private normalizeBase64(value: string): string {
    const parts = value.split(',');
    return parts.length > 1 ? (parts.pop() ?? '') : value;
  }

  /**
   * Uploads content to Supabase Storage.
   * If the file already exists, returns its public URL instead of error.
   * Handles row-level security (RLS) violations by returning a user-friendly error message.
   * @param params - Upload configuration.
   * @returns Result with storage path and optional public URL,
   * or an error message if RLS denies the upload.
   */
  public async upload(
    params: UploadParams,
  ): Promise<SupabaseSuccess<UploadResult> | SupabaseError> {
    const {
      bucket,
      path,
      body,
      contentType,
      upsert = false,
      getPublicUrl = true,
    } = params;

    const client = await this.resolveClient();
    const payload = this.prepareBody(body);

    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, payload, {
        contentType,
        upsert,
      });

    // If the file already exists, return the public URL (not an error)
    if (
      error &&
      error.message?.toLowerCase().includes('the resource already exists')
    ) {
      // Retrieve the public URL for the existing file.
      let publicUrl: string | undefined;
      if (getPublicUrl) {
        const { data: urlData } = client.storage
          .from(bucket)
          .getPublicUrl(path);
        publicUrl = urlData?.publicUrl;
      }
      return {
        success: true,
        data: {
          path,
          publicUrl: publicUrl?.replace(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_API_URL!,
          ),
        },
      };
    }

    // Handle RLS violation errors and return a specific message.
    if (error) {
      // Supabase Storage RLS violation can return "new row violates row-level security policy for table ... (PGRST116)"
      // or a generic 403 error, so we match those for a clear message.
      const message = error.message?.toLowerCase() ?? '';
      if (
        message.includes('row-level security') ||
        error.message === 'PGRST116' ||
        error.message === '403'
      ) {
        return {
          success: false,
          error:
            'You do not have permission to upload to this storage bucket. Please contact support or ensure you are logged in with the correct account.',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    let publicUrl: string | undefined;
    if (getPublicUrl) {
      const { data: urlData } = client.storage
        .from(bucket)
        .getPublicUrl(data.path);
      publicUrl = urlData?.publicUrl;
    }

    return {
      success: true,
      data: {
        path: data.path,
        publicUrl: publicUrl?.replace(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_API_URL!,
        ),
      },
    };
  }

  /**
   * Deletes a file from Supabase Storage.
   * Handles row-level security (RLS) violations by returning a user-friendly error message.
   * @param bucket - The storage bucket name.
   * @param path - The path to the file to delete.
   * @returns Success result or an error message if deletion fails.
   */
  public async delete(
    bucket: string,
    path: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const client = await this.resolveClient();

    const { error } = await client.storage.from(bucket).remove([path]);

    // If file doesn't exist, treat as success (idempotent)
    if (
      error &&
      (error.message?.toLowerCase().includes('not found') ||
        error.message?.toLowerCase().includes('does not exist'))
    ) {
      return {
        success: true,
        data: undefined,
      };
    }

    // Handle RLS violation errors
    if (error) {
      const message = error.message?.toLowerCase() ?? '';
      if (
        message.includes('row-level security') ||
        error.message === 'PGRST116' ||
        error.message === '403'
      ) {
        return {
          success: false,
          error:
            'You do not have permission to delete from this storage bucket. Please contact support or ensure you are logged in with the correct account.',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: undefined,
    };
  }
}
