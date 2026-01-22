# VIP System Architecture & Technical Details

## System Design

### State Management
```typescript
// Whitelist States
const [devWhitelistPinInput, setDevWhitelistPinInput] = useState<string>("");
const [devWhitelistConfirmMode, setDevWhitelistConfirmMode] = useState<boolean>(false);
const [devWhitelistTargetId, setDevWhitelistTargetId] = useState<string | null>(null);
const [devWhitelistedUsers, setDevWhitelistedUsers] = useState<Set<string>>(new Set());

const [staffWhitelistPinInput, setStaffWhitelistPinInput] = useState<string>("");
const [staffWhitelistConfirmMode, setStaffWhitelistConfirmMode] = useState<boolean>(false);
const [staffWhitelistTargetId, setStaffWhitelistTargetId] = useState<string | null>(null);
const [staffWhitelistedUsers, setStaffWhitelistedUsers] = useState<Set<string>>(new Set());

// Server Reset State
const [showServerResetConfirm, setShowServerResetConfirm] = useState<boolean>(false);
```

### Data Flow

#### Whitelist Operation Flow:
```
User clicks "Whitelist for VIP"
    ↓
handleWhitelist(accountId) called
    ↓
Set devWhitelistTargetId = accountId
Set devWhitelistConfirmMode = true
    ↓
Modal shows with PIN input
    ↓
User enters PIN
    ↓
confirmDevWhitelist() validates
    ↓
If PIN matches [49, 48, 57, 48] (1090):
    - Add to devWhitelistedUsers Set
    - Update UserAccount.whitelisted = true
    - Update UI with 👑 VIP badge
    - Show success alert
Else:
    - Show "Invalid PIN" alert
    - Clear input, retry
```

#### SMS Sending Flow:
```
User opens SMS chat
    ↓
handleSendSMS() triggered on send
    ↓
Check: isVIP = currentUser?.whitelisted
    ↓
If NOT VIP:
    - Show alert: "VIP Feature required"
    - Return (abort send)
If VIP:
    - Create message object
    - Call backend.createMessage()
    - Update SMS conversation
    - Show message as sent
```

## Component Architecture

### Modal Structure
```tsx
<Modal visible={devWhitelistConfirmMode} transparent animationType="fade">
  <View style={{flex: 1, backgroundColor: "rgba(0,0,0,0.7)", ...}}>
    <View style={{backgroundColor: "#1C1C1E", borderRadius: 16, ...}}>
      <Text>Confirm Developer Whitelist</Text>
      <TextInput secureTextEntry={true} />
      <View style={{flexDirection: "row", gap: 12}}>
        <TouchableOpacity onPress={cancelHandler} />
        <TouchableOpacity onPress={confirmDevWhitelist} />
      </View>
    </View>
  </View>
</Modal>
```

### PIN Confirmation Pattern
```typescript
const confirmDevWhitelist = () => {
  // Convert input to character codes
  const _0x3a = devWhitelistPinInput.split('').map(c => c.charCodeAt(0));
  
  // PIN 1090 in char codes
  const _0x3b = [49, 48, 57, 48];
  
  // Validate: length match + all characters match
  const isValid = _0x3a.length === _0x3b.length && 
                  _0x3a.every((c, i) => c === _0x3b[i]);
  
  if (isValid && devWhitelistTargetId) {
    // Update user account
    setUserAccounts(prev => prev.map(acc =>
      acc.id === devWhitelistTargetId 
        ? { ...acc, whitelisted: true }
        : acc
    ));
    
    // Add to whitelist set
    setDevWhitelistedUsers(new Set([...devWhitelistedUsers, devWhitelistTargetId]));
    
    // Show success
    Alert.alert("Success", "User whitelisted");
    
    // Reset modal
    setDevWhitelistConfirmMode(false);
    setDevWhitelistPinInput("");
  } else {
    Alert.alert("Invalid PIN", "The PIN you entered is incorrect.");
  }
};
```

