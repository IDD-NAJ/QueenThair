# How to Verify Contact Messages are Being Saved

## Method 1: Browser Console (during development)

1. Open the dashboard support page: http://localhost:5173/dashboard/support
2. Open browser dev tools (F12)
3. Submit a test message
4. Check the console for logs:
   - 📝 Submitting contact message
   - 📤 Inserting message data
   - ✅ Message saved successfully

## Method 2: Supabase Dashboard

1. Go to your Supabase project: https://app.supabase.com/project/kkgprdyubapozuxhlmok
2. Navigate to **Table Editor**
3. Select the **contact_messages** table
4. You should see new entries with:
   - name, email, subject, message
   - status: 'new'
   - created_at timestamp

## Method 3: SQL Query in Supabase

Run this query in the Supabase SQL Editor:

```sql
SELECT 
  id,
  name,
  email,
  subject,
  left(message, 50) as message_preview,
  status,
  created_at
FROM contact_messages 
ORDER BY created_at DESC 
LIMIT 10;
```

## Expected Database Schema

The `contact_messages` table should have:
- `id` (uuid, primary key)
- `name` (text, not null)
- `email` (text, not null) 
- `phone` (text, nullable)
- `subject` (text, nullable)
- `message` (text, not null)
- `status` (contact_status enum: 'new', 'read', 'closed')
- `created_at` (timestamptz, not null)

## RLS Policies

- **Public insert**: Anyone can insert messages (for contact form)
- **Admin management**: Only admins can read/update/delete messages

## Troubleshooting

If messages aren't saving:

1. Check browser console for errors
2. Verify Supabase connection in `.env` file
3. Check if RLS policies are applied correctly
4. Ensure the `contact_messages` table exists

The enhanced logging will show exactly where the process fails.
