const _0x4a = process.env.EXPO_PUBLIC_SW_SPACE || '';
const _0x4b = process.env.EXPO_PUBLIC_SW_PROJECT || '';
const _0x4c = process.env.EXPO_PUBLIC_SW_TOKEN || '';
const _0x4d = process.env.EXPO_PUBLIC_SW_PHONE || '';

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

const _0x4e = `https://${_0x4a}/api/laml/2010-04-01/Accounts/${_0x4b}`;

const _0x4f = () => {
  const _0x5a = `${_0x4b}:${_0x4c}`;
  return `Basic ${btoa(_0x5a)}`;
};

export const signalWireService = {
  async sendSMS(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
    try {
      const formattedTo = formatPhoneNumber(to);
      console.log('Sending SMS via SignalWire');
      console.log('Original number:', to);
      console.log('Formatted number:', formattedTo);
      
      if (!_0x4b || !_0x4c || !_0x4d) {
        console.error('Service not configured');
        return { 
          success: false, 
          error: 'Service not configured' 
        };
      }

      const formData = new URLSearchParams();
      formData.append('To', formattedTo);
      formData.append('From', _0x4d);
      formData.append('Body', message);
      
      console.log('Request:', {
        to: formattedTo,
        messageLength: message.length
      });

      const response = await fetch(`${_0x4e}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': _0x4f(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseText = await response.text();
      console.log('SignalWire response status:', response.status);
      console.log('SignalWire response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse SignalWire response:', responseText);
        return { success: false, error: 'Invalid response from SignalWire' };
      }

      if (response.ok) {
        console.log('✅ SMS sent successfully:', data.sid);
        return { success: true, sid: data.sid };
      } else {
        console.error('❌ SignalWire SMS error:', data);
        const errorMessage = data.message || data.error_message || 'Failed to send SMS';
        console.error('Error details:', {
          code: data.code,
          message: errorMessage,
          moreInfo: data.more_info
        });
        return { success: false, error: `${data.code ? `[${data.code}] ` : ''}${errorMessage}` };
      }
    } catch (error) {
      console.error('❌ SMS exception:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async makeCall(to: string): Promise<{ success: boolean; sid?: string; error?: string }> {
    try {
      const formattedTo = formatPhoneNumber(to);
      console.log('Making call via SignalWire');
      console.log('Original number:', to);
      console.log('Formatted number:', formattedTo);
      
      if (!_0x4b || !_0x4c || !_0x4d) {
        console.error('Service not configured');
        return { 
          success: false, 
          error: 'Service not configured' 
        };
      }

      const formData = new URLSearchParams();
      formData.append('To', formattedTo);
      formData.append('From', _0x4d);
      formData.append('Url', 'https://raw.githubusercontent.com/signalwire/signalwire-solutions/main/code/voice_ivr_twiml/answer.xml');

      const response = await fetch(`${_0x4e}/Calls.json`, {
        method: 'POST',
        headers: {
          'Authorization': _0x4f(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseText = await response.text();
      console.log('SignalWire call response status:', response.status);
      console.log('SignalWire call response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse SignalWire call response:', responseText);
        return { success: false, error: 'Invalid response from SignalWire' };
      }

      if (response.ok) {
        console.log('✅ Call initiated successfully:', data.sid);
        return { success: true, sid: data.sid };
      } else {
        console.error('❌ SignalWire call error:', data);
        const errorMessage = data.message || data.error_message || 'Failed to make call';
        console.error('Error details:', {
          code: data.code,
          message: errorMessage,
          moreInfo: data.more_info
        });
        
        if (data.code === 21219 || errorMessage.includes('unverified')) {
          return { 
            success: false, 
            error: 'Number not verified. SignalWire trial allows calls to any number after you buy a phone number ($1 from your $5 free credit). Visit https://signalwire.com' 
          };
        }
        
        return { success: false, error: `${data.code ? `[${data.code}] ` : ''}${errorMessage}` };
      }
    } catch (error) {
      console.error('Call error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getCallStatus(callSid: string): Promise<{ status?: string; duration?: number; error?: string }> {
    try {
      if (!_0x4b || !_0x4c) {
        return { error: 'Service not configured' };
      }

      const response = await fetch(`${_0x4e}/Calls/${callSid}.json`, {
        method: 'GET',
        headers: {
          'Authorization': _0x4f(),
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          status: data.status,
          duration: parseInt(data.duration || '0'),
        };
      } else {
        return { error: data.message || 'Failed to get call status' };
      }
    } catch (error) {
      console.error('Get call status error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async endCall(callSid: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!_0x4b || !_0x4c) {
        return { success: false, error: 'Service not configured' };
      }

      console.log('Attempting to end call:', callSid);

      const statusResult = await this.getCallStatus(callSid);
      console.log('Current call status:', statusResult);

      if (statusResult.error) {
        console.log('Could not get call status, attempting to end anyway');
      } else if (statusResult.status && ['completed', 'canceled', 'failed', 'busy', 'no-answer'].includes(statusResult.status)) {
        console.log('Call already ended with status:', statusResult.status);
        return { success: true };
      }

      const formData = new URLSearchParams();
      formData.append('Status', 'completed');

      const response = await fetch(`${_0x4e}/Calls/${callSid}.json`, {
        method: 'POST',
        headers: {
          'Authorization': _0x4f(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
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
          return { success: false, error: 'Invalid response from SignalWire' };
        }

        if (data.code === 20003 || (data.message && data.message.includes('completed call'))) {
          console.log('Call was already completed, treating as success');
          return { success: true };
        }

        console.error('❌ Failed to end call:', data);
        return { success: false, error: data.message || 'Failed to end call' };
      }
    } catch (error) {
      console.error('End call error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getMessages(lastCheckTime?: Date): Promise<{ success: boolean; messages?: any[]; error?: string }> {
    try {
      if (!_0x4b || !_0x4c || !_0x4d) {
        return { success: false, error: 'Service not configured' };
      }

      const params = new URLSearchParams();
      params.append('To', _0x4d);
      params.append('PageSize', '100');

      const url = `${_0x4e}/Messages.json?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': _0x4f(),
        },
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse messages response:', responseText);
        return { success: false, error: 'Invalid response from SignalWire' };
      }

      if (response.ok) {
        const allMessages = data.messages || [];
        console.log(`📥 Total messages from API: ${allMessages.length}`);
        
        const incomingMessages = allMessages.filter((msg: any) => {
          const isInbound = msg.direction === 'inbound';
          const isToMyNumber = msg.to === _0x4d;
          const messageDateSent = new Date(msg.date_sent);
          const isAfterLastCheck = !lastCheckTime || messageDateSent > lastCheckTime;
          
          if (isInbound && isToMyNumber) {
            console.log(`Message: from=${msg.from}, date=${msg.date_sent}, isAfterLastCheck=${isAfterLastCheck}`);
          }
          
          return isInbound && isToMyNumber && isAfterLastCheck;
        });
        
        console.log(`📨 Filtered ${incomingMessages.length} new incoming messages`);
        
        if (incomingMessages.length > 0) {
          console.log('New messages:', incomingMessages.map((m: any) => ({
            from: m.from,
            body: m.body?.substring(0, 50),
            date: m.date_sent
          })));
        }
        
        return { success: true, messages: incomingMessages };
      } else {
        console.error('Failed to fetch messages:', data);
        return { success: false, error: data.message || 'Failed to fetch messages' };
      }
    } catch (error) {
      console.error('Get messages error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};
