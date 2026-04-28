# Integrating DXP UCP with ChatGPT

End-to-end guide for wiring the DXP platform's UCP (Universal Commerce
Protocol) checkout into a ChatGPT Custom GPT, so any user can shop and pay
through a real Stripe-backed flow without leaving ChatGPT.

This is a *working* demo, not a mock — every checkout creates a real Stripe
PaymentIntent in test mode, and a real Stripe-Elements card capture runs on
a hosted page deep-linked from ChatGPT.

---

## What gets built

```
                     ┌──────────────────────┐
   ChatGPT  ──────►  │  cloudflared (BFF)   │  ──────►  DXP BFF :4201
   (Custom GPT)      │  *.trycloudflare.com │           ├── /api/v1/products/search   (catalog)
                     └──────────────────────┘           ├── /api/v1/ucp/checkout-...   (UCP)
                                                        └── /.well-known/ucp           (discovery)
                                                                  │
                                                                  ▼
                          ┌──────────────────────┐         conv-assistant :8003
                          │  cloudflared (Portal)│  ◄────  pgvector products
                          │  *.trycloudflare.com │              + embeddings
                          └──────────────────────┘
                                     │
                                     ▼
                          ace-hardware-portal :4500
                          /customer/pay?session=<id>
                          (hosted Stripe Elements)
                                     │
                                     ▼
                          api.stripe.com (test mode)
```

The flow ChatGPT runs:

1. `searchProducts` — fetches real SKUs/prices from the merchant catalog
2. `createCheckoutSession` — creates a Stripe PaymentIntent
3. `updateCheckoutSession` — adds buyer + fulfillment, session goes
   `ready_for_complete`, response carries `payment_url`
4. ChatGPT shows `payment_url` to the user as a clickable link
5. User opens link → hosted Stripe Elements page → enters `4242…` → pays
6. Hosted page calls `completeCheckoutSession` automatically
7. ChatGPT polls `getCheckoutSession` → status `completed` → reports order

---

## Prerequisites

- **DXP stack running locally** (`make up` for infra, `make dev` for BFF)
- **Conv-assistant backend on `:8003`** for the ACE persona, with products
  ingested into pgvector. Start with:
  ```bash
  cd apps/conversational-assistant
  source ~/.appregistry/venvs/ai-full/bin/activate
  AGENTIC_CONFIG_ID=ace-hardware-retail \
    uvicorn src.main:app --host 0.0.0.0 --port 8003 --reload
  ```
- **ACE Hardware portal running on `:4500`** (`pnpm --filter
  @dxp/ace-hardware-portal dev`)
- **`cloudflared` installed** (`brew install cloudflared` on Mac)
- **Real Stripe test-mode keys** in `.env`:
  ```
  STRIPE_SECRET_KEY=sk_test_…
  STRIPE_PUBLISHABLE_KEY=pk_test_…
  PAYMENTS_PROVIDER=stripe
  UCP_ADAPTER=payments-backed
  ```
- **A ChatGPT Plus/Team account** (Custom GPTs require Plus or higher)

---

## Step 1 — Tunnel the BFF (port 4201)

ChatGPT runs in OpenAI's cloud and can't reach `localhost`. Cloudflared
quick tunnels give you a public HTTPS URL with zero config.

```bash
cloudflared tunnel --url http://localhost:4201
```

Copy the URL it prints — something like
`https://sparc-surname-replication-blah.trycloudflare.com`. **Keep this
terminal open** for the duration of your session; closing it kills the
tunnel.

> Quick tunnels can drop after several hours of uptime. If ChatGPT
> suddenly says "service not responding," check the tunnel's metrics
> endpoint to confirm it's still connected:
> ```bash
> # Find the cloudflared process and its metrics port
> lsof -p $(pgrep -f "cloudflared.*4201") | grep LISTEN
> # Then hit /ready on that port — readyConnections must be ≥ 1
> curl http://localhost:<metrics-port>/ready
> ```
> If `readyConnections: 0`, restart the tunnel and re-import the spec
> in ChatGPT (the URL will change).

---

