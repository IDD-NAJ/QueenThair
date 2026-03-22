# Auth Initialization & Route Guard Fix Summary

## Problem Diagnosed
- **Timeout-based fallbacks** in all route guards (`GuestRoute`, `ProtectedRoute`, `AdminRoute`)
- **Incomplete auth state model** - missing `role` field, inconsistent loading flag updates
- **Profile fetch throwing errors** - using `.single()` instead of `.maybeSingle()`
- **Competing navigation logic** - LoginPage manually navigating after sign-in while GuestRoute also redirects
- **Auth listener not setting `authInitialized`** - only bootstrap set it, causing inconsistent state

## Fixes Applied

### 1. **Auth State Model** (`src/store/useStore.js`)
- ✅ Added `role` field to store (derived from `profile.role`)
- ✅ `setUser()` no longer sets `authLoading: false` (prevents race conditions)
- ✅ `setProfile()` now also sets `role: profile?.role ?? null`
- ✅ `clearAuthState()` clears `role` as well

### 2. **Profile Service** (`src/services/profileService.js`)
- ✅ Changed `getProfile()` from `.single()` to `.maybeSingle()`
- ✅ Returns `null` instead of throwing when profile doesn't exist
- ✅ Logs errors but doesn't crash auth initialization

### 3. **Auth Bootstrap** (`src/hooks/useAuth.js`)
- ✅ Rewritten `useAuthInit()` with deterministic state transitions
- ✅ Always sets `authInitialized: true` in `finally` block
- ✅ Handles invalid refresh tokens gracefully
- ✅ Profile fetch wrapped in try/catch, never blocks initialization
- ✅ Auth listener also sets `authInitialized: true` on every state change
- ✅ Added structured debug logging: `[auth] bootstrap start`, `[auth] session found`, `[auth] profile loaded`, etc.

### 4. **Route Guards** - All Timeout Logic Removed

#### `GuestRoute.jsx`
- ❌ Removed `setTimeout` timeout fallback
- ❌ Removed `forceRender` state
- ✅ Deterministic: waits for `authInitialized && !authLoading`
- ✅ Redirects based on `role` from store (not `profile?.role`)
- ✅ Added debug logging

#### `ProtectedRoute.jsx`
- ❌ Removed `setTimeout` timeout fallback
- ❌ Removed `forceRender` state
- ✅ Deterministic: waits for `authInitialized && !authLoading`
- ✅ Checks `user` directly from store
- ✅ Added debug logging

#### `AdminRoute.jsx`
- ❌ Removed both auth and profile timeout fallbacks
- ❌ Removed `forceRender` and `profileTimeout` state
- ✅ Deterministic: waits for `authInitialized && !authLoading`
- ✅ Checks `role` from store with email domain fallback
- ✅ Added debug logging

### 5. **Login Flow** (`src/pages/LoginPage.jsx`)
- ❌ Removed manual `navigate()` after sign-in
- ❌ Removed `setTimeout` waiting for profile
- ✅ Lets `GuestRoute` handle redirect based on auth state change
- ✅ No competing navigation logic

## Expected Behavior After Fix

### ✅ Sign-In Flow
1. User submits login form
2. `signIn()` succeeds
3. Supabase `onAuthStateChange` fires
4. `useAuthInit` listener fetches profile and updates store
5. Store updates: `user`, `profile`, `role`, `authInitialized: true`, `authLoading: false`
6. `GuestRoute` detects authenticated user
7. `GuestRoute` redirects to `/admin` (if admin) or `/dashboard` (if customer)
8. **No timeout logs**
9. **No redirect loops**

### ✅ Page Refresh on Protected Route
1. App starts, `useAuthInit` runs
2. `supabase.auth.getSession()` called
3. If session exists, fetch profile
4. Set `user`, `profile`, `role`, `authInitialized: true`, `authLoading: false`
5. Route guard checks state and renders page
6. **No timeout logs**
7. **No forced decisions**

### ✅ Invalid Refresh Token
1. `getSession()` returns error with "Invalid Refresh Token"
2. `useAuthInit` detects invalid token
3. Calls `signOut()` to clear session
4. Sets `user: null`, `profile: null`, `role: null`
5. Sets `authInitialized: true`, `authLoading: false`
6. Guards redirect to login
7. **No hanging state**

### ✅ Missing Profile Row
1. User authenticated but no profile in DB
2. `getProfile()` returns `null` (doesn't throw)
3. Store: `user: <user>`, `profile: null`, `role: null`
4. `authInitialized: true`, `authLoading: false`
5. Guards allow access (user exists)
6. Admin check uses email domain fallback
7. **No deadlock**

## Debug Logging Added

All logs use consistent format for easy filtering:

```
[auth] bootstrap start
[auth] session found: true/false
[auth] profile loaded: true/false role: admin/customer/null
[auth] bootstrap complete
[auth] state change: SIGNED_IN/SIGNED_OUT/etc
[GuestRoute] state: { initialized, loading, user, role }
[ProtectedRoute] state: { initialized, loading, user }
[AdminRoute] state: { initialized, loading, user, role }
```

## Files Modified

1. `src/store/useStore.js` - Added `role`, fixed `setUser`/`setProfile`
2. `src/services/profileService.js` - Changed to `maybeSingle()`
3. `src/hooks/useAuth.js` - Rewrote bootstrap with proper state transitions
4. `src/components/common/GuestRoute.jsx` - Removed timeout, made deterministic
5. `src/components/common/ProtectedRoute.jsx` - Removed timeout, made deterministic
6. `src/components/common/AdminRoute.jsx` - Removed timeout, made deterministic
7. `src/pages/LoginPage.jsx` - Removed manual navigation after sign-in

## Verification Checklist

- [ ] No timeout logs in console
- [ ] Login succeeds and redirects correctly
- [ ] Admin users go to `/admin`
- [ ] Customer users go to `/dashboard`
- [ ] Guest users can access `/login`
- [ ] Unauthenticated users hitting `/dashboard` redirect to `/login`
- [ ] Page refresh on `/dashboard` works
- [ ] Page refresh on `/admin` works
- [ ] Invalid refresh token degrades to logged-out state
- [ ] No redirect loops
- [ ] No duplicate auth subscriptions
- [ ] Auth state always reaches `authInitialized: true`

## Next Steps

1. Test login flow with admin account
2. Test login flow with customer account
3. Test page refresh on protected routes
4. Verify no console errors or timeout warnings
5. Remove debug logging once verified (optional - can keep for production debugging)
