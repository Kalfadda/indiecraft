# Security Vulnerability Fixes

This document addresses the 12 security vulnerabilities found in the Supabase security scan.

## Quick Reference

| # | Vulnerability | Severity | Fix Location |
|---|---------------|----------|--------------|
| 1 | Login Rate Limiting | HIGH | Supabase Dashboard |
| 2 | OTP Brute Force | HIGH | Supabase Dashboard |
| 3 | Content-Type Sniffing | MEDIUM | Supabase Dashboard |
| 4 | Realtime Token in URL | MEDIUM | Client Code |
| 5 | Error Message Leakage | MEDIUM | Application Code |
| 6 | RPC Function Enumeration | HIGH | SQL Migration |
| 7 | Security Headers Missing | MEDIUM | Supabase Dashboard |
| 8 | API Version Disclosure | LOW | N/A (Informational) |
| 9 | Memory Exhaustion | HIGH | Edge Functions |
| 10 | TLS Downgrade | HIGH | Supabase Dashboard |
| 11 | Credentials in Error Messages | MEDIUM | Application Code |
| 12 | Password Reset Abuse | HIGH | Supabase Dashboard |

---

## SQL Migration Fix

Run `migrations/security_hardening.sql` in Supabase SQL Editor to fix:
- **#6 RPC Function Enumeration** - Revokes public access to internal functions
- Adds search_path security to SECURITY DEFINER functions
- Restricts schema access
- Adds rate limiting infrastructure
- Adds audit logging table

---

## Supabase Dashboard Fixes

### 1. Login Rate Limiting (HIGH)

**Location:** Authentication > Settings > Rate Limits

1. Go to Supabase Dashboard > Authentication > Settings
2. Scroll to "Rate Limits" section
3. Configure:
   - **Sign-in attempts**: 5 per hour
   - **Sign-up attempts**: 3 per hour
   - **Token refresh attempts**: 30 per hour

### 2. OTP Brute Force Vulnerability (HIGH)

**Location:** Authentication > Settings > OTP

1. Go to Authentication > Settings
2. Under "OTP Expiry":
   - Set OTP expiry to **5 minutes** (300 seconds)
3. Under "Rate Limits":
   - Set OTP requests to **3 per hour**

### 3. Content-Type Sniffing Attack (MEDIUM)

**Location:** Storage > Policies

1. Go to Storage > Configuration
2. For each bucket, ensure:
   - **File type validation** is enabled
   - **Allowed MIME types** are explicitly defined
3. Add a storage policy to restrict uploads:

```sql
-- In SQL Editor, add content-type restrictions
CREATE POLICY "Restrict file types"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  (bucket_id = 'your-bucket' AND
   (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'pdf')))
);
```

### 7. Security Headers Missing (MEDIUM)

**For Edge Functions:**

Add these headers to all Edge Function responses:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-domain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
};
```

### 10. TLS Downgrade Check (HIGH)

**Location:** Project Settings > API

1. Go to Project Settings > API
2. Ensure "Enforce HTTPS" is enabled
3. In your application, always use `https://` URLs

### 12. Password Reset Flow Abuse (HIGH)

**Location:** Authentication > Settings

1. Go to Authentication > Settings
2. Under "Email Templates" > "Reset Password":
   - Add CAPTCHA if available
3. Under "Rate Limits":
   - Set password reset requests to **3 per hour**
4. Under "Security":
   - Enable "Require email confirmation for password change"

---

## Application Code Fixes

### 4. Realtime Token in URL (MEDIUM)

**File:** `src/lib/supabase.ts`

The Supabase client handles this automatically with modern versions. Ensure you're using the latest `@supabase/supabase-js`:

```bash
npm update @supabase/supabase-js
```

### 5 & 11. Error Message Information Leakage (MEDIUM)

Update error handling to sanitize messages before showing to users.

**Create a utility file:**

```typescript
// src/lib/errorHandler.ts

// Map of internal error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  'invalid_credentials': 'Invalid email or password',
  'email_not_confirmed': 'Please verify your email address',
  'user_not_found': 'Account not found',
  'too_many_requests': 'Too many attempts. Please try again later.',
  'invalid_grant': 'Session expired. Please sign in again.',
  'PGRST301': 'You do not have permission to perform this action',
  'PGRST116': 'Resource not found',
  '23505': 'This item already exists',
  '23503': 'Cannot delete - item is referenced elsewhere',
};

// Patterns that might leak sensitive info
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /key/i,
  /token/i,
  /credential/i,
  /auth/i,
  /session/i,
  /postgres/i,
  /supabase/i,
  /sql/i,
  /query/i,
  /table/i,
  /column/i,
  /schema/i,
  /database/i,
  /connection/i,
  /host/i,
  /port/i,
];

export function sanitizeError(error: unknown): string {
  if (!error) return 'An unexpected error occurred';

  const errorObj = error as { message?: string; code?: string; details?: string };
  const code = errorObj.code || '';
  const message = errorObj.message || '';

  // Check for known error codes first
  if (ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // Check for Postgres error codes
  for (const [pattern, friendly] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(pattern)) {
      return friendly;
    }
  }

  // Check if message contains sensitive information
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      console.error('Sanitized error:', error); // Log full error for debugging
      return 'An error occurred. Please try again.';
    }
  }

  // If message seems safe, return a truncated version
  if (message.length > 100) {
    return message.substring(0, 100) + '...';
  }

  return message || 'An unexpected error occurred';
}
```

**Update your hooks to use it:**

```typescript
// In mutation hooks, wrap errors:
import { sanitizeError } from '@/lib/errorHandler';

// In onError callbacks:
onError: (error) => {
  useNotificationStore.getState().addNotification({
    type: 'error',
    message: sanitizeError(error),
  });
}
```

---

## Edge Function Fixes

### 9. Memory Exhaustion Attack (HIGH)

If you have Edge Functions, add request size limits:

```typescript
// In your Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit

serve(async (req) => {
  // Check content-length header
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return new Response('Request too large', { status: 413 });
  }

  // For streaming requests, limit as you read
  if (req.body) {
    const reader = req.body.getReader();
    let totalSize = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.length;
      if (totalSize > MAX_BODY_SIZE) {
        return new Response('Request too large', { status: 413 });
      }
    }
  }

  // Process request...
});
```

---

## Verification Queries

Run these in SQL Editor to verify security settings:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check function privileges (should show limited access)
SELECT
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as owner,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security,
  p.proacl as access_control
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for tables without RLS
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
```

---

## Security Checklist

- [ ] Run `migrations/security_hardening.sql` in SQL Editor
- [ ] Configure login rate limiting in Dashboard
- [ ] Configure OTP rate limiting in Dashboard
- [ ] Configure password reset rate limiting in Dashboard
- [ ] Enable HTTPS enforcement in Project Settings
- [ ] Update `@supabase/supabase-js` to latest version
- [ ] Add error sanitization utility to application
- [ ] Add security headers to Edge Functions (if applicable)
- [ ] Configure storage bucket MIME type restrictions
- [ ] Run verification queries to confirm settings

---

## Notes

### #8. API Version Information Disclosure (LOW)
This is informational and cannot be fully mitigated as it's part of Supabase's platform. The exposure is minimal and doesn't provide attackers with actionable information.

### Email Confirmation
As noted in CLAUDE.md, email confirmation is disabled for this desktop app. This is a known trade-off. If you enable it in the future, update the Auth settings accordingly.
