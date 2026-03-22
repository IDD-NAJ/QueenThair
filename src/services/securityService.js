import supabase from '../lib/supabaseClient';

/**
 * Update user password with current password verification
 */
export async function updatePassword(currentPassword, newPassword) {
  if (!currentPassword) {
    throw new Error('Current password is required');
  }

  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long');
  }

  if (currentPassword === newPassword) {
    throw new Error('New password must be different from current password');
  }

  console.log('[securityService] Starting password update...');

  try {
    // First verify the current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify current password by attempting to re-authenticate
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      console.error('[securityService] Current password verification failed:', signInError);
      throw new Error('Current password is incorrect');
    }

    console.log('[securityService] Current password verified, updating password...');

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (updateError) {
      console.error('[securityService] Password update error:', updateError);
      throw new Error(updateError.message || 'Failed to update password');
    }

    console.log('[securityService] Password updated successfully');

    // Try to log security event (don't fail if table doesn't exist)
    try {
      await logSecurityEvent('password_changed', {
        timestamp: new Date().toISOString(),
        method: 'user_initiated'
      });
    } catch (logError) {
      console.warn('[securityService] Could not log security event:', logError);
      // Don't throw error, password update was successful
    }

  } catch (error) {
    console.error('[securityService] Password update failed:', error);
    throw error;
  }
}

/**
 * Log a security event for the current user
 */
export async function logSecurityEvent(eventType, metadata = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('security_events')
      .insert({
        user_id: user.id,
        event_type: eventType,
        metadata
      });

    if (error) {
      console.error('[securityService] Failed to log security event:', error);
      throw error;
    }
  } catch (err) {
    console.error('[securityService] Error logging security event:', err);
    throw err;
  }
}

/**
 * Get security events for current user
 */
export async function getSecurityEvents(userId = null, limit = 20) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');

  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[securityService] Error fetching security events:', error);
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('[securityService] Error in getSecurityEvents:', err);
    return [];
  }
}
