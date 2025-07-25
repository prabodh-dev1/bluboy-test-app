# Authentication with localStorage Persistence

This Tambola Multi-Player Testing App now includes comprehensive localStorage persistence for authenticated user sessions.

## Features

### 🔐 **Persistent Authentication**
- **Automatic Save**: User tokens are automatically saved to localStorage when signing in
- **Auto-Restore**: Users are restored on page reload/refresh
- **Environment-Specific**: Users are stored per environment (Test/Production)

### ⏰ **Token Management**
- **Expiry Tracking**: Tokens have 1-hour expiry from sign-in time
- **Auto-Refresh**: Tokens can be manually refreshed before expiry
- **Visual Warnings**: Orange warning icon appears 5 minutes before expiry
- **Seamless Experience**: No interruption to user testing flow

### 🗑️ **Clean Logout**
- **Complete Cleanup**: Sign out removes users from both memory and localStorage
- **Individual/Bulk**: Sign out single users or all users at once
- **Firebase Integration**: Proper Firebase authentication cleanup

## How It Works

### 1. **Sign In Process**
```typescript
// When user signs in with Google
const authenticatedUser = {
  id: user.uid,
  accessToken: await user.getIdToken(),
  refreshToken: user.refreshToken,
  environment: 'test' | 'production',
  signInTime: Date.now(),
  tokenExpiry: Date.now() + (60 * 60 * 1000), // 1 hour
  // ... other user data
};

// Automatically saved to localStorage
AuthStorage.saveUsers([authenticatedUser]);
```

### 2. **Auto-Restore on Page Load**
```typescript
// On app initialization
const storedUsers = AuthStorage.loadUsers();
const validUsers = storedUsers.filter(u => 
  u.environment === currentEnvironment &&
  u.tokenExpiry > Date.now()
);
// Users automatically restored to player slots
```

### 3. **Token Refresh**
```typescript
// Manual refresh or auto-refresh before expiry
const success = await refreshUserToken(userId);
if (success) {
  // Token updated in both memory and localStorage
  AuthStorage.updateUserToken(userId, newToken);
}
```

### 4. **Clean Logout**
```typescript
// Individual logout
AuthStorage.removeUser(userId);
await firebaseSignOut(auth);

// Bulk logout
AuthStorage.clearAll();
```

## User Interface

### **Token Status Indicators**
- **Green**: Token is valid (>5 minutes remaining)
- **Orange + Warning Icon**: Token expires within 5 minutes
- **Refresh Button**: 
  - Blue: Normal refresh
  - Orange: Urgent refresh needed
  - Spinning: Currently refreshing

### **Persistent Storage Info**
The UI now shows:
- Token preview (first 20 characters)
- Expiry time in local timezone
- Visual warnings for expiring tokens
- Refresh/logout buttons with proper states

## localStorage Structure

```json
{
  "tambola_auth_users": [
    {
      "id": "user_uid",
      "accessToken": "eyJ...",
      "refreshToken": "1//...",
      "environment": "test",
      "signInTime": 1703123456789,
      "tokenExpiry": 1703127056789,
      "displayName": "John Doe",
      "email": "john@example.com",
      "photoURL": "https://...",
      "uid": "user_uid"
    }
  ]
}
```

## Security Considerations

### **Client-Side Storage**
- ⚠️ localStorage is client-side and accessible to JavaScript
- 🔒 Suitable for development/testing environments
- 🛡️ Production apps should consider httpOnly cookies or secure token storage

### **Token Expiry**
- ⏱️ 1-hour expiry helps limit exposure
- 🔄 Manual refresh prevents automatic token renewal without user action
- 🧹 Expired tokens are automatically filtered out on load

### **Environment Isolation**
- 🏠 Test and Production users are stored separately
- 🔄 Switching environments preserves user sessions per environment
- 🗂️ No cross-environment token contamination

## Testing the Functionality

1. **Sign in multiple users** in different slots
2. **Refresh the page** - users should be restored
3. **Switch environments** - users are saved/restored per environment  
4. **Wait near token expiry** - see orange warning indicators
5. **Refresh tokens** - verify updated expiry times
6. **Sign out** - confirm localStorage cleanup

## Development Notes

### **Files Modified**
- `src/lib/auth-storage.ts` - localStorage utility class
- `src/contexts/AuthContext.tsx` - Added token refresh functionality
- `src/components/MultiPlayerAuth.tsx` - UI updates and persistence integration
- `src/types/auth.ts` - Added tokenExpiry field

### **Key Classes**
- `AuthStorage` - Static utility class for localStorage operations
- `StoredAuthUser` - Interface for localStorage user format
- Enhanced `AuthenticatedUser` - Added expiry and refresh token fields

This implementation provides a robust, user-friendly authentication experience with persistent storage for seamless multi-player testing! 🚀 