# POST `/api/partner/log-user`

Generates a partner-scoped redirect URL for a Vitvit user to either **deposit** or **withdraw** funds. The endpoint looks up the user via the upstream service, builds a signed URL pointing at the appropriate widget flow (`/partner/deposit` or `/partner/withdraw`), and returns it.

---

## Endpoint

```
POST https://widget-vitvit-cash-new.vercel.app/api/partner/log-user
```

Only `POST` is supported. `GET` returns `405 METHOD_NOT_ALLOWED`.

---

## Request

Parameters can be supplied either as **HTTP headers** or as fields in a **JSON body**. Header values take precedence over body values when both are present.

If a JSON body is sent, `Content-Type: application/json` is required (`415 UNSUPPORTED_MEDIA_TYPE` otherwise). An empty body is allowed.

### Parameters

| Name              | Required                        | Type   | Description                                                                          |
| ----------------- | ------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| `partner_id`      | yes                             | string | UUID of the partner initiating the flow.                                             |
| `vitvit_user_id`  | yes                             | string | UUID of the Vitvit end user.                                                         |
| `init_op`         | yes                             | string | Operation to initialize. Use `deposit` or `withdraw`.                                |
| `amount`          | yes                             | number | Operation amount. Must be a positive finite number.                                  |
| `partner_fee`     | no                              | number | Partner-applied fee. Must be a non-negative number when provided.                    |
| `deposit_address` | required for `init_op=deposit`  | string | External destination address used for the deposit redirect.                          |
| `account_number`  | required for `init_op=withdraw` | string | Beneficiary account number appended to the withdraw URL.                             |

> **Note:** `deposit_address` is not strictly validated server-side today, but the deposit URL will contain `external_address=undefined` if omitted.

---

## Responses

### 200 OK — deposit

```json
{
  "ok": 1,
  "url_deposit": "https://widget-vitvit-cash-new.vercel.app/partner/deposit?clientId=...&phone=...&account_name=...&partner_id=...&external_address=...&amount=...&partner_fee=..."
}
```

### 200 OK — withdraw

```json
{
  "ok": 1,
  "url_withdraw": "https://widget-vitvit-cash-new.vercel.app/partner/withdraw?clientId=...&phone=...&account_name=...&partner_id=...&external_address=...&amount=...&partner_fee=...&withdraw_fee=...&account_number=..."
}
```

The result key is dynamic: `url_<init_op>`.

### Error responses

| HTTP | `code`                   | When                                                       |
| ---- | ------------------------ | ---------------------------------------------------------- |
| 400  | `MISSING_PARAMETERS`     | One of `partner_id`, `vitvit_user_id`, `init_op`, `amount` is missing. The `required` array lists missing names. |
| 400  | `INVALID_JSON`           | JSON body is malformed.                                    |
| 415  | `UNSUPPORTED_MEDIA_TYPE` | Body sent without `Content-Type: application/json`.        |
| 422  | `INVALID_AMOUNT`         | `amount` is not a positive finite number.                  |
| 422  | `INVALID_PARTNER_FEE`    | `partner_fee` is not a non-negative finite number.         |
| 4xx/5xx | _(upstream)_          | Upstream user lookup failed. Body: `{ error, details }`.   |
| 500  | `INTERNAL_ERROR`         | Unhandled server-side error.                               |
| 405  | `METHOD_NOT_ALLOWED`     | Any HTTP method other than `POST`.                         |

Error response shape:

```json
{
  "error": "Missing required parameters",
  "code": "MISSING_PARAMETERS",
  "required": ["amount"]
}
```

---

## Behavior

1. Validates required parameters and numeric fields.
2. Fetches the Vitvit user via `GET {NEXT_PUBLIC_BASEURL}/users/id/{vitvit_user_id}/key-value` using the `PARTNER_SECRET` bearer token.
3. Builds a redirect URL on the same origin pointing at `/partner/{init_op}` with the following query parameters:
   - `clientId` — Vitvit user id
   - `phone` — user phone from upstream
   - `account_name` — `"{first_name} {last_name}"`
   - `partner_id`
   - `external_address` — value of `deposit_address`
   - `amount`
   - `partner_fee`
4. When `init_op=withdraw`, also appends:
   - `withdraw_fee` — value of `WITHDRAW_AUTO_FEE` env (defaults to `0`)
   - `account_number`

---

## Environment variables

| Name                  | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_BASEURL` | Base URL of the upstream Vitvit users service.                     |
| `PARTNER_SECRET`      | Bearer token used to authenticate the upstream user lookup call.   |
| `WITHDRAW_AUTO_FEE`   | Auto-applied withdraw fee appended to the withdraw redirect URL.   |

---

## Examples

### Deposit

```bash
curl --location --request POST 'https://widget-vitvit-cash-new.vercel.app/api/partner/log-user' \
  --header 'deposit_address: 7CNGUqh8xhy1YxoeTxo7wbp4tw924SyKQR2VzUiitqsS' \
  --header 'amount: 150' \
  --header 'init_op: deposit' \
  --header 'vitvit_user_id: b876f3bd-c5d7-4390-983d-1fabe5bd43c0' \
  --header 'partner_fee: 0.02' \
  --header 'partner_id: d90c5511-ad4f-48cc-934a-c13d8f162d50'
```

Response:

```json
{
  "ok": 1,
  "url_deposit": "https://widget-vitvit-cash-new.vercel.app/partner/deposit?clientId=b876f3bd-c5d7-4390-983d-1fabe5bd43c0&phone=18290000002&account_name=Hello_1829_2+test7&partner_id=d90c5511-ad4f-48cc-934a-c13d8f162d50&external_address=7CNGUqh8xhy1YxoeTxo7wbp4tw924SyKQR2VzUiitqsS&amount=150&partner_fee=0.02"
}
```

### Withdraw

```bash
curl --location --request POST 'https://widget-vitvit-cash-new.vercel.app/api/partner/log-user' \
  --header 'amount: 250' \
  --header 'init_op: withdraw' \
  --header 'vitvit_user_id: 2a922918-9542-415e-a157-38fcb28abd28' \
  --header 'partner_fee: 0.015' \
  --header 'partner_id: d90c5511-ad4f-48cc-934a-c13d8f162d50' \
  --header 'account_number: 50937649948'
```

Response:

```json
{
  "ok": 1,
  "url_withdraw": "https://widget-vitvit-cash-new.vercel.app/partner/withdraw?clientId=2a922918-9542-415e-a157-38fcb28abd28&phone=18290000001&account_name=Hello_1829_1+test1&partner_id=d90c5511-ad4f-48cc-934a-c13d8f162d50&external_address=undefined&amount=250&partner_fee=0.015&withdraw_fee=0.025&account_number=50937649948"
}
```

### JSON body equivalent

```bash
curl --location --request POST 'https://widget-vitvit-cash-new.vercel.app/api/partner/log-user' \
  --header 'Content-Type: application/json' \
  --data '{
    "partner_id": "d90c5511-ad4f-48cc-934a-c13d8f162d50",
    "vitvit_user_id": "b876f3bd-c5d7-4390-983d-1fabe5bd43c0",
    "init_op": "deposit",
    "amount": 150,
    "partner_fee": 0.02,
    "deposit_address": "7CNGUqh8xhy1YxoeTxo7wbp4tw924SyKQR2VzUiitqsS"
  }'
```
