# Supabase Realtime (Broadcast)

This module uses **broadcast** (not postgres_changes) for scalability. Database triggers call `realtime.send()` to push events; the client subscribes to private channels and listens for named events.

## Topic naming

- Pattern: `scope:id:entity` (e.g. `chat:uuid:messages`, `org:uuid:conversation_updates`).
- Event names: snake_case (e.g. `message_created`, `last_message_updated`).

## Client usage

### 1. Chat messages (one open chat)

When a user has a single chat open, subscribe to that chat only:

```ts
import { MessagesRealtime } from '@/lib/supabase/realtime/messages';

const realtime = new MessagesRealtime();
realtime.subscribeToChat(chatId, (message) => {
  // Append or update UI
});
// On unmount:
realtime.cleanup();
```

- **Topic:** `chat:{chatId}:messages`
- **Event:** `message_created`
- **Payload:** Full message row (from DB trigger).

### 2. Conversation list (many cards, one channel per org)

On the messages page, subscribe to one channel per org so cards get last-message updates without N channels:

```ts
import { ConversationUpdatesRealtime } from '@/lib/supabase/realtime/conversation-updates';

const realtime = new ConversationUpdatesRealtime();
for (const org of adminOrgs) {
  realtime.subscribeToOrg(org.id, (payload) => {
    // payload: { user_id, chat_id, content, created_at }
    updateConversationLastMessage(payload.user_id, payload);
  });
}
// On unmount:
realtime.cleanup();
```

- **Topic:** `org:{organizationId}:conversation_updates`
- **Event:** `last_message_updated`
- **Payload:** `{ user_id, chat_id, content, created_at }`.

---

## Database setup

Enable the Realtime extension and allow authenticated users to receive (and optionally send) broadcasts. Then add triggers that call `realtime.send()`.

### 1. RLS on `realtime.messages`

Run in the SQL editor (once per project):

```sql
-- Allow authenticated users to receive broadcasts
CREATE POLICY "authenticated_users_can_receive"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

-- Optional: allow authenticated users to send (e.g. client broadcast)
CREATE POLICY "authenticated_users_can_send"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);
```

### 2. Trigger: broadcast new message to chat (open-chat realtime)

When a row is inserted into `messages`, broadcast the new message to the topic `chat:{chat_id}:messages` so the open-chat UI can append it.

```sql
CREATE OR REPLACE FUNCTION broadcast_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.send(
    to_jsonb(NEW),
    'message_created',
    'chat:' || NEW.chat_id::text || ':messages',
    true
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER messages_broadcast_chat
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_chat_message();
```

### 3. Trigger: broadcast last message to org (conversation list)

When a message is inserted, notify each org the chat’s user (patient) belongs to, so the list can update the card’s last message. Orgs are derived from `organization_members` (chats may have `organization_id` null).

```sql
CREATE OR REPLACE FUNCTION broadcast_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_org_id  uuid;
BEGIN
  SELECT c.user_id INTO v_user_id
  FROM chats c
  WHERE c.id = NEW.chat_id;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  FOR v_org_id IN
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = v_user_id
      AND om.is_active = true
  LOOP
    PERFORM realtime.send(
      jsonb_build_object(
        'user_id',   v_user_id,
        'chat_id',   NEW.chat_id,
        'content',   NEW.content,
        'created_at', NEW.created_at
      ),
      'last_message_updated',
      'org:' || v_org_id::text || ':conversation_updates',
      true
    );
  END LOOP;

  RETURN NULL;
END;
$$;

CREATE TRIGGER messages_broadcast_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_conversation_last_message();
```

### 4. `realtime.send` signature

```
realtime.send(payload jsonb, event text, topic text, is_private boolean)
```

- **payload:** JSON sent to clients (e.g. `to_jsonb(NEW)` or `jsonb_build_object(...)`).
- **event:** Event name (snake_case); client listens with `.on('broadcast', { event: '...' }, cb)`.
- **topic:** Channel name; client subscribes with `supabase.channel(topic, { config: { private: true } })`.
- **is_private:** `true` so only authenticated clients that pass RLS receive the message.

---

## Summary

| Use case           | Topic                                | Event                | Trigger table  |
|--------------------|--------------------------------------|----------------------|----------------|
| Open chat messages | `chat:{chatId}:messages`             | `message_created`    | `messages` INSERT |
| List last message  | `org:{orgId}:conversation_updates`   | `last_message_updated` | `messages` INSERT |

- **Client:** Use `MessagesRealtime` and `ConversationUpdatesRealtime`; always call `cleanup()` on unmount.
- **DB:** Enable Realtime, add RLS on `realtime.messages`, then add the two triggers above.
