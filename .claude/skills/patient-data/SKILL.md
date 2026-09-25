---
name: patient-data
description: Rules and a checklist for any change that collects, stores, shows, logs, sends, exports or deletes personal or health data of patients — bookings, the food diary, measurements, consultation notes, consent, personas kods, emails. GDPR Art. 9, Latvian medical-records retention (MK Nr. 265), encryption, processors, least privilege. Use for kind:security tasks and whenever a plan touches api/src/services, booking or cabinet data, email templates or logging.
---

# Patient data

This practice processes **health data** (GDPR Art. 9): diary entries, meal photos, weight and measurements, complaints, goals, consultation notes, CGM readings. Contact details and the personas kods are personal data. A mistake here is a reportable breach (Art. 33, 72 hours), not a bug.

## Hard boundaries

- **Identity comes from the SWA client principal only.** A `userId`, `email` or `patientId` in a query string or body is a filter the server checks against the principal, never the identity itself. Admin rights come from the principal plus the `ADMIN_EMAILS` app setting; no "localhost", "test" or header-token path may grant them in a production build.
- **Every read and write of one patient's data is scoped server-side** to that patient (or to an admin), in the repository query itself — not filtered after the fact in the handler or the browser.
- **No personal data in logs, error responses, analytics, URLs or client-side storage.** Log storage keys and outcomes (`booking <RowKey> confirmed`), never an email, name, phone, personas kods or diary text. Error bodies to the client are generic.
- **No real personal data in tests, fixtures, task files, commits or screenshots.** Synthetic values only (`patient@example.test`, `+371 20000000` is fine *only* in tests).
- **Never read or print secrets** (`.env`, `api/local.settings.json`, `.auth/`). Secrets live in Key Vault / app settings, read at runtime.
- **Never change production from here** — app settings, roles, data repairs and deploys go through the pipeline (verified, reviewed, then pushed to `main`) and change management. A plan may contain the command for the user to run; the agent does not run it.

## Checklist for a plan or a review

Go through each line; write "n/a" rather than skipping it.

1. **What data, and why** — which fields are new or newly exposed, and the purpose of each. Anything collected "just in case" is removed (data minimisation). The personas kods is collected only when an invoice needs it.
2. **Lawful basis and consent** — for health data, explicit consent captured **server-side** with timestamp and the version of the consent text (the privacy policy revision), per purpose (booking, food diary, reminders). Withdrawing consent must stop processing.
3. **Access** — who can read and change it: the patient (own records only), Sofija (admin), nobody else. Tested with a request as another patient and as an anonymous caller.
4. **Storage and encryption** — Azure encrypts at rest by default; TLS 1.2+ in transit. Fields with high identification risk (personas kods, phone) get application-level encryption or are not stored. Storage access through managed identity with a data-plane role scoped to one account (*Storage Table Data Contributor*, or `db_datareader`/`db_datawriter` on one schema in Azure SQL) — never an account key or *Contributor* on the subscription.
5. **Retention and deletion** — how long it is kept and what deletes it:
   - medical records (consultation notes, the diary once it is part of care): kept per MK Nr. 265 (40 years after the last entry), protected against alteration — corrections are new versions, not overwrites;
   - unconfirmed bookings and enquiries: short (e.g. 6 months), deleted by a scheduled job;
   - logs: 90 days.
   "Delete patient" must cover every table that holds their data (bookings, meals, FoodAccess, consent) or explain why a record is retained.
6. **Data-subject rights** — can the patient get a copy (export) and ask for erasure or correction? A new field joins the export.
7. **Processors** — any new service that receives the data (email, SMS, video, payments, AI, analytics) is EU-hosted or covered by a DPA with SCCs, is named in the privacy policy, and receives only what it needs. Health data never goes to a consumer AI API; if AI is used, Azure OpenAI in an EU region under the Microsoft DPA.
8. **Output encoding** — any value a patient typed, shown in the admin dashboard, the cabinet or an email, is escaped (`textContent`, an escaping helper, the email template's escape function).
9. **Audit** — changes to medical records and admin reads of a patient's records leave an audit entry (who, when, which record — no content).
10. **Privacy policy** — if the answer to 1, 5 or 7 changed, the policy pages in `src/pages/privacy-policy.astro` need an update in LV/RU/EN; add it as a step or a follow-up task, with the text from Sofija.

## Tests a plan must include

- An anonymous request and a request as a different patient are both refused (401/403), for every new or changed endpoint.
- A value containing `'`, `<script>`, and an OData fragment (`x' or PartitionKey ne '`) is stored and returned inert.
- Logs written during the test contain no email or name (spy on the logger).
- Deletion removes the patient's rows from every table the change touches.
