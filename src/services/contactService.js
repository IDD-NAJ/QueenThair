import supabase from '../lib/supabaseClient';

export async function submitContactMessage({ name, email, phone = null, subject = null, message }) {
  try {
    console.log('📝 Submitting contact message:', { name, email, subject, messageLength: message?.length });
    
    // Get current user if authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.warn('⚠️ Auth error, continuing as guest:', authError.message);
    }
    
    const messageData = {
      user_id: user?.id || null,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone,
      subject,
      message: message.trim(),
      status: 'new',
    };
    
    console.log('📤 Inserting message data:', messageData);
    
    const { data, error } = await supabase
      .from('contact_messages')
      .insert(messageData)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    console.log('✅ Message saved successfully:', data);
    return data;
  } catch (error) {
    console.error('💥 Contact service error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }
}
