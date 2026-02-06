# Supabase Query System – Reference

## Core

| File | Use | Context |
|------|-----|--------|
| **client.ts** | `supabase` – browser client | `'use client'` only. Used by realtime. |
| **server.ts** | `createClient()` | Server; cookie-based auth. |
| **admin.ts** | `createAdminClient()` | Service role; bypasses RLS; server-only. |
| **anonymous.ts** | `createAnonymousClient()` | No cookies; static/ISR. |

## Schemas

- One file per entity in `src/lib/supabase/schemas`. Zod `z.object()`, export schema and `type = z.infer<typeof schema>`.
- Enums: `z.enum([...])` or align with `Database['public']['Enums']['x']` from `database.types.ts`.
- Views: extend base schema (e.g. `profileWithStatsSchema = profileSchema.extend({ ... })`).

Example (`schemas/messages.ts`):

```ts
import { z } from 'zod';

export const messageTypeSchema = z.enum(['admin', 'user', 'system'], { message: 'Invalid message type' });

export const messageSchema = z.object({
  id: z.uuid(),
  chat_id: z.uuid(),
  user_id: z.uuid().nullable(),
  content: z.string(),
  message_type: messageTypeSchema,
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type Message = z.infer<typeof messageSchema>;
```

## Queries

- Extend `SupabaseQuery` from `../query`. Return `Promise<SupabaseSuccess<T> | SupabaseError>`.
- `getClient('authenticated_user')` → server client, user must be logged in.
- `getClient('service_role')` → admin client, bypasses RLS.
- Pattern: get client → run `.from().select()/.insert()/...` → on error `parseResponsePostgresError` → on success `schema.safeParse(data)` → on parse fail `parseResponseZodError` → return `{ success, data }` or `{ success: false, error, status? }`.
- In server actions when data is required: `resolveActionResult(result)` from `@/lib/server` (throws/notFound/forbidden on failure).

Example (query method):

```ts
// queries/messages.ts
import { SupabaseQuery, type SupabaseSuccess, type SupabaseError } from '../query';
import { messageSchema, type Message } from '../schemas/messages';

export class MessagesQuery extends SupabaseQuery {
  async getMessagesByChatId(chatId: string): Promise<SupabaseSuccess<Message[]> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (error) return this.parseResponsePostgresError(error, 'Failed to get messages');
    if (!data) return { success: true, data: [] };
    const result = messageSchema.array().safeParse(data);
    if (!result.success) return this.parseResponseZodError(result.error);
    return { success: true, data: result.data };
  }
}
```

Example (server action using resolveActionResult):

```ts
import { resolveActionResult } from '@/lib/server';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';

const query = new ProfilesQuery();
const result = await query.getUserById(id);
const profile = resolveActionResult(result); // throws / notFound() / forbidden() if !result.success
```

## Realtime

- Base: `SupabaseRealtime` in `realtime.ts`; uses `core/client` (browser).
- Topic: `scope:id:entity` (e.g. `chat:uuid:messages`). Event: snake_case (e.g. `message_created`).
- Flow: `createChannel({ channelName, config: { config: { private: true } } })` → `onBroadcast<T>(channel, event, cb)` → `subscribe(channel)`. Call `cleanup()` on unmount.

Example (realtime handler class):

```ts
// realtime/messages.ts
import type { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseRealtime } from '../realtime';
import type { Message } from '../schemas/messages';

const TOPIC_PREFIX = 'chat';
const TOPIC_SUFFIX = 'messages';
const EVENT = 'message_created';

export class MessagesRealtime extends SupabaseRealtime {
  subscribeToChat(chatId: string, callback: (message: Message) => void): RealtimeChannel {
    const topic = `${TOPIC_PREFIX}:${chatId}:${TOPIC_SUFFIX}`;
    const channel = this.createChannel({
      channelName: topic,
      config: { config: { private: true } },
    });
    this.onBroadcast<Message>(channel, EVENT, (data) => callback(data as Message));
    this.subscribe(channel);
    return channel;
  }
}
```

Example (component usage):

```ts
const realtime = new MessagesRealtime();
realtime.subscribeToChat(chatId, (message) => { /* update UI */ });
// in useEffect return or on unmount:
realtime.cleanup();
```

### Database triggers

`realtime.send(payload jsonb, event text, topic text, is_private boolean)`.

RLS (once):

```sql
CREATE POLICY "authenticated_users_can_receive" ON realtime.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_users_can_send" ON realtime.messages FOR INSERT TO authenticated WITH CHECK (true);
```

Example trigger (broadcast new message):

```sql
CREATE OR REPLACE FUNCTION broadcast_chat_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM realtime.send(to_jsonb(NEW), 'message_created', 'chat:' || NEW.chat_id::text || ':messages', true);
  RETURN NULL;
END; $$;
CREATE TRIGGER messages_broadcast_chat AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION broadcast_chat_message();
```

More: `src/lib/supabase/realtime/README.md`.

## Storage

- **SupabaseStorage**: uses admin client; server-only. All methods return `SupabaseSuccess<T> | SupabaseError`. RLS errors → user-friendly permission message.
- **upload(params)**: `{ bucket, path, body (base64), contentType?, upsert?, getPublicUrl? }`. Existing file without upsert → return existing URL. Public URL may be rewritten to `NEXT_PUBLIC_API_URL`.
- **list(bucket, path)**: file paths in folder; "not found" → [].
- **createSignedUrl(bucket, path, expiresIn?)**: signed URL.
- **delete(bucket, path)**: idempotent; "not found" → success.

Example (server action: replace user image, private bucket):

```ts
import { SupabaseStorage } from '@/lib/supabase/storage';

const storage = new SupabaseStorage();
const folderPath = `${userId}/user_image`;
const filePath = `${folderPath}/image.jpg`;

// Optional: clear existing files
const listResult = await storage.list('user_assets', folderPath);
if (listResult.success) {
  for (const p of listResult.data) await storage.delete('user_assets', p);
}

const uploadResult = await storage.upload({
  bucket: 'user_assets',
  path: filePath,
  body: fileBase64,
  contentType: 'image/jpeg',
  upsert: true,
  getPublicUrl: false,
});
if (!uploadResult.success) return uploadResult;

const signedResult = await storage.createSignedUrl('user_assets', filePath, 1000 * 365 * 24 * 60 * 60);
if (!signedResult.success) return signedResult;
// use signedResult.data as the URL to store or return
```

## Query: Postgres error codes

`parseResponsePostgresError` maps: P0400→400, P0401→401, P0403→403, P0404→404, P0500→500.