## Step 2 — Tunnel the Portal (port 4500)

The hosted Stripe Elements page lives on the portal, not the BFF. ChatGPT
will surface its URL to the user, who opens it in their browser. So the
portal needs its own public URL.

```bash
cloudflared tunnel --url http://localhost:4500
```

Copy that URL too — e.g.
`https://trucks-competent-bracelets-evident.trycloudflare.com`.

### Allow the tunnel host in Vite

Vite blocks unknown Host headers by default. Already configured for ACE
Hardware in `starters/ace-hardware-portal/vite.config.ts`:

```ts
server: {
  port: 4500,
  allowedHosts: true,  // accept any host — fine for dev
  // ...
}
```

If you fork this for another portal, copy that line.

---

## Step 3 — Set the payment URL template

Tell the BFF what URL to embed in `payment_url` when sessions are created:

```bash
# .env
UCP_PAYMENT_URL_TEMPLATE=https://trucks-competent-bracelets-evident.trycloudflare.com/customer/pay?session={session_id}
```

The `{session_id}` placeholder is substituted with the live UCP session id
at runtime. **Restart the BFF** after editing `.env` (NestJS loads config
once at startup):

```bash
lsof -ti :4201 | xargs kill
pnpm --filter @dxp/bff start:dev
```

You'll see in the BFF log:

```
UCP adapter wired through PaymentsPort · hosted pay URL: https://trucks-…/customer/pay?session={session_id}
```

### Verify

```bash
curl -s -X POST http://localhost:4201/api/v1/ucp/checkout-sessions \
  -H 'Content-Type: application/json' \
  -d '{"line_items":[{"item":{"id":"X","title":"Demo","price":1000},"quantity":1}],"currency":"USD"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('payment_url:', d['payment_url'])"
```

Should print a public URL with the new session id substituted.

---

## Step 4 — Create the Custom GPT

In ChatGPT (web, not mobile):

1. **My GPTs** → **Create a GPT**
2. **Configure** tab:
   - **Name**: ACE Hardware Concierge (or your tenant)
   - **Description**: Shops the ACE Hardware catalog and processes
     real Stripe-test-mode purchases via UCP.
   - **Conversation starters**: optional — *"Find me a cordless drill"*
3. **Capabilities**: turn off Web Browsing, DALL·E, Code Interpreter.
   Leave only the action you're about to add. (Browsing-on can mask
   problems by letting the model fall back to web data.)

Save it as Private.

---

## Step 5 — Import the OpenAPI spec

In Configure → **Actions** → **Create new action** → **Import from URL**:

```
https://<your-bff-tunnel>.trycloudflare.com/api/v1/ucp/openapi.json
```

The BFF dynamically rewrites `servers[0].url` to whatever host fetched
the spec, so importing through the tunnel automatically captures the
right base URL.

You should see **7 operations** in the Available actions table:

| Operation | Method | Path |
|-----------|--------|------|
| `getUcpProfile` | GET | `/.well-known/ucp` |
| `searchProducts` | GET | `/api/v1/products/search` |
| `createCheckoutSession` | POST | `/api/v1/ucp/checkout-sessions` |
| `getCheckoutSession` | GET | `/api/v1/ucp/checkout-sessions/{id}` |
| `updateCheckoutSession` | PUT | `/api/v1/ucp/checkout-sessions/{id}` |
| `completeCheckoutSession` | POST | `/api/v1/ucp/checkout-sessions/{id}/complete` |
| `cancelCheckoutSession` | POST | `/api/v1/ucp/checkout-sessions/{id}/cancel` |

Click the **Test** button on `searchProducts` with `{ "q": "cordless drill" }`. Real ACE products should come back. If they don't, either the
catalog isn't ingested or the tunnel/BFF isn't running.

### Privacy policy URL

ChatGPT requires one before publishing. For a private GPT used only by
you, any URL works — paste your tunnel URL or `https://example.com`.
For a shared GPT, point at a real privacy doc.

---

## Step 6 — GPT Instructions (the prompt)

This is the most important step. Without explicit instructions, the model
will skip `searchProducts` and hallucinate SKUs from training data.

