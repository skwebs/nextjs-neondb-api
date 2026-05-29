# Credit Card Expense Tracker API

## Authentication Strategy

Our API supports a **Dual-Mode Authentication** strategy to handle both Web browsers and Mobile apps (React Native / Expo) securely.

### 1. Access Token Usage (Bearer Authentication)

For all protected routes, include the Access Token in the `Authorization` header.

**Protected Routes Include:**
- `GET /api/auth/me`
- `GET /api/cards`
- `POST /api/transactions`
- ... and all other private resources.

#### Example: Fetching Cards (Mobile / React Native)
```javascript
const response = await fetch('https://api.example.com/api/cards', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

---

### 2. Token Expiration Handling

If your access token expires, the server will return a **401 Unauthorized** response with a specific error code.

**Response Body:**
```json
{
  "success": false,
  "message": "Access token expired",
  "code": "TOKEN_EXPIRED"
}
```

When you see `code: "TOKEN_EXPIRED"`, you should trigger the **Refresh Flow**.

---

### 3. Refresh Token Flow

Use your saved `refreshToken` to obtain a new pair of tokens. This should be done automatically by your API client (e.g., using an Axios interceptor).

#### Example: Refreshing Tokens
```javascript
const response = await fetch('https://api.example.com/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refreshToken: savedRefreshToken
  })
});

const data = await response.json();

if (response.ok) {
  // Save the new tokens
  const { accessToken, refreshToken } = data;
  saveTokens(accessToken, refreshToken);
  
  // Retry the original failed request with the new accessToken
} else {
  // Refresh token is also expired or invalid -> Force logout
  logoutUser();
}
```

---

### 4. Full Authentication Lifecycle (Mobile)

1. **Login**: `POST /api/auth/login` returns `accessToken` and `refreshToken`.
2. **Store**: Save both tokens securely (e.g., Expo SecureStore).
3. **Request**: Use `accessToken` in the `Authorization: Bearer <token>` header.
4. **Expiry**: If 401 + `TOKEN_EXPIRED`, call `POST /api/auth/refresh`.
5. **Update**: Store the new tokens returned by the refresh endpoint.
6. **Retry**: Repeat the original request.
7. **Logout**: `POST /api/auth/logout` with `refreshToken` to revoke the session server-side.

---

## Web / Browser Usage

For web browsers, the API automatically sets an **httpOnly cookie** named `token` upon login or refresh.
- Browser will send this cookie automatically with every request.
- No manual `Authorization` header is required for web clients.
- Refresh logic is still available via the `/api/auth/refresh` endpoint if needed for SPA state management.
