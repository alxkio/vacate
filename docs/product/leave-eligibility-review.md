# Leave eligibility — review list

**PROVISIONAL MOCK RULES AUTHORIZED · 2026-10-24 · production policy review OPEN.** The founder authorized the profile gates below for fictional frontend examples. They are not verified legal rules. The [approved catalogue](leave-types-review.md) owns the existing 30 types and allowance previews; the [policy register](../compliance/policy-sources.md) still has no approved statutory defaults. Five working days per week remains the mock convention. Results follow the [proposed API contract](../contracts/leave-eligibility.md) and [JSON schema](../contracts/leave-eligibility.schema.json); business rules will move behind the backend boundary later.

## Founder decision — current mock

**2026-10-24:** use explicit fictional profile values in the frontend. Upcoming marriage, pregnancy/birth or other events are **not prerequisites** for showing/applying for a type at this stage. Event registration and supporting documents may follow later; no registration/upload flow is added now. Rules are **country-based: Greece (GR), shared across companies**. Company customisation is deferred.

| Type / family | Authorized provisional mock gate | Remaining limit |
|---|---|---|
| Marriage/civil partnership | Married profile: `not-eligible`; other known marital states may apply | No upcoming-event requirement. This is a profile filter, not proof of a qualifying new event or remaining allowance. |
| Maternity, prenatal examinations, assisted reproduction, gynecological screening | Female profile: may apply; male profile: `not-eligible` | Gender is an explicit fictional field, never inferred from names. Exact legal scope and exceptions need review. |
| Paternity | Male profile: may apply; female profile: `not-eligible` | No upcoming-birth requirement; current marital status does not block it. |
| Single-parent | Divorced **and** dependent children **and** sole-care facts required | Divorce alone is insufficient even for this mock. The exclusion of other marital states conflicts with researched pathways and remains a production-policy question. |
| Child-related types | Children required as the basic profile gate | Type-specific conditions may still be To confirm; child count alone does not establish disability, school attendance or a hospital event. The child-illness shortlist stays children-only. |
| Adoption/surrogacy maternity and special maternity protection | Keep To confirm until pathway-specific review or an explicit reviewed scenario | No blanket gender exclusion because official guidance describes additional parental pathways. |
| Missing/unsupported profile values or unreviewed conditions | `to-confirm` | Unknown is not a denial, a confirmed allowance or a statutory grant. |

“May apply” permits a fictional preview; it does not verify an event, medical condition, payment or legal entitlement. No real employee profile or evidence is required. Known `not-eligible` choices are omitted from default personal choices; Show all retains their reference rules with disabled actions and reasons. This presentation remains revisable.

## Requested behaviour and unresolved conflicts

The profile gates above are now **authorized mock decisions**. The following official-source findings remain relevant to later country-policy interpretation and do not override that fictional scope. Their legal interpretation must be resolved before enforcing production entitlements.

