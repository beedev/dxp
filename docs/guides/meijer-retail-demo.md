# Meijer Retail Demo

A Meijer-flavored counterpart to the ACE Hardware demo, proving the
"swap the data, keep the platform" thesis. Same UCP backend, same
agentic-commerce loop — entirely different vertical (grocery + general
merchandise + party planning instead of DIY/hardware).

This guide assumes you've read [`ucp-chatgpt-integration.md`](./ucp-chatgpt-integration.md)
already. Most of the setup is identical; this doc covers what's
*different* about the Meijer flavor and how to switch between the two
tenants.

---

## Quick start

Both demos share the BFF on `:4201`. Each tenant gets its own portal
and its own conv-assistant. Bring up the Meijer flavor:

```bash
make demo-ucp TENANT=meijer
```

Output ends with a banner like:

```
✅ UCP demo ready · TENANT=meijer

   BFF tunnel    : https://<random>.trycloudflare.com
   Portal tunnel : https://<random>.trycloudflare.com

   Local URLs:
     Portal           : http://localhost:4501/customer
     AI Assistant     : http://localhost:4501/customer/ai-assistant
     Conv-assistant   : http://localhost:8005/health
     BFF OpenAPI      : http://localhost:4201/api/v1/ucp/openapi.json

   Then in a fresh chat, ask: "Plan a birthday party for 10 kids with healthy snacks"

   Stop : make demo-ucp-stop
   Swap : make demo-ucp TENANT=ace
```

To swap back to ACE Hardware: `make demo-ucp TENANT=ace`. The script
shuts the previous tenant's portal + conv-assistant down cleanly,
re-ingests the catalog, and brings the other tenant up.

---

## What's different from ACE

| | ACE Hardware | Meijer Retail |
|---|---|---|
| Portal package | `@dxp/ace-hardware-portal` | `@dxp/meijer-retail-portal` |
| Portal port | `:4500` | `:4501` |
| Conv-assistant port | `:8003` | `:8005` *(8004 reserved by Docker on dev)* |
| Persona id | `ace-hardware-retail` | `meijer-retail` |
| Persona JSON | `apps/conversational-assistant/configs/ace-hardware.json` | `apps/conversational-assistant/configs/meijer-retail.json` |
| Brand palette | Red `#D50032` (signature ACE red) | Red `#E5202E` + Navy `#1B365D` + Mustard `#F0A91B` |
| Loyalty | "ACE Rewards" | "mPerks" |
| Domain | DIY / tools / paint | Grocery / party planning / general merchandise |
| 3rd persona | "Cooperative" (network of co-op stores) | "Corporate" (Meijer is family-owned, regional) |
| In-portal planner | "Project Planner" — deck, fence, paint | "Party Planner" — birthday, BBQ, Thanksgiving |
| Catalog source | `/tmp/ace_products.json` (~50 SKUs) | `/tmp/meijer_products.json` (152 SKUs, source-controlled at `apps/conversational-assistant/data/meijer_products.json`) |

What stays identical:

- **BFF**: the entire `apps/bff/` is unchanged. Same UCP module, same
  Stripe adapter, same Products proxy, same OpenAPI spec controller.
- **`@dxp/contracts`**: no changes. The UCP shapes are vertical-agnostic.
- **`@dxp/sdk-react`**: no changes. `<UcpPaymentPage>` works for both
  retailers from a single backend.
- **`@dxp/ai-assistant`**: no changes. The chat surface (including the
  inline Stripe Elements card) is data-driven via persona `data.checkout`.
- **`@dxp/ui`**: no changes. Brand palette swaps via per-portal
  `tailwind.config.js` only.
- **Stripe + UCP plumbing**: unchanged.

This is the "platform thesis" in one paragraph: customers carry their
own data and persona JSON. The platform is a constant.

---

## The 5 party / meal playbooks

Defined in `meijer-retail.json` → `project_playbooks`. Each maps to a
`projectTemplates` row in `starters/meijer-retail-portal/src/data/mock-projects.ts`,
so the in-portal Party Planner UI and the chat assistant produce the
same shopping list.

| Playbook | Trigger keywords | Estimated cost |
|---|---|---|
| Kids Birthday Party (10 kids, healthy) | birthday party, kids party, kid's birthday | ~$110 |
| Game-Day BBQ (10 adults) | BBQ, barbecue, tailgate, football party, game day | ~$175 |
| Thanksgiving Dinner (8 guests) | thanksgiving, holiday dinner, turkey dinner | ~$145 |
| Weekly Groceries (Family of 4) | weekly groceries, fill the fridge, stock up | ~$175 |
| Back-to-School Lunches (5 days × 2 kids) | school lunch, kids lunches, back to school | ~$65 |

The persona's `clarifying_question_examples` block ensures the LLM
asks 1-2 audience-appropriate questions before searching — so for a
kids party it'll ask about ages and allergies, for BBQ it'll ask
about beef-vs-chicken split, for Thanksgiving about scratch-cooking
vs prepared sides.

---

## Demo users

Three demo profiles with realistic shopping personas:

| User | Profile | Preferences |
|---|---|---|
| **Sarah** (Family of 4) | Health-leaning weekly grocery shopper. Spend limit $400. | Prefers True Goodness organic, avoids high-sugar snacks |
| **Mike** (Game-Day Host) | Hosts adult parties; price-sensitive on bulk. Spend limit $250. | Prefers Bud Light, Doritos, value packs |
| **Priya** (Birthday Party Planner) | Allergy-conscious; pickier on quality. Spend limit $200. | Avoids tree-nuts and peanuts, prefers Annie's, Honest Kids, kid-friendly |

