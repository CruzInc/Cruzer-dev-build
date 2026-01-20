# Telnyx Setup Guide

## Replacing SignalWire with Telnyx

This project now uses Telnyx for voice calls and SMS messaging. Telnyx offers competitive pricing and global coverage.

## Why Telnyx?

- **Better Pricing**: More competitive rates than SignalWire
- **Global Coverage**: Support for 100+ countries
- **Reliable API**: RESTful API with comprehensive documentation
- **No Trial Limits**: Full access with pay-as-you-go pricing
- **Advanced Features**: WebRTC, SIP trunking, IoT connectivity

## Setup Instructions

### 1. Create a Telnyx Account

1. Go to [telnyx.com/sign-up](https://telnyx.com/sign-up)
2. Complete the registration process
3. Verify your email address
4. Add a payment method (required even for testing)

### 2. Get Your API Key

1. Log in to [Telnyx Portal](https://portal.telnyx.com)
2. Go to **Auth** → **API Keys** ([direct link](https://portal.telnyx.com/#/app/auth/v2))
3. Click **"Create API Key"**
4. Give it a name (e.g., "Cruzer App")
5. Copy the key (starts with `KEY...`) - **save it securely!**

### 3. Buy a Phone Number

1. Go to **Numbers** → **Buy Numbers** ([direct link](https://portal.telnyx.com/#/app/numbers/buy-numbers))
2. Search for a number in your desired area code
3. Select a number and click **"Buy Number"**
4. Cost: ~$1-2/month + usage

### 4. Create a Messaging Profile

1. Go to **Messaging** → **Messaging Profiles** ([direct link](https://portal.telnyx.com/#/app/messaging))
2. Click **"Create Messaging Profile"**
3. Name it (e.g., "Cruzer SMS")
4. Enable **"Send messages with Alphanumeric Sender ID"** (optional)
5. Click **"Create"**
6. Copy the **Messaging Profile ID** (UUID format)
7. **Assign your phone number** to this profile:
   - Click on the profile
   - Go to **"Phone Numbers"** tab
   - Click **"Add Phone Numbers"**
   - Select your purchased number

### 5. Create a Voice Connection (for Calls)

1. Go to **Voice** → **Connections** ([direct link](https://portal.telnyx.com/#/app/connections))
2. Click **"Create Connection"**
3. Select **"Call Control"** connection type
4. Name it (e.g., "Cruzer Voice")
5. Configure:
   - Outbound Voice Profile: Default or create new
   - Webhook URL: Leave blank for now (or use your server if you have one)
6. Click **"Create"**
7. Copy the **Connection ID**
8. **Assign your phone number** to this connection:
   - Go to **Numbers** → **My Numbers**
   - Click on your number
   - Set **Connection** to your newly created connection

### 6. Configure Environment Variables

Add these to your `.env` file:

```env
# Telnyx Configuration
EXPO_PUBLIC_TELNYX_API_KEY=KEY01234567890abcdef
EXPO_PUBLIC_TELNYX_PHONE=+1234567890
EXPO_PUBLIC_TELNYX_MESSAGING_PROFILE_ID=40000000-0000-0000-0000-000000000000
EXPO_PUBLIC_TELNYX_CONNECTION_ID=1234567890
```

Replace with your actual values:
- `TELNYX_API_KEY`: Your API key from step 2
- `TELNYX_PHONE`: Your purchased phone number from step 3 (with +1 prefix)
- `TELNYX_MESSAGING_PROFILE_ID`: From step 4
- `TELNYX_CONNECTION_ID`: From step 5

### 7. Test Your Setup

1. Start your app: `npx expo start`
2. Try sending an SMS to a verified number
3. Try making a call

## Pricing

### SMS
- **US/Canada**: $0.0079/message (inbound), $0.0079/message (outbound)
- **International**: Varies by country ([see rates](https://telnyx.com/pricing/messaging))

### Voice Calls
- **US/Canada**: $0.009/minute (inbound), $0.012/minute (outbound)
- **International**: Varies by country ([see rates](https://telnyx.com/pricing/voice))

### Phone Numbers
- **Toll-Free**: $2/month
- **Local**: $1/month
- **International**: Varies by country

## Features Compared to SignalWire

| Feature | SignalWire | Telnyx | Notes |
|---------|------------|--------|-------|
| SMS | ✅ | ✅ | Both support US/International |
| Voice Calls | ✅ | ✅ | Both support call control |
| MMS | ✅ | ✅ | Image/video messaging |
| WebRTC | ✅ | ✅ | In-browser calling |
| SIP Trunking | ✅ | ✅ | Enterprise voice |
| Pricing | $$ | $ | Telnyx generally cheaper |
| Global Coverage | Good | Better | Telnyx: 100+ countries |

## API Differences

The main code changes were:

1. **Authentication**: Bearer token instead of Basic auth
2. **Response Format**: `data` wrapper vs direct response
3. **Error Format**: `errors[]` array vs single error object
4. **Call Control**: `call_control_id` vs `call_sid`
5. **Message IDs**: UUIDs vs short SIDs

## Troubleshooting

### "Telnyx not configured" error
- Ensure all environment variables are set in `.env`
- Restart the Expo dev server after changing `.env`

### SMS not sending
- Verify your messaging profile has your phone number assigned
- Check that the messaging profile ID is correct
- Ensure your phone number is enabled for SMS

### Calls not working
- Verify your connection has your phone number assigned
- Check that the connection ID is correct
- Ensure your phone number is enabled for voice

### Number not verified
- Telnyx doesn't require number verification like SignalWire trials
- You can call/SMS any number once your account is activated

## Support

- **Documentation**: [developers.telnyx.com](https://developers.telnyx.com)
- **API Reference**: [developers.telnyx.com/docs/api](https://developers.telnyx.com/docs/api/v2/overview)
- **Support**: [support.telnyx.com](https://support.telnyx.com)
- **Status**: [status.telnyx.com](https://status.telnyx.com)

## Migration Checklist

- [ ] Create Telnyx account
- [ ] Get API key
- [ ] Buy phone number
- [ ] Create messaging profile
- [ ] Assign number to messaging profile
- [ ] Create voice connection
- [ ] Assign number to voice connection
- [ ] Update `.env` with all credentials
- [ ] Test SMS sending
- [ ] Test voice calls
- [ ] Test receiving messages
- [ ] Update production environment variables

## Cost Estimate

Example monthly costs:
- **Phone Number**: $1/month
- **1000 SMS**: ~$8
- **100 minutes of calls**: ~$1.20
- **Total**: ~$10/month for moderate usage

Much more affordable than SignalWire's $5 trial credit that expires!
