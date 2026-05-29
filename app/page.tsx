import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Image
              className="dark:invert h-auto"
              src="/next.svg"
              alt="Next.js logo"
              width={100}
              height={20}
              priority
            />
            <span className="text-xl font-bold tracking-tight">API Documentation</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/api/health"
              className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            >
              System Status: OK
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="mb-16">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            API Reference
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Welcome to the Finance API documentation. Use these endpoints to manage authentication, 
            credit cards, and transactions with ease.
          </p>
        </section>

        {/* Security & Auth Section */}
        <section className="mb-16 rounded-2xl border border-zinc-200 bg-zinc-100/50 p-8 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="mb-4 text-2xl font-bold">Security & Authentication</h2>
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <p>Our API uses a <strong>Dual-Mode Authentication</strong> strategy to support both web and mobile environments safely:</p>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-emerald-600">Web Strategy</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Uses <code>httpOnly</code> cookies for automatic session management. No manual token handling required in the browser.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-600">Mobile Strategy</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Uses standard <code>Authorization: Bearer &lt;token&gt;</code> headers. Tokens are returned in the login/refresh response bodies for storage in <code>SecureStore</code>.</p>
              </div>
            </div>
            <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <p className="text-sm text-zinc-500"><strong>Access Token:</strong> Short-lived (1 hour). JWT format. Used for all protected requests.</p>
              <p className="text-sm text-zinc-500"><strong>Refresh Token:</strong> Long-lived (30 days). UUID format, stored in DB for secure revocation and app-restart login restoration.</p>
            </div>
          </div>
        </section>

        {/* Error Glossary */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-200">Standard Error Codes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ErrorCard code="400" label="Bad Request" desc="Invalid JSON, missing required fields, or schema validation failure." />
            <ErrorCard code="401" label="Unauthorized" desc="Missing or invalid token/cookie. Session may have expired." />
            <ErrorCard code="403" label="Forbidden" desc="Authenticated but lacks permission (e.g., modifying a locked billing cycle)." />
            <ErrorCard code="404" label="Not Found" desc="The requested resource (User, Card, Transaction) does not exist." />
            <ErrorCard code="409" label="Conflict" desc="Resource already exists (e.g., email already registered)." />
            <ErrorCard code="500" label="Server Error" desc="Internal system failure. Raw details are masked for security." />
          </div>
        </section>

        {/* Auth Section */}
        <section className="mb-16">
          <h2 className="mb-8 border-b border-zinc-200 pb-2 text-2xl font-bold dark:border-zinc-800">
            Authentication
          </h2>
          <div className="space-y-12">
            <Endpoint
              method="POST"
              path="/api/auth/register"
              description="Create a new user account."
              errors={[
                { status: 400, msg: "Invalid email/password format" },
                { status: 409, msg: "Email already registered" }
              ]}
              request={`{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}`}
              response={`{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com"
  }
}`}
            />
            <Endpoint
              method="POST"
              path="/api/auth/login"
              description="Authenticate and receive tokens. Sets an httpOnly cookie and returns tokens in the body for mobile apps."
              errors={[
                { status: 401, msg: "Invalid credentials" }
              ]}
              request={`{
  "email": "user@example.com",
  "password": "securepassword123"
}`}
              response={`{
  "message": "Login successful",
  "accessToken": "jwt-token-string",
  "refreshToken": "random-uuid-string",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe"
  }
}`}
            />
            <Endpoint
              method="POST"
              path="/api/auth/refresh"
              description="Rotate an expired access token using a refresh token."
              errors={[
                { status: 400, msg: "Refresh token required" },
                { status: 401, msg: "Invalid or expired refresh token" }
              ]}
              request={`{
  "refreshToken": "your-saved-refresh-token"
}`}
              response={`{
    "accessToken": "new-jwt-token",
    "refreshToken": "new-refresh-token"
}`}
            />
            <Endpoint
              method="POST"
              path="/api/auth/logout"
              description="Clear session and revoke refresh token."
              errors={[
                { status: 500, msg: "Logout failed" }
              ]}
              request={`{
  "refreshToken": "token-to-revoke (optional)"
}`}
              response={`{
  "message": "Logged out successfully"
}`}
            />
            <Endpoint
              method="GET"
              path="/api/auth/me"
              description="Get current authenticated user info. Supports Authorization header or cookies."
              errors={[
                { status: 401, msg: "Unauthorized" },
                { status: 404, msg: "User not found" }
              ]}
              response={`{
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "John Doe"
  }
}`}
            />
          </div>
        </section>

        {/* Cards Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
            <h2 className="text-2xl font-bold">Credit Cards</h2>
            <div className="group relative">
              <span className="cursor-help text-xs font-medium text-zinc-400 underline decoration-dotted">Domain Glossary</span>
              <div className="absolute right-0 top-6 hidden w-64 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl group-hover:block dark:border-zinc-700 dark:bg-zinc-800 z-20">
                <p className="mb-2 text-xs"><strong>statementDay:</strong> The day of month (1-31) when the billing cycle ends.</p>
                <p className="text-xs"><strong>dueDayOffset:</strong> Number of days after the statement day until payment is due (Grace Period).</p>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-12">
            <Endpoint
              method="GET"
              path="/api/cards"
              description="List all credit cards for the current user."
              errors={[
                { status: 401, msg: "Unauthorized" }
              ]}
              response={`{
  "cards": [
    {
      "id": "uuid-v4",
      "name": "Main Credit Card",
      "last4Digits": "1234",
      "statementDay": 5,
      "dueDayOffset": 15
    }
  ]
}`}
            />
            <Endpoint
              method="POST"
              path="/api/cards"
              description="Add a new credit card."
              errors={[
                { status: 400, msg: "Validation failed (invalid day range, etc.)" },
                { status: 401, msg: "Unauthorized" }
              ]}
              request={`{
  "name": "Rewards Card",
  "last4Digits": "9876",
  "statementDay": 10,
  "dueDayOffset": 20
}`}
              response={`{
  "card": {
    "id": "uuid-v4",
    "name": "Rewards Card",
    "last4Digits": "9876",
    "statementDay": 10,
    "dueDayOffset": 20,
    "userId": "user-uuid"
  }
}`}
            />
            <Endpoint
              method="PATCH"
              path="/api/cards/[id]"
              description="Update an existing credit card."
              errors={[
                { status: 404, msg: "Card not found or unauthorized" }
              ]}
              request={`{
  "name": "Updated Rewards Card"
}`}
              response={`{
  "card": {
    "id": "card-id",
    "name": "Updated Rewards Card",
    ...
  }
}`}
            />
            <Endpoint
              method="DELETE"
              path="/api/cards/[id]"
              description="Remove a credit card."
              errors={[
                { status: 404, msg: "Card not found or unauthorized" }
              ]}
              response={`{
  "message": "Card deleted successfully"
}`}
            />
          </div>
        </section>

        {/* Transactions Section */}
        <section className="mb-16">
          <h2 className="mb-8 border-b border-zinc-200 pb-2 text-2xl font-bold dark:border-zinc-800">
            Transactions
          </h2>
          <div className="space-y-12">
            <Endpoint
              method="GET"
              path="/api/transactions"
              description="Fetch transactions with filtering and pagination."
              errors={[
                { status: 401, msg: "Unauthorized" }
              ]}
              params={[
                { name: "cardId", desc: "Filter by card ID" },
                { name: "month", desc: "Filter by month (1-12)" },
                { name: "year", desc: "Filter by year" },
                { name: "page", desc: "Page number (default: 1)" }
              ]}
              response={`{
  "transactions": [
    {
      "id": "uuid-v4",
      "description": "Grocery Store",
      "amount": "85.50",
      "transactionDatetime": "2026-05-28T14:30:00Z"
    }
  ],
  "page": 1,
  "limit": 50
}`}
            />
            <Endpoint
              method="POST"
              path="/api/transactions"
              description="Record a new transaction. Amount must be a positive decimal string."
              errors={[
                { status: 400, msg: "Validation failed (negative amount, invalid format)" },
                { status: 403, msg: "Cannot add to a locked/closed billing cycle" }
              ]}
              request={`{
  "cardId": "uuid-v4",
  "description": "Coffee Shop",
  "amount": "4.50",
  "transactionDatetime": "2026-05-29T09:00:00Z",
  "settlementDate": "2026-05-30T10:00:00Z" (optional)
}`}
              response={`{
  "transaction": {
    "id": "uuid-v4",
    "description": "Coffee Shop",
    "amount": "4.50",
    ...
  }
}`}
            />
            <Endpoint
              method="PATCH"
              path="/api/transactions/[id]"
              description="Update a transaction. Triggers billing cycle recalculation if dates change."
              errors={[
                { status: 403, msg: "Cannot update transaction in a closed cycle" },
                { status: 404, msg: "Transaction not found" }
              ]}
              request={`{
  "description": "Updated Coffee Shop",
  "amount": "5.00"
}`}
              response={`{
  "transaction": {
    "id": "uuid-v4",
    "description": "Updated Coffee Shop",
    "amount": "5.00",
    ...
  }
}`}
            />
            <Endpoint
              method="DELETE"
              path="/api/transactions/[id]"
              description="Permanently remove a transaction."
              errors={[
                { status: 403, msg: "Cannot delete from a closed cycle" },
                { status: 404, msg: "Transaction not found" }
              ]}
              response={`{
  "message": "Transaction deleted successfully"
}`}
            />
          </div>
        </section>

        <footer className="mt-20 flex flex-col items-center justify-between border-t border-zinc-200 py-10 dark:border-zinc-800 sm:flex-row">
          <p className="text-sm text-zinc-500">
            &copy; 2026 Finance API. All rights reserved.
          </p>
          <div className="mt-4 flex gap-6 sm:mt-0">
            <Image
              className="dark:invert h-auto opacity-50 transition-opacity hover:opacity-100"
              src="/vercel.svg"
              alt="Vercel logo"
              width={80}
              height={18}
            />
          </div>
        </footer>
      </main>
    </div>
  );
}

