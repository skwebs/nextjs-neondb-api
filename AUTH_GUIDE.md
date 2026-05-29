# Security & Authentication

Our API uses a **Dual-Mode Authentication** strategy to support both **web browsers** and **mobile apps (React Native / Expo)** safely.

### Web Strategy

Uses **httpOnly cookies** for automatic session management.

No manual token handling is required in browsers.

After login:

* secure cookie is automatically set
* browser automatically sends cookie in future requests
* refresh is handled server-side

---

### Mobile Strategy (React Native / Expo)

Mobile apps use:

```http
Authorization: Bearer <accessToken>
```

Tokens are returned in the login/refresh response body and should be stored securely.

Recommended storage:

* Access Token → secure storage or memory
* Refresh Token → secure storage only

Recommended secure storage:

* Expo SecureStore
* Encrypted storage solution

---

### Access Token

**Type:** JWT
**Expiry:** 1 hour

Purpose:

Used for **all protected API requests**.

Protected routes include:

```txt
GET /api/auth/me
GET /api/cards
POST /api/cards
PATCH /api/cards/:id
DELETE /api/cards/:id
GET /api/transactions
POST /api/transactions
PATCH /api/transactions/:id
DELETE /api/transactions/:id
```

### Example Protected Request

```http
GET /api/cards
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

### JavaScript / React Native Example

```ts
const response = await fetch(
  `${API_URL}/api/cards`,
  {
    method: 'GET',
    headers: {
      Authorization:
        `Bearer ${accessToken}`,
      'Content-Type':
        'application/json',
    },
  }
)

const data =
  await response.json()
```

---

### Refresh Token

**Type:** UUID
**Expiry:** 30 days

Purpose:

Used only for:

1. **Access token refresh**
2. **App restart login restoration**
3. **Logout / token revocation**

Refresh tokens are stored in the database and can be revoked for security.

---

## Login Flow

### Step 1 — Login

Request:

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response:

```json
{
  "message": "Login successful",
  "accessToken": "jwt-token-string",
  "refreshToken": "uuid-refresh-token",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

Save:

```txt
access_token
refresh_token
```

securely on device.

---

## Access Token Usage

For protected requests:

```http
GET /api/cards
Authorization: Bearer <accessToken>
```

Example:

```http
GET /api/transactions
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

Do **NOT** send refresh token here.

---

## Access Token Expired Flow

If the access token expires:

Protected request:

```http
GET /api/cards
Authorization: Bearer expired-token
```

Response:

HTTP 401

```json
{
  "success": false,
  "message": "Access token expired",
  "code": "TOKEN_EXPIRED"
}
```

Now call refresh endpoint.

---

## Refresh Token Usage

Request:

```http
POST /api/auth/refresh
Content-Type: application/json
```

Body:

```json
{
  "refreshToken":
    "saved-refresh-token"
}
```

Response:

```json
{
  "accessToken":
    "new-jwt-token",
  "refreshToken":
    "new-refresh-token"
}
```

Save new tokens and retry the failed request.

### React Native Example

```ts
const response = await fetch(
  `${API_URL}/api/auth/refresh`,
  {
    method: 'POST',
    headers: {
      'Content-Type':
        'application/json',
    },
    body: JSON.stringify({
      refreshToken,
    }),
  }
)

const data =
  await response.json()

if (response.ok) {
  saveAccessToken(
    data.accessToken
  )

  saveRefreshToken(
    data.refreshToken
  )
}
```

---

## App Restart Login Restoration

When app opens:

### Step 1

Read saved `refreshToken`.

### Step 2

Call:

```http
POST /api/auth/refresh
```

### Step 3

Save returned access token.

### Step 4

Call:

```http
GET /api/auth/me
Authorization:
Bearer <accessToken>
```

If successful:

→ restore user session

If failed:

→ redirect to login

---

## Logout Flow

Request:

```http
POST /api/auth/logout
```

Body:

```json
{
  "refreshToken":
    "saved-refresh-token"
}
```

Server:

* revokes refresh token
* clears session cookie (web)

App should:

* delete saved tokens
* redirect to login screen

---

## Authentication Rules

✅ Access Token → Protected API requests

✅ Refresh Token → Refresh & Logout only

❌ Never send both tokens in normal requests

❌ Never store tokens in plain local storage

❌ Never expose refresh token in logs