Paste **this exact text** into Configure → Instructions, replacing
anything that's there:

```
You are a shopping concierge for ACE Hardware. The merchant exposes a real product catalog and a UCP (Universal Commerce Protocol) checkout API. You complete real Stripe-test-mode purchases on the buyer's behalf.

# Rules

1. SEARCH FIRST — ALWAYS. Before recommending or checking out any product, call searchProducts with the user's query. Use ONLY the id, name, and price_cents fields returned. Never invent SKUs, brands, or prices. If searchProducts returns zero results, say "I don't see that in our catalog" — do NOT fall back to general knowledge or web data.

2. PRICES are in cents. price_cents is the minor unit (e.g. 9900 = $99.00). When you display to the user, divide by 100. When you call createCheckoutSession, pass price_cents AS-IS to item.price.

3. CHECKOUT FLOW:
   a. createCheckoutSession with currency: "USD" and line_items: [{ item: { id, title, price }, quantity }] using exact values from searchProducts.
   b. updateCheckoutSession with buyer: { email, first_name, last_name } and fulfillment.methods[0]: { id: "fm_1", type: "shipping", line_item_ids: ["li_1", ...] }.
   c. The response will have status: "ready_for_complete" and a payment_url. Surface payment_url to the user as a clickable markdown link: "👉 [Open this secure page to pay]({payment_url})". Tell them they'll enter their card on Stripe's hosted form.

4. NEVER call completeCheckoutSession yourself. The hosted payment page calls it automatically once the buyer's card is confirmed. Calling it with a fake token will fail.

5. AFTER PAYMENT: when the user confirms they've paid (or asks "did it go through?"), call getCheckoutSession with the session id. If status is "completed", report the order: "Your order is confirmed (id: <session.id>)." If still ready_for_complete, ask the user to finish the hosted page first.

6. If the user gives a vague request, ask one clarifying question (budget? voltage? brand?) then call searchProducts. Don't ask multiple times.
```

Save the GPT.

---

## Step 7 — End-to-end test

**Start a new chat** in your GPT (don't reuse an old conversation; ChatGPT
caches per-conversation state and contradictions linger). First test
catalog search:

> User: *Find me a cordless drill under $150*

Expected: ChatGPT calls `searchProducts`. Output mentions real SKUs from
your catalog (e.g. DeWalt 20V MAX `DW-DRL-20V` $99, Craftsman V20
`CM-DRL-V20` $79). When the **Allow / Always Allow** prompt appears for
the new domain, click **Always Allow** so it doesn't ask again.

> User: *Buy the DeWalt one*

Expected: `createCheckoutSession` then `updateCheckoutSession` (it'll ask
you for an email + shipping address first, or you can include them
upfront). Response surfaces `payment_url`:

> Open this secure page to pay: https://trucks-…/customer/pay?session=pi_…

Click the link. The portal renders a Stripe Elements card form with
order summary.

Pay with the Stripe test card:

```
Card:    4242 4242 4242 4242
Expiry:  any future date (e.g. 12/30)
CVC:     any 3 digits
ZIP:     any 5 digits
```

After Stripe confirms, the page automatically calls
`completeCheckoutSession`, you see "Payment confirmed", and the page
shows the order id.

Back in ChatGPT:

> User: *Did my order go through?*

