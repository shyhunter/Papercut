# Papercut Monetization Strategy

**Status:** Draft — all decisions deferred to post-beta
**Model:** One-time purchase (no subscription)
**Last updated:** 2026-03-16

---

## 1. Pricing Model: One-Time Purchase

Papercut will use a **one-time purchase** model. No subscriptions, no recurring fees.

### Rationale

- **Privacy-first architecture:** All processing happens locally on the user's device. There are no servers to maintain, no cloud storage costs, and no ongoing infrastructure expenses that would justify recurring charges.
- **User trust:** A one-time purchase aligns with the app's privacy promise — users own the software outright, with no account required and no data leaving their machine.
- **Simplicity:** Users prefer predictable pricing. Pay once, use forever. Updates included for the major version purchased.

---

## 2. Free vs Paid Tier Considerations

Three options are under consideration. The final decision will be made **after beta feedback** confirms which tools users value most and how they use the app.

### Option A: Core Free / Advanced Paid

- **Free tier:** Core tools (compress PDF, resize images, basic format conversion)
- **Paid tier:** Advanced tools (sign, redact, edit, merge/split, protect/unlock, document conversion)
- **Pros:** Users get real value for free, building trust and word-of-mouth. Clear upgrade path.
- **Cons:** Defining the free/paid boundary requires understanding which features drive purchases.

### Option B: Watermark Model

- **Free tier:** Full functionality with a small "Processed by Papercut" watermark on output
- **Paid tier:** No watermark
- **Pros:** Users experience all features before purchasing. Simple upgrade trigger.
- **Cons:** Watermarks can feel hostile. May damage brand perception for a privacy-focused app.

### Option C: Usage Limits

- **Free tier:** Limited processing (e.g., 3 files per day)
- **Paid tier:** Unlimited processing
- **Pros:** Natural trial experience. Users hit the limit only when the app is valuable to them.
- **Cons:** Enforcing limits in a local app requires license key infrastructure. Can feel artificial.

### Recommendation

**Decide after beta.** Beta feedback will reveal:
- Which tools users engage with most (informs Option A boundary)
- Whether users process many files or few (informs Option C limits)
- Overall willingness to pay and price sensitivity

---

## 3. Pricing

**TBD — to be determined after beta.**

### Competitor Benchmarks (for reference)

| Product | Model | Price |
|---------|-------|-------|
| PDF Expert | One-time | $79.99 |
| Smallpdf | Subscription | $12/mo |
| iLovePDF | Subscription | $7/mo |
| Preview (macOS) | Free (bundled) | $0 |
| LibreOffice | Free (open source) | $0 |

### Pricing Considerations

- Papercut is a desktop app with no cloud costs — pricing should reflect this
- Target range will depend on feature set included in paid tier
- Consider regional pricing for global accessibility
- Launch discount or early-bird pricing for beta participants

---

## 4. Payment Provider Options

### Gumroad

- **Simplest option.** Handles payments, licensing, and delivery.
- Built-in license key generation and validation API
- 10% fee per transaction
- Good for indie/solo products

### Paddle

- **Tauri-friendly.** Designed for desktop software distribution.
- Handles global tax compliance (VAT, sales tax) automatically
- Acts as merchant of record — simplifies legal obligations
- 5% + $0.50 per transaction

### Stripe + Custom License Server

- **Most control.** Full customization of payment flow and licensing.
- Requires building and hosting a license validation server
- 2.9% + $0.30 per transaction
- Higher development effort but lowest per-transaction cost

### Recommendation

**Paddle or Gumroad** for simplicity. Both handle tax compliance and licensing out of the box, avoiding the need to build and maintain a license server. Final selection post-beta based on:
- Fee structure at expected volume
- Tauri integration quality
- License key API flexibility

---

## 5. License Key Architecture

### Current State (Beta)

No licensing code is implemented. The app runs with full functionality for all beta users.

### Future Architecture (Post-Beta)

```
isLicensed() → true   // Stub for beta — always returns true
```

When a payment provider is chosen, the licensing flow will be:

1. User purchases license via payment provider
2. User receives a license key (email delivery)
3. User enters key in Papercut settings
4. App validates key against provider API (one-time online check)
5. Key stored locally — no ongoing internet requirement

### Design Principles

- **Offline-first:** License validation happens once. App works offline after activation.
- **No DRM:** No invasive copy protection. Trust the user.
- **Graceful degradation:** If validation fails (network issue), allow continued use with gentle reminder.
- **No pre-wiring:** No licensing code will be added until the payment provider is chosen. Avoids premature abstraction.

---

## 6. Timeline

All monetization work is **post-beta**:

| Phase | Timing | Activities |
|-------|--------|------------|
| Beta | Now | Free access for all beta users. Gather feedback. |
| Post-Beta Analysis | After beta closes | Review usage data, survey results, feature engagement |
| Pricing Decision | Post-analysis | Choose tier model, set price, select payment provider |
| Implementation | After decisions | Integrate payment provider, build license validation |
| Launch | After implementation | Public release with pricing |

---

## 7. Deferred Decisions

The following decisions are explicitly deferred to **post-beta**:

- [ ] Which free/paid tier model (A, B, or C)
- [ ] Exact pricing
- [ ] Payment provider selection
- [ ] License key implementation details
- [ ] Whether to offer a free tier at all (vs. paid-only with free trial)
- [ ] Regional pricing strategy
- [ ] Beta participant discount/grandfathering

---

*This document captures the monetization strategy as of beta preparation. All implementation decisions will be revisited after beta feedback is collected and analyzed.*
