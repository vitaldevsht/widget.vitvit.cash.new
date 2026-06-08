# POST `/api/partner/log-user`

Logs a partner-initiated user session and returns a deposit URL the partner can redirect their user to.

The endpoint accepts parameters via **HTTP headers** *or* a **JSON body**. Headers take precedence over body fields.

---

## Request

### Method
`POST`

### Headers
| Header | Type | Required | Description |
|---|---|---|---|
| `Content-Type` | string | only if sending a body | Must be `application/json` if a body is provided |
| `vitvit_user_id` | string | yes¹ | VitVit user UUID |
| `deposit_address` | string | yes¹ | External wallet address the user will deposit to |
| `init_op` | string | yes¹ | Initial operation identifier |
| `amount` | number (string) | yes¹ | Positive numeric amount |
| `partner_id` | string | no | Partner identifier |
| `partner_fee` | number (string) | no | Non-negative fee (if provided) |
| `partner_address` | string | no | Partner wallet address |

¹ Required either as a header or as a field in the JSON body.

### Body (alternative to headers)
```json
{
  "vitvit_user_id": "uuid",
  "deposit_address": "0x...",
  "init_op": "deposit",
  "amount": 100,
  "partner_id": "partner_abc",
  "partner_fee": 1.5,
  "partner_address": "0x..."
}
```

### Example
```bash
curl -X POST https://widget.vitvit.cash/api/partner/log-user \
  -H "Content-Type: application/json" \
  -H "vitvit_user_id: 11111111-2222-3333-4444-555555555555" \
  -H "deposit_address: 0xabc..." \
  -H "init_op: deposit" \
  -H "amount: 250" \
  -H "partner_id: acme" \
  -H "partner_fee: 1.5" \
  -H "partner_address: 0xdef..."
```

---

## Response

### 200 OK
```json
{
  "ok": 1,
  "url_deposit": "https://widget.vitvit.cash/partner/deposit?clientId=...&phone=...&partner_id=...&external_address=...&amount=250&partner_fee=1.5&partner_address=..."
}
```

Redirect the user to `url_deposit` to complete the deposit flow.

---

## Error responses

All errors share the shape:
```json
{
  "error": "<human message>",
  "code": "<MACHINE_CODE>",
  "details": "<optional>",
  "required": ["<optional, only on 400 MISSING_PARAMETERS>"]
}
```

| Status | `code` | Cause |
|---|---|---|
| `400` | `INVALID_JSON` | Body present but not parseable as JSON |
| `400` | `MISSING_PARAMETERS` | One or more of `vitvit_user_id`, `deposit_address`, `init_op`, `amount` missing. The `required` field lists the missing names |
| `404` | `USER_NOT_FOUND` | No row in `users` with the given `vitvit_user_id` |
| `405` | `METHOD_NOT_ALLOWED` | Method other than `POST` (e.g. `GET`) |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Body sent without `Content-Type: application/json` |
| `422` | `INVALID_AMOUNT` | `amount` is non-numeric or ≤ 0 |
| `422` | `INVALID_PARTNER_FEE` | `partner_fee` is non-numeric or negative |
| `500` | `INTERNAL_ERROR` | Unhandled server error |
| `502` | `DB_ERROR` | Supabase query failed for a reason other than "no rows" |

### Example error
```json
{
  "error": "Missing required parameters",
  "code": "MISSING_PARAMETERS",
  "required": ["amount", "init_op"]
}
```

---

## Behavior notes

- Lookup is `users.id = vitvit_user_id` (exact match, single row).
- `amount` is coerced via `Number(...)` — strings like `"250"` are accepted.
- The returned `url_deposit` is built with `URLSearchParams`, so missing optional fields render as empty strings (not the literal `"undefined"`).
- The base URL of `url_deposit` is derived from `request.nextUrl.origin`, so it always matches the host the request came in on.