Expected: ChatGPT calls `getCheckoutSession`, sees `status: completed`,
reports the order id. You can also verify in the
[Stripe test dashboard](https://dashboard.stripe.com/test/payments) — a
real PaymentIntent is recorded against your test account.

---

## Troubleshooting

### "Checkout system isn't responding"

The BFF tunnel is dead or your spec is pointing at a stale URL. Check
the tunnel's `/ready` endpoint:

```bash
curl http://localhost:<metrics-port>/ready
```

`readyConnections: 0` → restart the tunnel, then re-import the spec in
ChatGPT (URL changed).

### "Unrecognizable function run" / "unrecognizable response"

ChatGPT's strict response validator rejected the JSON because a field
isn't declared in the OpenAPI spec, or a field marked `required` is
missing in the response. Check the `CheckoutSession` schema in
`apps/bff/src/modules/ucp-checkout/openapi.controller.ts` matches what
the BFF actually returns.

### ChatGPT hallucinates products

The model didn't call `searchProducts`. Re-import the spec to make sure
the operation is present, then re-paste the Instructions block above
(especially rule 1 — "SEARCH FIRST"). Start a fresh chat. Then watch the
BFF tunnel metrics:

```bash
curl http://localhost:<metrics-port>/metrics | grep response_by_code
```

The counters should increment when ChatGPT calls. Zero increment = the
model isn't actually calling the action.

### "Description has length X exceeding limit of 300"

ChatGPT caps operation `description` fields at 300 chars. If you edit
`openapi.controller.ts` and add longer text, the import will fail with
this error. Trim under 300.

### Hosted-pay page shows "Blocked request"

Vite's `server.allowedHosts` setting doesn't include the cloudflared
host. Either set `allowedHosts: true` (dev only), or whitelist the
specific subdomain.

### "Session not found" on the hosted-pay page

The session was completed already, or it's expired (mock adapter holds
in-memory only). Always test with a fresh session id from a recent
`createCheckoutSession`.

### Stripe says "declined"

Stripe rejects fake `payment_token` strings. The agent must never call
`completeCheckoutSession` itself with an invented token — only the
hosted page (which has a real Stripe-confirmed PaymentIntent id) is
allowed to. If your GPT is calling complete directly, fix the
Instructions.

---

## Architecture notes

### Why two tunnels?

The BFF and the portal serve different concerns and run on different
ports. Tunneling both gives you:
- **One URL ChatGPT calls** (the BFF tunnel, for all 7 operations)
- **One URL ChatGPT shows the user** (the portal tunnel, for the hosted
  pay page)

In production you wouldn't use cloudflared at all — both surfaces would
sit behind your normal CDN/load balancer.

### Why search lives outside UCP

UCP is the *commerce protocol* — discovery, sessions, payment. Product
discovery is a separate concern. Putting `/api/v1/products/search`
under a `catalog` tag (not under the UCP path) makes that boundary
explicit. Other UCP-aware agents could plug in any catalog they like.

The BFF's products module proxies to the conv-assistant's existing
pgvector search — same backend the embedded chat uses. **One source of
truth**: ChatGPT and the in-portal chat see identical results.

### Why no `category` filter

The catalog search uses OpenAI embeddings via pgvector, which already
captures semantic relevance. Exposing an exact-match `category` filter
to external agents punishes them when their taxonomy ("Power Tools")
differs from yours ("tools"). Skipping it keeps the surface forgiving.

### Why payment isn't an action

Card capture has to happen in a browser context (Stripe Elements iframe).
ChatGPT can't render iframes, so payment is a *URL* in the
`createCheckoutSession`/`updateCheckoutSession` response, not its own
action. The hosted page calls `completeCheckoutSession` once Stripe
confirms — that closes the loop without ChatGPT needing to handle
sensitive PCI data.

### Per-tenant configuration

Everything that varies per tenant lives in env vars or persona JSON:

| Knob | Where | Default |
|------|-------|---------|
| Hosted-pay URL template | `UCP_PAYMENT_URL_TEMPLATE` env | none (no `payment_url` returned) |
| Catalog backend URL | `PRODUCTS_BACKEND_URL` env | `http://localhost:8003` |
| Payment processor | `PAYMENTS_PROVIDER` env | `stripe` |
| UCP adapter | `UCP_ADAPTER` env | `payments-backed` |
| Inline-checkout copy | `data.checkout` in persona JSON | none (no inline form) |

Adding a new tenant is config-only. No code changes.

---

## Related docs

- [agentic-commerce.md](./agentic-commerce.md) — adding the embedded
  conv-assistant to any portal
- [ucp.dev](https://ucp.dev) — the UCP open standard
- Live OpenAPI spec — `https://<bff>/api/v1/ucp/openapi.json`
- Live discovery doc — `https://<bff>/.well-known/ucp`