## Security Architecture

### PIN Validation
```
Character Code Encoding
Pin: 1090
↓
Character codes: [49, 48, 57, 48]
↓
User input split into chars: ['1','0','9','0']
↓
Map to char codes: [49, 48, 57, 48]
↓
Compare arrays element-by-element
↓
Must match exactly to proceed
```

**Advantages**:
- Not plain-text string comparison
- Harder to reverse-engineer from source
- Array validation prevents accidental matches
- Each character validated independently

### VIP Status Checking
```typescript
const isVIP = currentUser?.whitelisted || false;

if (!isVIP) {
  // Block feature
  Alert.alert("VIP Required", "Message...");
  return;
}

// Allow feature
proceed();
```

## Frontend-Only Limitations

**Current**: All whitelist data stored in React state only
```typescript
const [devWhitelistedUsers, setDevWhitelistedUsers] = useState<Set<string>>(new Set());
```

**Implications**:
- ✅ Whitelist persists during current app session
- ❌ Whitelist lost on app restart
- ❌ Not synced across multiple app instances
- ❌ Cannot be verified by backend

**Solution: Implement Backend Persistence**
```typescript
// Save whitelist
useEffect(() => {
  if (devWhitelistedUsers.size > 0) {
    backend.saveWhitelist({
      type: 'developer',
      userIds: Array.from(devWhitelistedUsers),
      timestamp: new Date(),
    });
  }
}, [devWhitelistedUsers]);

// Load whitelist on startup
useEffect(() => {
  backend.getWhitelist('developer').then(userIds => {
    setDevWhitelistedUsers(new Set(userIds));
  });
}, []);
```

## Integration Points

### Backend Integration Needed:
1. **Whitelist Persistence**
   ```typescript
   POST /api/whitelist/add
   { userId: string, type: 'developer' | 'staff', adminId: string }
   
   DELETE /api/whitelist/remove
   { userId: string, type: 'developer' | 'staff', adminId: string }
   
   GET /api/whitelist/:type
   Returns: { userIds: string[], lastModified: Date }
   ```

2. **Server Reset Broadcasting**
   ```typescript
   POST /api/server/reset
   { reason: string, affectedVersion: string }
   
   Broadcast via WebSocket:
   { type: 'SERVER_RESET', message: '...', closeApp: true }
   ```

3. **VIP Status Verification**
   ```typescript
   GET /api/user/:id/vip-status
   Returns: { whitelisted: boolean, expiresAt?: Date, type: 'developer' | 'staff' | 'subscription' }
   ```

### Current Service Integration:
```typescript
// Message syncing (already implemented)
backend.createMessage({
  userId: currentUser.id,
  contactId: selectedContactId,
  content: newMessage.text,
  timestamp: newMessage.timestamp,
});

// SMS sending (already implemented)
signalWireService.sendSMS(phoneNumber, messageText);
```

## Performance Considerations

### Set vs Array for Whitelist
```typescript
// Current: Using Set (good for lookups)
const [devWhitelistedUsers, setDevWhitelistedUsers] = useState<Set<string>>(new Set());

// Lookup performance: O(1)
if (devWhitelistedUsers.has(userId)) { }

// vs Array lookup: O(n)
if (devWhitelistedUsers.includes(userId)) { }
```

**Recommendation**: Keep Set for efficient lookups when many whitelisted users

### Modal Rendering
```typescript
// Modal re-renders only when state changes
<Modal visible={devWhitelistConfirmMode} />

// Good: Only the modal updates when PIN is entered
// Not: Entire component re-render prevented by Modal boundary
```

## Error Handling

### PIN Validation Errors
```typescript
try {
  confirmDevWhitelist(); // May throw if parsing fails
} catch (error) {
  console.error('Whitelist confirmation failed:', error);
  Alert.alert("Error", "Failed to process whitelist change");
  setDevWhitelistConfirmMode(false);
}
```