function Endpoint({ 
  method, 
  path, 
  description, 
  request, 
  response, 
  params,
  errors
}: { 
  method: string; 
  path: string; 
  description: string; 
  request?: string; 
  response: string;
  params?: { name: string; desc: string }[];
  errors?: { status: number; msg: string }[];
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-blue-500",
    POST: "bg-emerald-500",
    PATCH: "bg-amber-500",
    DELETE: "bg-rose-500",
  };

  return (
    <div className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className={`rounded px-2 py-0.5 text-xs font-bold text-white ${methodColors[method] || "bg-zinc-500"}`}>
          {method}
        </span>
        <code className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{path}</code>
      </div>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">{description}</p>

      {errors && (
        <div className="mb-6">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500/80">Possible Errors</h4>
          <div className="flex flex-wrap gap-2">
            {errors.map(err => (
              <span key={err.status} className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                <strong>{err.status}</strong> {err.msg}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {params && (
        <div className="mb-6">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Query Parameters</h4>
          <div className="grid gap-2 text-sm">
            {params.map(p => (
              <div key={p.name} className="flex gap-2">
                <code className="text-emerald-600 dark:text-emerald-400 font-bold">{p.name}</code>
                <span className="text-zinc-500">— {p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {request && (
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Request Body</h4>
            <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs text-zinc-300">
              <code>{request}</code>
            </pre>
          </div>
        )}
        <div className={request ? "" : "md:col-span-2"}>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Response Example</h4>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs text-zinc-300">
            <code>{response}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function ErrorCard({ code, label, desc }: { code: string; label: string; desc: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-bold text-rose-600">{code}</span>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{desc}</p>
    </div>
  );
}