The chat hooks user preferences into product ranking automatically.
With Priya selected, asking "plan a birthday party" results in the
LLM acknowledging her allergy preferences in its first reply (you'll
see something like *"besides tree-nuts and peanuts, any other
allergies?"*). That's the persona's tone rule + Priya's
`UserPreference` rows from the Meijer ingest doing their job.

---

## ChatGPT setup

Identical to the ACE flow — see the parent guide. The only change for
Meijer is the **GPT Instructions** field: replace "ACE Hardware" with
"Meijer", swap the example product (e.g. *"DeWalt drill at $99"* →
*"True Goodness organic fruit snacks at $3.99"*), and update the
domain phrasing.

Suggested Meijer Instructions block:

```
You are a shopping concierge for Meijer. The merchant exposes a real product catalog (groceries + general merchandise + party supplies) and a UCP (Universal Commerce Protocol) checkout API. You complete real Stripe-test-mode purchases on the buyer's behalf.

# Rules

1. SEARCH FIRST — ALWAYS. Before recommending or checking out any product, call searchProducts with the user's query. Use ONLY the id, name, and price_cents fields returned. Never invent SKUs, brands, or prices. If searchProducts returns zero results, say "I don't see that in our catalog" — do NOT fall back to general knowledge or web data.

2. PRICES are in cents. price_cents is the minor unit (e.g. 399 = $3.99). When you display to the user, divide by 100. When you call createCheckoutSession, pass price_cents AS-IS to item.price.

3. PARTY / MEAL PLANNING: For requests like "birthday party for 10 kids", "BBQ for 10 adults", or "Thanksgiving dinner for 8", ask 1-2 clarifying questions about headcount and dietary restrictions BEFORE searching. Then run multiple searchProducts calls (one per category — protein, sides, snacks, beverages, party supplies) and assemble the cart.

4. CHECKOUT FLOW:
   a. createCheckoutSession with currency: "USD" and line_items: [{ item: { id, title, price }, quantity }] using exact values from searchProducts.
   b. updateCheckoutSession with buyer: { email, first_name, last_name } and fulfillment.methods[0]: { id: "fm_1", type: "shipping", line_item_ids: ["li_1", ...] }.
   c. The response will have status: "ready_for_complete" and a payment_url. Surface payment_url as a clickable markdown link: "👉 [Open this secure page to pay]({payment_url})".

5. NEVER call completeCheckoutSession yourself. The hosted page does that automatically.

6. AFTER PAYMENT: when the user confirms they've paid, call getCheckoutSession with the session id. If status is "completed", report the order: "Your order is confirmed (id: <session.id>)."
```

---

## How the swap actually works under the hood

When you run `make demo-ucp TENANT=meijer`:

1. **Cleanup** — kills the other tenant's portal (`:4500`), conv-assistant
   (`:8003`), and their cloudflared tunnels. Leaves the BFF cloudflared
   alive (it's shared).
2. **Tunnels** — starts a cloudflared quick tunnel for `:4201` (BFF) and
   `:4501` (Meijer portal). Captures both URLs from the cloudflared logs.
3. **`.env` patch** — `sed`s `UCP_PAYMENT_URL_TEMPLATE` to embed the new
   portal tunnel URL, and `PRODUCTS_BACKEND_URL` to point at `:8005` so
   the BFF Products proxy hits the Meijer conv-assistant.
4. **Re-ingest** — runs `python -m src.db.ingest meijer-retail`. This
   replaces the `entities` table contents with the Meijer catalog (152
   products) + their OpenAI embeddings. ~30 seconds, dominated by
   embedding generation.
5. **Services** — boots BFF (`:4201`), conv-assistant (`:8005` with
   `AGENTIC_CONFIG_ID=meijer-retail`), portal (`:4501`).
6. **Verify** — probes the catalog through the BFF tunnel; should
   return a Meijer SKU.
7. **Banner** — prints both tunnel URLs, the OpenAPI URL for ChatGPT,
   and the swap command for the other tenant.

Single-tenant DB note: the `entities` table holds one tenant's catalog
at a time. Switching tenants requires a re-ingest (~30s). That's a
known limitation of the current setup. A multi-tenant column on
`entities` would let both run simultaneously — future work.

---

## Verifying the swap works

Quick CLI smoke after `make demo-ucp TENANT=meijer`:

```bash
# Catalog: Meijer products surface
curl -s "http://localhost:4201/api/v1/products/search?q=cordless+drill" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); [print(p['name']) for p in d['products'][:3]]"
# Expect: Charcoal Lighter Fluid, Bag of Ice, Kingsford Charcoal — items
# vector-similar to grilling, NOT cordless drills (because Meijer doesn't
# carry power tools)

curl -s "http://localhost:4201/api/v1/products/search?q=birthday+party+for+kids" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); [print(p['name']) for p in d['products'][:5]]"
# Expect: Honest Kids juice, organic fruit snacks, applesauce cups, OJ,
# birthday cupcakes — kid party items
```

Then visit `http://localhost:4501/customer/ai-assistant`, pick Priya,
click *"Plan a birthday party for 10 kids with healthy snacks"*, and
watch the LLM ask about allergies (knowing she's already nut-free
from her preferences) then assemble a Meijer-real shopping list.

---

## Related docs

- [`ucp-chatgpt-integration.md`](./ucp-chatgpt-integration.md) — base
  ChatGPT integration walkthrough (use as the canonical reference)
- [`agentic-commerce.md`](../agentic-commerce.md) — adding the embedded
  conv-assistant chat to any portal