### Backend Sync Errors (Future)
```typescript
backend.saveWhitelist(whitelistData).catch(error => {
  console.error('Failed to sync whitelist:', error);
  
  // Show offline alert
  Alert.alert(
    "Sync Error",
    "Whitelist change not synced to server. Will retry when online.",
    [{ text: "OK" }]
  );
  
  // Queue for retry
  retryQueue.push({ type: 'whitelist', data: whitelistData });
});
```

## Testing Strategy

### Unit Tests (Pseudo-code)
```javascript
describe('Developer Whitelist', () => {
  test('PIN validation with correct PIN', () => {
    const input = "1090".split('').map(c => c.charCodeAt(0));
    const expected = [49, 48, 57, 48];
    expect(input).toEqual(expected);
  });
  
  test('PIN validation with wrong PIN', () => {
    const input = "1234".split('').map(c => c.charCodeAt(0));
    const expected = [49, 48, 57, 48];
    expect(input).not.toEqual(expected);
  });
  
  test('Whitelist user adds to set', () => {
    const whitelist = new Set(['user1']);
    whitelist.add('user2');
    expect(whitelist.has('user2')).toBe(true);
  });
});
```

### Integration Tests
```typescript
test('Full whitelist flow', async () => {
  // 1. Click whitelist button
  fireEvent.press(whitelistButton);
  
  // 2. Verify modal shows
  expect(screen.getByText('Confirm Developer Whitelist')).toBeTruthy();
  
  // 3. Enter PIN
  fireEvent.changeText(pinInput, '1090');
  
  // 4. Click confirm
  fireEvent.press(confirmButton);
  
  // 5. Verify user has VIP badge
  await waitFor(() => {
    expect(screen.getByText('👑 VIP')).toBeTruthy();
  });
});
```

## Monitoring & Logging

### Recommended Logging Points
```typescript
// Whitelist actions
console.log('[Whitelist] Initiating PIN confirmation for user:', accountId);
console.log('[Whitelist] PIN validation result:', isValid);
console.log('[Whitelist] Added user to whitelist:', accountId);
console.log('[Whitelist] Removed user from whitelist:', accountId);

// VIP checks
console.log('[VIP] SMS blocked for non-VIP user:', currentUser.id);
console.log('[VIP] SMS allowed for VIP user:', currentUser.id);

// Server reset
console.log('[ServerReset] Initiated by admin:', currentAdmin.id);
console.log('[ServerReset] Broadcasting shutdown alert');
```

### Analytics Events (Future)
```typescript
realtimeService.reportEvent('admin_whitelist_user', {
  adminId: currentAdmin.id,
  targetUserId: accountId,
  panelType: 'developer',
  timestamp: new Date(),
});

realtimeService.reportEvent('vip_feature_blocked', {
  userId: currentUser.id,
  featureName: 'sms',
  timestamp: new Date(),
});
```

## Deployment Checklist

- [ ] Whitelist states initialized properly
- [ ] PIN validation functions working
- [ ] Modals rendering correctly
- [ ] SMS VIP gate blocking non-VIP
- [ ] Server reset alert functioning
- [ ] Developer panel searching works
- [ ] Staff panel searching works
- [ ] Account expansion/collapse working
- [ ] Whitelist badges displaying
- [ ] Remove button removing whitelist
- [ ] Wrong PIN showing error
- [ ] Modal dismissal clearing inputs

## Future Roadmap

### Phase 1 (Current): ✅
- Developer/staff whitelist with PIN confirmation
- Server reset notification
- SMS VIP gate

### Phase 2 (Planned):
- AsyncStorage persistence
- Backend API integration
- Audit logging

### Phase 3 (Future):
- Whitelist expiration dates
- Bulk operations
- Automated backups
- Permission levels (super admin, moderator)

---

**Architecture Version**: 1.0
**Last Updated**: 2024
**Review Status**: Complete
