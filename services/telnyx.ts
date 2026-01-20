// Telnyx API Service for Voice and Messaging
const TELNYX_API_KEY = process.env.EXPO_PUBLIC_TELNYX_API_KEY || '';
const TELNYX_PHONE = process.env.EXPO_PUBLIC_TELNYX_PHONE || '';
const TELNYX_MESSAGING_PROFILE_ID = process.env.EXPO_PUBLIC_TELNYX_MESSAGING_PROFILE_ID || '';

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  if (phone.startsWith('+')) {
    return phone;
  }
  
  return `+${cleaned}`;
}

const TELNYX_BASE_URL = 'https://api.telnyx.com/v2';

const getTelnyxHeaders = () => {
  return {
    'Authorization': `Bearer ${TELNYX_API_KEY}`,
    'Content-Type': 'application/json',
  };
};

export const telnyxService = {
  async sendSMS(to: string, message: string): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const formattedTo = formatPhoneNumber(to);
      console.log('Sending SMS via Telnyx');
      console.log('Original number:', to);
      console.log('Formatted number:', formattedTo);
      
      if (!TELNYX_API_KEY || !TELNYX_PHONE || !TELNYX_MESSAGING_PROFILE_ID) {
        console.error('Telnyx not configured');
        return { 
          success: false, 
          error: 'Telnyx not configured. Set TELNYX_API_KEY, TELNYX_PHONE, and TELNYX_MESSAGING_PROFILE_ID' 
        };
      }

      const payload = {
        from: TELNYX_PHONE,
        to: formattedTo,
        text: message,
        messaging_profile_id: TELNYX_MESSAGING_PROFILE_ID,
      };
      
      console.log('Request:', {
        to: formattedTo,
        messageLength: message.length
      });

      const response = await fetch(`${TELNYX_BASE_URL}/messages`, {
        method: 'POST',
        headers: getTelnyxHeaders(),
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('Telnyx response status:', response.status);
      console.log('Telnyx response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse Telnyx response:', responseText);
        return { success: false, error: 'Invalid response from Telnyx' };
      }

      if (response.ok) {
        console.log('✅ SMS sent successfully:', data.data?.id);
        return { success: true, id: data.data?.id };
      } else {
        console.error('❌ Telnyx SMS error:', data);
        const errorMessage = data.errors?.[0]?.detail || data.errors?.[0]?.title || 'Failed to send SMS';
        console.error('Error details:', data.errors);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('❌ SMS exception:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async makeCall(to: string): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const formattedTo = formatPhoneNumber(to);
      console.log('Making call via Telnyx');
      console.log('Original number:', to);
      console.log('Formatted number:', formattedTo);
      
      if (!TELNYX_API_KEY || !TELNYX_PHONE) {
        console.error('Telnyx not configured');
        return { 
          success: false, 
          error: 'Telnyx not configured. Set TELNYX_API_KEY and TELNYX_PHONE' 
        };
      }

      const payload = {
        connection_id: process.env.EXPO_PUBLIC_TELNYX_CONNECTION_ID || '',
        to: formattedTo,
        from: TELNYX_PHONE,
        // You can customize the call flow with answer_url or webhook_url
        // For now using basic call initiation
      };

      const response = await fetch(`${TELNYX_BASE_URL}/calls`, {
        method: 'POST',
        headers: getTelnyxHeaders(),
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('Telnyx call response status:', response.status);
      console.log('Telnyx call response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse Telnyx call response:', responseText);
        return { success: false, error: 'Invalid response from Telnyx' };
      }

      if (response.ok) {
        console.log('✅ Call initiated successfully:', data.data?.call_control_id);
        return { success: true, id: data.data?.call_control_id };
      } else {
        console.error('❌ Telnyx call error:', data);
        const errorMessage = data.errors?.[0]?.detail || data.errors?.[0]?.title || 'Failed to make call';
        console.error('Error details:', data.errors);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Call error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getCallStatus(callControlId: string): Promise<{ status?: string; duration?: number; error?: string }> {
    try {
      if (!TELNYX_API_KEY) {
        return { error: 'Telnyx not configured' };
      }

      const response = await fetch(`${TELNYX_BASE_URL}/calls/${callControlId}`, {
        method: 'GET',
        headers: getTelnyxHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          status: data.data?.status,
          duration: parseInt(data.data?.duration_secs || '0'),
        };
      } else {
        return { error: data.errors?.[0]?.detail || 'Failed to get call status' };
      }
    } catch (error) {
      console.error('Get call status error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async endCall(callControlId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!TELNYX_API_KEY) {
        return { success: false, error: 'Telnyx not configured' };
      }

      console.log('Attempting to end call:', callControlId);

      const statusResult = await this.getCallStatus(callControlId);
      console.log('Current call status:', statusResult);

      if (statusResult.error) {
        console.log('Could not get call status, attempting to end anyway');
      } else if (statusResult.status && ['hangup', 'completed'].includes(statusResult.status)) {
        console.log('Call already ended with status:', statusResult.status);
        return { success: true };
      }

      const response = await fetch(`${TELNYX_BASE_URL}/calls/${callControlId}/actions/hangup`, {
        method: 'POST',
        headers: getTelnyxHeaders(),
        body: JSON.stringify({}),
      });

      const responseText = await response.text();
      console.log('End call response status:', response.status);
      console.log('End call response:', responseText);

      if (response.ok) {
        console.log('✅ Call ended successfully');
        return { success: true };
      } else {
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          return { success: false, error: 'Invalid response from Telnyx' };
        }

        console.error('❌ Failed to end call:', data);
        return { success: false, error: data.errors?.[0]?.detail || 'Failed to end call' };
      }
    } catch (error) {
      console.error('End call error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getMessages(lastCheckTime?: Date): Promise<{ success: boolean; messages?: any[]; error?: string }> {
    try {
      if (!TELNYX_API_KEY || !TELNYX_PHONE) {
        return { success: false, error: 'Telnyx not configured' };
      }

      const params = new URLSearchParams();
      params.append('filter[direction]', 'inbound');
      params.append('filter[to][]', TELNYX_PHONE);
      params.append('page[size]', '100');

      const url = `${TELNYX_BASE_URL}/messages?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getTelnyxHeaders(),
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse messages response:', responseText);
        return { success: false, error: 'Invalid response from Telnyx' };
      }

      if (response.ok) {
        const allMessages = data.data || [];
        console.log(`📥 Total messages from API: ${allMessages.length}`);
        
        const incomingMessages = allMessages.filter((msg: any) => {
          const isInbound = msg.direction === 'inbound';
          const isToMyNumber = msg.to?.some((num: any) => num.phone_number === TELNYX_PHONE);
          const messageDateSent = new Date(msg.sent_at || msg.received_at);
          const isAfterLastCheck = !lastCheckTime || messageDateSent > lastCheckTime;
          
          if (isInbound && isToMyNumber) {
            console.log(`Message: from=${msg.from.phone_number}, date=${msg.sent_at}, isAfterLastCheck=${isAfterLastCheck}`);
          }
          
          return isInbound && isToMyNumber && isAfterLastCheck;
        });
        
        console.log(`📨 Filtered ${incomingMessages.length} new incoming messages`);
        
        if (incomingMessages.length > 0) {
          console.log('New messages:', incomingMessages.map((m: any) => ({
            from: m.from?.phone_number,
            body: m.text?.substring(0, 50),
            date: m.sent_at || m.received_at
          })));
        }
        
        // Transform to compatible format
        const transformedMessages = incomingMessages.map((msg: any) => ({
          sid: msg.id,
          from: msg.from?.phone_number,
          to: TELNYX_PHONE,
          body: msg.text,
          date_sent: msg.sent_at || msg.received_at,
          direction: msg.direction,
        }));
        
        return { success: true, messages: transformedMessages };
      } else {
        console.error('Failed to fetch messages:', data);
        return { success: false, error: data.errors?.[0]?.detail || 'Failed to fetch messages' };
      }
    } catch (error) {
      console.error('Get messages error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};
