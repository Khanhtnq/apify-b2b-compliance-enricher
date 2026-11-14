# Global B2B Entity, SEC EDGAR & CVE Supply-Chain Enricher (Apify Actor)

**Apify Store Monetization:** Pay-Per-Event (PPE) — `$0.05` per enriched company record (80% developer revenue share).

## 🚀 Overview
A zero-key, high-margin B2B compliance and risk auditing Actor. Combines:
1. **Official US SEC EDGAR Filings API** (`data.sec.gov/submissions`): Company SIC, incorporation state, fiscal calendar, and latest 10-K, 10-Q, and 8-K filings.
2. **Google OSV.dev Open-Source Vulnerability Database** (`api.osv.dev/v1/query`): Live CVE supply chain risk auditing for open source packages (npm, PyPI, Go, Maven, Cargo, NuGet).
3. **ICANN RDAP Domain Registry** (`rdap.org`): Authoritative nameserver records, domain registrar handles, and domain lifecycle status.

Zero residential proxy burn. 100% rate-limit compliant with zero API keys required from users!

---

## 💰 Pay-Per-Event (PPE) Model
- **Event:** `company-enriched`
- **Price:** `$0.05 USD` per company
- **Actor.charge Integration:**
  ```javascript
  await Actor.charge({ eventName: 'company-enriched' });
  ```

---

## 🧪 Local Testing & Verification
Run the live integration test suite against real endpoints:
```bash
node test_live_actor.mjs
```

### Live Test Output Sample:
```
Auditing company: Apple Inc. (CIK: 0000320193, Domain: apple.com)...
[PASS] Enriched in 1067.0ms | Compliance Score: 75/100
  - SEC EDGAR Status: SUCCESS (SIC: 3571, Recent Filings: 1002)
  - OSV CVE Status:   SUCCESS (Vulns Found: 5)
  - RDAP Domain:      SUCCESS (Nameservers: A.NS.APPLE.COM, B.NS.APPLE.COM)
  - [PPE Mock] Actor.charge({ eventName: 'company-enriched' }) -> $0.05 USD billed
```

---

## 👤 Author
- **Developer:** Trần Ngọc Quốc Khánh
- **Git:** `Khanhtnq <218711032+Khanhtnq@users.noreply.github.com>`
- **License:** Apache-2.0
