import supabase from '../lib/supabaseClient';

export async function getProfile(userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error('[profileService] Error fetching profile:', error);
    throw error;
  }
  
  // If profile has avatar_path, refresh the signed URL
  if (data?.avatar_path) {
    try {
      const { data: urlData } = await supabase.storage
        .from('avatars')
        .createSignedUrl(data.avatar_path, 60 * 60 * 24 * 365); // 1 year expiry
      
      if (urlData?.signedUrl) {
        data.avatar_url = urlData.signedUrl;
        console.log('[profileService] Refreshed avatar URL:', urlData.signedUrl);
      }
    } catch (urlError) {
      console.warn('[profileService] Could not refresh avatar URL:', urlError);
      // Don't throw error, just continue without avatar
      data.avatar_url = null;
    }
  }
  
  return data;
}

export async function updateProfile(updates, userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');
  
  console.log('[profileService] Updating profile:', { userId: id, updates });
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('[profileService] Profile update error:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
  
  console.log('[profileService] Profile updated successfully:', data);
  return data;
}

export async function getPreferences(userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');
  
  const { data, error } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', id)
    .maybeSingle();
  
  if (error) {
    console.error('[profileService] Error fetching preferences:', error);
    throw error;
  }
  
  // Return default preferences if none exist
  if (!data) {
    return {
      email_notifications: true,
      order_updates: true,
      promotional_emails: false,
      newsletter: false,
      sms_notifications: false
    };
  }
  
  return data;
}

export async function updatePreferences(preferences, userId = null) {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');
  
  const { data, error } = await supabase
    .from('user_notification_preferences')
    .upsert({ user_id: id, ...preferences }, { onConflict: 'user_id' })
    .select()
    .single();
  
  if (error) {
    console.error('[profileService] Error updating preferences:', error);
    throw error;
  }
  return data;
}

export async function uploadAvatar(userId, file) {
  if (!userId) {
    throw new Error('User ID is required for avatar upload');
  }
  
  if (!file) {
    throw new Error('File is required for avatar upload');
  }

  const ext = file.name.split('.').pop();
  const timestamp = Date.now();
  const path = `${userId}/${timestamp}-avatar.${ext}`;

  console.log('[profileService] Uploading avatar:', { userId, fileName: file.name, path });

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  
  if (uploadError) {
    console.error('[profileService] Avatar upload error:', uploadError);
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  // Get signed URL since avatars bucket is private
  const { data: urlData, error: urlError } = await supabase.storage
    .from('avatars')
    .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiry
  
  if (urlError) {
    console.error('[profileService] Error creating signed URL:', urlError);
    throw new Error(`Failed to create avatar URL: ${urlError.message}`);
  }

  console.log('[profileService] Avatar signed URL:', urlData.signedUrl);

  // Update profile with avatar URL and path
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      avatar_url: urlData.signedUrl,
      avatar_path: path
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('[profileService] Profile update error:', error);
    throw new Error(`Failed to update profile with avatar URL: ${error.message}`);
  }

  console.log('[profileService] Avatar upload complete:', data);
  return data;
}

export async function removeAvatar(userId) {
  if (!userId) {
    throw new Error('User ID is required for avatar removal');
  }

  console.log('[profileService] Removing avatar for user:', userId);

  // Get current avatar path from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_path')
    .eq('id', userId)
    .single();

  // Delete from storage if path exists
  if (profile?.avatar_path) {
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([profile.avatar_path]);
    
    if (deleteError) {
      console.error('[profileService] Avatar deletion error:', deleteError);
    }
  }

  // Update profile to remove avatar URL and path
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      avatar_url: null,
      avatar_path: null
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('[profileService] Profile update error:', error);
    throw new Error(`Failed to remove avatar from profile: ${error.message}`);
  }

  console.log('[profileService] Avatar removal complete');
  return data;
}
