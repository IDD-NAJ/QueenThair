# Login Page Loading Fix

## Problem
Login page stuck on infinite loading spinner. Auth bootstrap appeared to hang at `supabase.auth.getSession()` call.

## Root Cause
Auth initialization could fail to complete if:
1. `getSession()` hangs due to network issues
2. Supabase project paused/unavailable
3. CORS or connection errors
4. Component unmounted before state updates

## Solution Applied

### 1. **Safety Timeout in Auth Bootstrap**
Added 5-second safety timeout that forces auth initialization to complete even if `getSession()` hangs:

```js
const safetyTimeout = setTimeout(() => {
  if (!bootstrapCompleted) {
    console.error('[auth] SAFETY TIMEOUT - forcing initialization complete');
    setUser(null);
    setProfile(null);
    setAuthLoading(false);
    setAuthInitialized(true);
    bootstrapCompleted = true;
  }
}, 5000);
```

### 2. **Guaranteed State Updates**
Every exit path from bootstrap now:
- Sets `authLoading: false`
- Sets `authInitialized: true`
- Marks `bootstrapCompleted = true`
- Clears the safety timeout

Exit paths:
- ✅ Error path (invalid refresh token, network error)
- ✅ No session path (logged out)
- ✅ Success path (user authenticated)
- ✅ Catch path (unexpected error)
- ✅ Safety timeout path (getSession hangs)

### 3. **Removed Conditional State Updates**
Previously, state updates were conditional on `mounted` flag:
```js
// OLD - could skip state update
if (mounted) {
  setAuthLoading(false);
  setAuthInitialized(true);
}
```

Now, state always updates:
```js
// NEW - always updates
setAuthLoading(false);
setAuthInitialized(true);
bootstrapCompleted = true;
clearTimeout(safetyTimeout);
```

### 4. **Enhanced Logging**
Added detailed logs to trace execution:
- `[auth] bootstrap start`
- `[auth] calling supabase.auth.getSession()...`
- `[auth] getSession returned: { hasData, hasError }`
- `[auth] session found: true/false`
- `[auth] profile loaded: true/false role: admin/customer/null`
- `[auth] bootstrap complete (success/error/no session/catch)`
- `[auth] SAFETY TIMEOUT` (if triggered)

## Expected Behavior

### Normal Flow (No Session)
1. Bootstrap starts
2. `getSession()` returns no session
3. State: `user: null, profile: null, role: null`
4. `authInitialized: true, authLoading: false`
5. GuestRoute renders login form
6. **Total time: <500ms**

### Normal Flow (With Session)
1. Bootstrap starts
2. `getSession()` returns session
3. Profile fetched
4. State: `user: <user>, profile: <profile>, role: admin/customer`
5. `authInitialized: true, authLoading: false`
6. GuestRoute redirects to dashboard/admin
7. **Total time: <1000ms**

### Error Flow (Network Issue)
1. Bootstrap starts
2. `getSession()` hangs
3. **Safety timeout triggers after 5 seconds**
4. State: `user: null, profile: null, role: null`
5. `authInitialized: true, authLoading: false`
6. GuestRoute renders login form
7. **Total time: 5 seconds (max)**

## Files Modified

- `src/hooks/useAuth.js` - Added safety timeout, guaranteed state updates

## Testing

Refresh the browser and verify:

1. **Console logs show completion**:
   ```
   [auth] bootstrap start
   [auth] calling supabase.auth.getSession()...
   [auth] getSession returned: ...
   [auth] bootstrap complete (...)
   ```

2. **Login page renders** (not stuck on spinner)

3. **GuestRoute logs show initialized state**:
   ```
   [GuestRoute] state: { initialized: true, loading: false, user: false, role: null }
   ```

4. **No timeout warnings** (unless network truly fails)

## Fallback Behavior

If Supabase is unavailable:
- Safety timeout triggers after 5 seconds
- Login page renders (allows user to see form)
- Login attempts will fail with network error
- User sees error message instead of infinite spinner

This is better UX than infinite loading.

## Next Steps

If login page still hangs:
1. Check browser Network tab for failed requests
2. Check Supabase project status (paused?)
3. Verify CORS configuration
4. Check for JavaScript errors in console
5. Verify Supabase credentials in `.env`