| Area | Proposed qualifying fact | Source finding / review needed |
|---|---|---|
| Marriage/civil partnership | A qualifying event and whether its entitlement was already used | The Ministry describes leave on marriage/civil partnership. Current marital status does not establish an unused qualifying event. The Inspectorate FAQ says civil and subsequent religious ceremonies for the same marriage do not create two grants. [Ministry](https://ypergasias.gov.gr/ergasiakes-scheseis/atomikes-ergasiakes-sxeseis/adeies-ergazomenon/), [Inspectorate FAQ](https://www.hli.gov.gr/faqs/). |
| Maternity and related types | Relevant birth/placement/treatment role and event; separate each type | Do not infer a qualifying event from a name or gender. DYPA includes a designated parent in same-sex couples and transfer of special maternity protection to a father. A blanket exclusion by gender would miss these pathways. [DYPA](https://prosvasis.dypa.gov.gr/prostasia-tis-erghazomenis-miteras). |
| Paternity | Qualifying parental role and birth/adoption/fostering event | The Inspectorate describes a father's entitlement independent of marital/family status and a placement pathway; role/event checks need reviewed interpretation. [Inspectorate](https://www.hli.gov.gr/ergasiakes-scheseis/nomothesia-ergasiakes-scheseis/adeies-ergasiakes-scheseis/adeies-gia-tin-prostasia-tis-oikogeneias/adeia-patrotitas/). |
| Single-parent | Relevant exclusive custody/parental-responsibility or other qualifying care pathway | Ministry guidance includes widowed and unmarried parents and later exclusive-custody/responsibility clarifications, including separation and civil-partnership dissolution. **OPEN QUESTION for production:** define the full GR pathways rather than treating the mock's divorced-only gate as law. [Ministry](https://ypergasias.gov.gr/ergasiakes-scheseis/atomikes-ergasiakes-sxeseis/adeies-ergazomenon/). |

**Research confidence:** high that these official pages contain the stated pathways; completeness, company applicability and provision-specific effective dates remain **UNVERIFIED**. Checked **2026-10-24**. The Ministry references single-parent circulars dated **2022-11-14** and **2023-04-10**. DYPA now references **KYA 19794/2026**, with an effective date of **2026-07-24** and transitional arrangements; its full impact is **OPEN**, and the older 2024 reference alone cannot establish current coverage. No new legal rule is adopted here.

## All 30 types — future backend factors

This table translates the existing catalogue's descriptions into **proposed future data requirements**, not current event-registration prerequisites, complete legal conditions or approved calculations. The current mock gates are defined above. Each future rule needs a reviewed country policy version. Missing facts mean **To confirm**, not ineligible. Store only necessary production facts behind the backend; a frontend receives the assessment, not a family or medical dossier.

| Type | Proposed factors / request context | Guardrail or open detail |
|---|---|---|
| Annual leave | Employment period, recognised service, schedule, allowance period and usage | Separate service with employer from recognised total service; no gender/marital filter. |
| Sick leave | Personal absence context, employment period, applicable policy | Allowance/pay still To confirm; no diagnosis needed in mock. |
| Military service | Qualifying service event and employment conditions | Do not infer service from gender. |
| Maternity | Relevant birth role, expected/actual birth event and period | Production scope and exceptions need review; distinguish prenatal and postnatal pathways. |
| Adoption/surrogacy maternity | Qualifying placement/parental role, event date and age band | Exceptions and current pathways need review; no duplicate grant for one event. |
| Childcare | Qualifying care role/event, arrangement, applicable window and shared usage | Reduced hours and equivalent leave share one underlying right. |
| Special maternity protection | Relevant parental entitlement, insurance/applicability, preceding leave, transfer/designation | Include reviewed transfer pathways; no blanket male exclusion. |
| Paternity | Relevant parental role, birth/placement event and request window | Marital status alone does not decide it. |
| Parental | Qualifying parental role, child age band, employer service and per-child usage | Shared-care/placement and tenure exceptions need review. |
| Carer | Qualifying care relationship/household, service, care requirement | Mock only an assessment; do not collect diagnoses or evidence uploads. |
| Urgent family emergency | Qualifying care relationship and urgent event requiring presence | Event-specific; count occasions separately from days. |
| Assisted reproduction | Qualifying treatment event and policy applicability | Gender alone is not proof of treatment; exact statutory scope OPEN. |
| School attendance | Qualifying parental role, education/age band and shared allowance usage | No automatic exclusion of fathers or divorced parents. |
| Marriage/civil partnership | Qualifying event, date/window, prior grant against that event | Current married/unmarried field is insufficient. |
| Prenatal examinations | Relevant pregnancy/examination context and work-time conflict | No inference from names, gender or parenthood alone. |
| Parent of disabled child | Relevant care role, qualifying assessed condition, employer-size rule and arrangement | Eligibility signal only; no child's name or diagnosis in mock. |
| Dependent illness | Qualifying dependency/care role, illness event and protected-child count band | Shortlist remains children-only; retain one underlying allowance. |
| Serious child illness | Qualifying parental role and policy-specific condition/age assessment | Keep specialised assessment private; don't infer from child count. |
| Child hospitalization | Qualifying parental role, hospital event and necessary-presence period | Do not apply a generic under-18 exclusion; confirm full conditions. |
| Single-parent | Qualifying exclusive-care/custody/responsibility pathway and child age/care band | Divorced is neither sufficient nor the only researched pathway. |
| Transfusion/dialysis | Relevant personal qualifying assessment and employment conditions | Sensitive reason stays private; exact conditions OPEN. |
| Bereavement | Qualifying relationship, event and previous event usage | Keep bereaved-parent rule separate. |
| Disability supplement | Verified policy eligibility and allocation-adjustment record | Not requestable; credit once, avoid a second quota. |
| HIV-related | Relevant private assessment and employment conditions | Never expose diagnosis on calendar or infer from profile. |
| Study/examinations | Qualifying programme, exam context, duration/age band and period usage | Separate from postgraduate/doctoral entitlement. |
| Postgraduate/doctoral exams | Qualifying programme, exam event and programme-year usage | Remains outside common shortlist. |
| Union duties | Relevant role/membership, duty event, term and notification | Not a general employee quota. |
| Voting | Qualifying election, voting location/travel band and schedule | Event-specific decision, not yearly balance. |
| Bereaved parent | Relevant parental relationship and child-loss event | No marital/gender exclusion. |
| Gynecological screening | Relevant screening context and policy-specific eligibility | Exact scope OPEN; gender alone does not establish attendance. |

## Proposed boundary for the future backend

- Assessment states: `eligible`, `not-eligible`, `to-confirm`; distinguish an **unreviewed policy** from missing employee facts. Current `eligible` results come from provisional frontend profile gates or explicit fictional scenarios, not statutory approval.
- Future backend owns applicable country policy/version, effective period, subject/company authorisation, private qualifying facts, event identifiers, shared entitlements and prior use. GR rules are shared across companies initially; company customisation is deferred. Return leave type, state, safe reason code, validity dates and permitted request actions. Eligibility and available balance are separate results.
- Never accept a browser-supplied company/person ID or eligibility result as authorisation. Re-evaluate for the authenticated employee, company and request dates before saving/approving later.
- Current mock: `not-eligible` types are hidden from default personal choices and remain inspectable via Show all with disabled actions and a personal explanation; `to-confirm` types remain discoverable as To confirm. This presentation is revisable and cannot grant or remove entitlement. Unknown previews remain fictional examples, not approved requests.
- Use explicit fictional gender, marital status, dependent-child and sole-care values, plus coarse scenario flags as needed; never infer them from names. No real gender, marital status, pregnancy, custody, diagnoses, dependent identities or document uploads are required for this mock. Personal assessment details stay out of org/team calendars, URLs and session storage.

## Open questions for revision

1. **GR source conflicts before production:** what are the complete single-parent, maternity/paternity, adoption and transfer pathways, and which exceptions replace the simplified profile exclusions? The founder has authorized the mock gates; that decision does not establish legal scope.
2. Which employment-sector/insurance conditions, reviewers, effective dates and later amendments form the first verified GR policy version? Country-wide configuration is decided; company overrides remain deferred.
3. For specialist child-care, study, disability and treatment types, which additional facts turn To confirm into a decision? How should unsupported/unknown gender or marital values be reviewed without inferring data?
4. Who may confirm/override qualifying facts, when do assessments expire, and how are corrections/appeals recorded? Retain disabled choices or revise their presentation later?
5. Which event-registration windows, shared-care exceptions, required evidence and retention periods should the later backend enforce? Upcoming-event registration is explicitly not required by the present mock; no document collection is added here.

**Verification:** 30 factor rows match the existing catalogue names; no allowance figures, statutory defaults, backend enforcement or real personal data added. This review does not close VAC-5's existing policy questions.
