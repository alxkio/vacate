# Tech Choices for Vacate

## Backend (.NET API)

### Core Framework & Language
- **.NET 8+** (LTS; latest stable at time of development)
- **C# 12+** with modern language features (records, nullable reference types enabled)
- **ASP.NET Core Web API** (minimal hosting model for performance)

### Architecture & Patterns
- **Domain-Driven Design (DDD)** with clear bounded contexts:
  - Leave Management context
  - Organization/Hierarchy context
  - Approval Workflow context
  - User/Identity context
- **Module-oriented structure** — physical folder structure mirrors domain logic
- **CQRS pattern** (Commands/Queries) — optional, evaluate based on complexity
- **Event Sourcing consideration** — for audit trail requirements (GDPR compliance)

### Database & ORM
- **Entity Framework Core 8+** with code-first migrations
- **Azure SQL Database** (EU region: West Europe)
  - Encrypted at rest and in transit
  - Automated backups (LRS in same region, optional geo-redundancy)
  - Row-level security for multi-tenant scoping
  - GDPR Data Processing Agreement included with Azure
  - Cost-optimized with auto-pause for dev environments
- **Connection string management** via Azure Key Vault
- **Database migration strategy** — automated migrations on deployment with rollback capability

### Authentication & Authorization
- **Identity Framework (ASP.NET Core Identity)** for user management
- **IdentityServer 4 / Duende IdentityServer** for OpenID Connect provider
  - **SSO Integrations:**
    - Google OAuth 2.0
    - Microsoft Entra ID (Azure AD)
    - Generic OpenID Connect for other IDPs
  - **JWT Bearer tokens** with appropriate expiry (15 min access + refresh token)
  - **Role-based access control (RBAC)** — Admin, Manager, HR, Employee
  - **Claim-based authorization** — for org hierarchy scoping (team_id, dept_id, org_id claims)
  - **Token refresh strategy** with sliding expiry

### API Design
- **REST API** (primary) — resource-oriented design following REST conventions
  - Consistent versioning strategy (URL path: `/api/v1/...`)
  - Proper HTTP status codes and error responses
  - Pagination, filtering, sorting support
- **GraphQL API** (secondary) — for complex queries (org hierarchy, nested approvals)
  - HotChocolate or Strawberry Shake for implementation
  - Subscription support for real-time approvals
  - Query complexity limits (prevent expensive queries)
- **API versioning strategy** — maintain backwards compatibility for min 2 versions

### Caching & Performance
- **Redis** (for distributed caching)
  - Cache leave balances, org hierarchy (frequently accessed)
  - Cache invalidation strategy based on events
  - Session storage option
- **HTTP response caching headers** (ETag, Cache-Control)
- **Query optimization** — index strategy on org_id, user_id, approval_chain fields

### Async & Background Jobs
- **Hangfire** for background jobs:
  - Send approval notifications (email, Slack)
  - Recalculate leave balances on yearly reset
  - GDPR data export/deletion jobs
  - Audit log cleanup
- **Message Queue:** **RabbitMQ** (cost-efficient, self-hosted in Azure VM or Docker)
  - Async notification delivery
  - Event publishing (approval submitted, leave rejected, balance updated)
  - Decouples API from notification service
  - **Alternative:** Azure Service Bus (managed, simpler ops but higher cost)

### Logging & Monitoring
- **Serilog** for structured logging (JSON format)
  - **Application Insights (Azure)** as primary sink
  - Centralized log aggregation with proper severity levels
  - Exception tracking, request tracing, performance metrics
- **OpenTelemetry** for distributed tracing
- **Prometheus metrics** endpoint (optional, for infrastructure monitoring)
- **Health check endpoint** (`/health`, `/ready`) for Kubernetes/load balancer
- **No Sentry** — using Application Insights exclusively for error tracking

### Testing Strategy
- **Unit tests** — xUnit with Moq/NSubstitute for mocks (target: >80% coverage on business logic)
- **Integration tests** — xUnit with testcontainers (SQL Server/PostgreSQL in Docker)
- **E2E tests** — Playwright (C# bindings) — tests full API flows
  - Test critical paths: leave request → approval → rejection → balance update
- **Performance tests** — k6 or Apache JMeter for load testing
- **Security tests** — OWASP ZAP scanning in CI/CD

### API Documentation & Discoverability
- **OpenAPI 3.1** / Swagger specification
  - Auto-generated from code using Swashbuckle.AspNetCore
  - Exposed at `/swagger/ui` and `/swagger/json`
  - Comprehensive documentation for all endpoints
- **API markdown docs** in `/docs/API.md` with examples

### Data Residency & Compliance
- **GDPR-native architecture:**
  - **Audit logs** for all data access (user, timestamp, action) — implemented via event sourcing (TBD: full CQRS or event log table)
  - Right to be forgotten — automated deletion jobs
  - Data portability — JSON export endpoint
  - Consent management for cookies/tracking
- **Event Sourcing consideration:**
  - Capture all state changes (leave request created, approved, rejected)
  - Immutable event log for compliance and audit trail
  - Decision: Implement after MVP (v1.1 release)
- **EU data residency enforced:**
  - Primary database: Azure SQL Database (West Europe region)
  - No cross-region replication without explicit consent
  - GDPR Data Processing Agreement with Azure (included)
- **PII encryption:**
  - Sensitive fields (SSN, dates of birth) encrypted at column level
  - Encryption keys in Key Vault (rotated annually)

### Security
- **HTTPS only** (TLS 1.3)
- **CORS policy** — whitelist specific origins (no wildcard)
- **Rate limiting** — per IP, per authenticated user
- **Input validation** — FluentValidation library (strong typing + custom rules)
- **Output sanitization** — prevent XSS/injection
- **Secrets management** — Azure Key Vault only, no hardcoded secrets
- **Dependency scanning** — WhiteSource / Dependabot for known vulnerabilities
- **SAST scanning** — Sonarqube in CI/CD
- **Penetration testing** — scheduled quarterly

### Error Handling & Resilience
- **Problem Details RFC 7807** — standardized error response format
- **Retry policies** — Polly for resilience (exponential backoff)
- **Circuit breaker** pattern for external dependencies
- **Graceful degradation** — meaningful error messages (no internal stack traces in prod)

---

## Frontend Web (Angular)

### Core Framework
- **Angular 18+** (latest LTS version)
- **Node.js 20+** LTS
- **Package manager:** **pnpm** (faster than npm, better monorepo support)
- **TypeScript 5.3+** with strict mode enabled

### State Management
- **NgRx** for complex state (approval workflows, org hierarchy)
  - Store, Actions, Reducers, Selectors, Effects
  - Redux DevTools integration for debugging
- **Component-level signals** (RxJS Signals for simpler state)
- **Smart/Dumb component pattern** — separation of concerns

### Build & Tooling
- **Build tool:** Angular CLI (under the hood: Webpack, Vite as alternative)
- **Package bundling strategy:**
  - Lazy-loaded feature modules for code splitting
  - Differential loading (modern browsers get ES2020+)
- **Build optimization:**
  - Ahead-of-Time (AOT) compilation (default)
  - Tree-shaking, dead code elimination
  - Minification & compression

### Forms & Validation
- **Reactive Forms** (template-driven forms NOT recommended for complex org hierarchy forms)
- **Custom form validators** for multi-level approval chains
- **Real-time validation** with debouncing (RxJS)
- **Form submission** — prevent double-submit, disable button during request

### HTTP & API Client
- **HttpClientModule** — interceptor-based approach
- **Custom HTTP interceptors:**
  - Auth token injection (Bearer token)
  - Error handling (4xx, 5xx responses)
  - Request logging (dev mode)
  - Retry logic with exponential backoff
- **API client service layer** — abstract REST/GraphQL endpoints
- **Request/Response DTOs** — strongly typed, auto-generated from OpenAPI spec (optional: ng-openapi-gen)

### Component Library & Design System
- **Angular Material** or **PrimeNG** — pre-built accessible components
- **Custom design system components:**
  - OrgHierarchyTree — recursive component for team/dept/org display
  - ApprovalFlowCard — multi-level approval visual
  - LeaveBalanceWidget — real-time balance display
  - TeamCalendarView — "who is off" calendar
  - RoleBasedVisibility — conditional rendering based on user scopes
- **Storybook** for component documentation & isolated development

### Styling & Layout
- **SCSS/SASS** (CSS preprocessor)
- **CSS Grid + Flexbox** for responsive layouts
- **Mobile-first responsive design** (breakpoints: 320px, 640px, 1024px, 1440px)
- **CSS custom properties (CSS variables)** for theming (light/dark mode)
- **WCAG 2.1 AA** compliance
  - Semantic HTML (proper heading hierarchy, ARIA labels)
  - Color contrast ratios ≥ 4.5:1 for text
  - Focus indicators, keyboard navigation support

### Accessibility
- **Testing tools:** Axe DevTools, Lighthouse
- **Keyboard navigation** — all interactive elements reachable via Tab
- **Screen reader testing** — NVDA, JAWS compatibility
- **ARIA attributes** — aria-label, aria-describedby, aria-live for dynamic content

### Internationalization (i18n)
- **@ngx-translate/core** or **Angular i18n**
- **Supported languages:** English, French, German, Spanish (initial EU launch)
- **Date/time localization** — ngx-intl or native Intl API
- **Currency formatting** — EUR as primary

### Testing
- **Unit tests:** Jasmine + Karma (or Jest)
  - TestBed for component testing
  - Target: >75% coverage
- **Component tests:** Angular Testing Library
- **E2E tests:** Playwright (preferred) or Cypress
  - Test critical user journeys: login → request leave → approve → view calendar
- **Visual regression testing:** Percy or Chromatic (optional, for design system)

### Performance
- **Lazy loading:** Feature modules loaded on-demand
- **Change detection strategy:** OnPush (minimize change detection cycles)
- **Virtual scrolling** (CDK virtual-scroll) for large lists (approval queues)
- **Image optimization:** WebP format, lazy loading
- **Bundle analysis:** webpack-bundle-analyzer
- **Performance budgets:** Set in angular.json (alert on bloat)
- **Lighthouse score target:** >90 (performance, accessibility, best practices)

### Development Workflow
- **Code formatting:** Prettier (configured in Angular CLI)
- **Linting:** ESLint + @angular-eslint (rules: strict, security-focused)
- **Pre-commit hooks:** husky + lint-staged (prevent bad commits)
- **Debugging:** Angular DevTools, browser DevTools
- **Local API mocking:** MSW (Mock Service Worker) or Mirage for offline development

### Routing & Navigation
- **Angular Router** with lazy loading
- **Route guards:** CanActivate, CanDeactivate (prevent accidental data loss)
- **Deep linking support** (shareable URLs for specific leaves/approvals)

---

## iOS App

### Language & Framework
- **Swift 5.9+** (latest stable)
- **SwiftUI** (modern, declarative UI framework — NOT UIKit)
- **Minimum iOS deployment target:** iOS 15 (covers >95% of active devices)

### Architecture & Patterns
- **MVVM (Model-View-ViewModel)** with Combine framework
- **Async/await** for async operations (Swift 5.5+)
- **Clean Architecture principles** — separation of concerns
- **Dependency Injection** using constructor injection or custom container

### Networking & API Client
- **URLSession** (Apple's native HTTP client)
- **Custom REST API client** wrapper around URLSession
- **GraphQL client:** Apollo iOS (for GraphQL queries if needed)
- **Certificate pinning** for API security
- **Timeout configuration:** 30-second default with exponential backoff

### Data Persistence
- **UserDefaults** — for simple key-value storage (user preferences, last viewed)
- **Keychain** — for storing JWT tokens securely (encrypted by OS)
- **Core Data** — for complex offline-first data (leave requests, approvals cache)
  - Sync strategy: pull latest on app foreground, push pending changes
- **FileManager** — for temporary file storage only (logs, exports)

### Authentication & Security
- **OAuth 2.0 flow** — SSO with Google/Microsoft
- **AppAuth library** (AppAuth-iOS) for secure OIDC implementation
- **Secure token storage** in Keychain
- **Biometric authentication** (Face ID, Touch ID) for app unlock
- **Certificate pinning** — prevent MITM attacks

### UI/UX Specifics
- **SwiftUI Components:**
  - NavigationStack for hierarchical navigation
  - TabView for bottom tab bar (Dashboard, Leave, Approvals, Calendar, Settings)
  - Form for structured input (new leave request)
  - List for scrollable approval queues (with swipe actions)
  - Calendar view (native CalendarView in iOS 16+)
- **Accessibility (WCAG):**
  - VoiceOver support — proper accessibility labels
  - Dynamic Type support (font size scaling)
  - Color contrast compliance
- **Dark mode support** — automatic via system settings
- **Responsive design** — adapt to iPhone, iPad, landscape orientation

### Performance & Optimization
- **Lazy loading** — paginate approval queues
- **Image caching** — URLCache with custom policies
- **Network optimization** — batch requests, request consolidation
- **Memory management** — avoid retain cycles in closures
- **Profiling tools:** Xcode Instruments (Time Profiler, Memory Graph)

### Testing
- **Unit tests:** XCTest framework
  - Target: >70% coverage
- **UI tests:** XCUITest
  - Test critical flows: login, request leave, approve, view calendar
- **Snapshot tests:** SnapshotTesting library (verify UI consistency)

### Dependency Management
- **Swift Package Manager (SPM)** — preferred
- **CocoaPods** — fallback if needed (less ideal for modern projects)
- **Dependencies to consider:**
  - Alamofire (optional, if not using URLSession directly)
  - Moya (network abstraction layer)
  - Apollo (GraphQL)
  - Kingfisher (image caching)
  - SwiftyBeaver (logging)

### Code Quality & Distribution
- **Code signing:** Apple Developer account, certificates managed in Xcode
- **Provisioning profiles:** Development, Adhoc, App Store
- **App Distribution:** TestFlight (beta), App Store (production)
- **Version strategy:** Semantic versioning (major.minor.patch)
- **Build numbers:** Increment on every release
- **Signing & Provisioning:** Automated in CI/CD (fastlane or GitHub Actions)

### Localization
- **Supported languages:** English, French, German, Spanish
- **String catalogs** (native .xcstrings format in Xcode 15+)
- **Right-to-left (RTL)** support if extending to Arabic in future

---

## Android App

### Language & Framework
- **Kotlin** (recommended over Java for modern Android)
- **Jetpack Compose** (declarative UI — NOT XML layouts)
- **Minimum API level:** 24 (Android 7.0 — covers >90% of devices)
- **Target API level:** Latest stable (increment annually)

### Architecture & Patterns
- **MVVM (Model-View-ViewModel)** using Jetpack Compose + Compose Navigation
- **Dependency Injection:** Hilt (Android standard)
- **Repository pattern** — data layer abstraction
- **Clean Architecture** — separation of concerns

### Networking & API Client
- **Retrofit** (HTTP client with OkHttp) OR **Ktor Client**
- **OkHttp interceptors** for:
  - Auth token injection
  - Request/response logging (debug builds only)
  - Certificate pinning
- **Coroutines** for async operations (suspend functions)
- **Flow** for reactive data streams
- **Timeout configuration:** 30-second default with exponential backoff

### Data Persistence
- **Jetpack DataStore** (replaces SharedPreferences for simple key-value)
- **Android Keystore** — for JWT token storage (hardware-backed encryption)
- **Room Database** — for complex offline-first data (leave requests, approvals)
  - Migration strategy for schema changes
  - Sync strategy: periodic sync with background service
- **Protobuf serialization** (optional, for efficiency)

### Authentication & Security
- **OAuth 2.0 flow** — AppAuth library (AppAuth-Android)
- **Secure token storage** in Android Keystore (encrypted)
- **Biometric authentication** (fingerprint, face) using BiometricPrompt
- **Certificate pinning** — prevent MITM attacks
- **Proguard/R8** obfuscation for release builds

### UI/UX Specifics
- **Jetpack Compose UI Components:**
  - Scaffold for top app bar + bottom navigation
  - BottomNavigation (Dashboard, Leave, Approvals, Calendar, Settings)
  - Form state management with Compose state hoisting
  - LazyColumn for scrollable approval queues (with swipe-to-action)
  - Material Design 3 components (latest Material Design)
- **Material Design 3 compliance:**
  - Color system (Material You dynamic colors for Android 12+)
  - Typography scale
  - Spacing & layout guidelines
- **Accessibility (WCAG):**
  - Semantic labels (contentDescription)
  - Touch target size minimum 48dp
  - Color contrast ≥ 4.5:1
  - TalkBack support (screen reader)
- **Responsive design:**
  - Adaptive layouts for phones (portrait/landscape) and tablets
  - Window size classes (Compact, Medium, Expanded)
- **Dark mode** — automatic via system theme

### Performance & Optimization
- **Lazy loading** — paginate approval queues
- **Coil** or **Glide** for image caching
- **Network optimization** — batch requests
- **Coroutines optimization** — avoid creating excessive coroutines
- **Memory optimization** — use Jetpack ViewModel for lifecycle-aware state
- **Profiling tools:** Android Studio Profiler

### Testing
- **Unit tests:** JUnit + Mockk
  - Target: >70% coverage
- **UI tests:** Espresso or Compose UI testing library
  - Test critical flows: login, request leave, approve, view calendar
- **Screenshot tests:** Roborazzi (Jetpack Compose)

### Dependency Management
- **Gradle** (Kotlin DSL preferred over Groovy)
- **Version Catalog** (centralized dependency versions)
- **Dependencies to consider:**
  - Retrofit (networking)
  - OkHttp (HTTP client)
  - Hilt (DI)
  - Room (local database)
  - DataStore (preferences)
  - Coil (image loading)
  - Timber (logging)
  - Arrow (functional programming utilities, optional)

### Code Quality & Distribution
- **Code signing:** Keystore file management, signing configuration
- **Play Signing:** Google Play handles re-signing (automatic)
- **Version code & version name:** Semantic versioning
- **App Distribution:** Google Play Console (beta track, production)
- **Obfuscation:** R8 (modern Proguard replacement)
- **APK splitting:** Architecture-specific APKs (arm64-v8a, armeabi-v7a) for size optimization

### Localization
- **Supported languages:** English, French, German, Spanish
- **String resources** in `res/values-xx/strings.xml`
- **Pluralization support** — resource quantities

---

## Shared Cross-Platform Concerns

### CI/CD Pipeline
- **GitHub Actions** (or Azure Pipelines if preferred)
- **Workflow stages:**
  1. **Build** — compile code, run linters
  2. **Test** — unit tests, integration tests, E2E tests
  3. **Security** — SAST (Sonarqube), dependency scan, OWASP ZAP
  4. **Deploy** — staging first, then production
  5. **Post-Deploy** — smoke tests, health checks
- **Branch strategy:** Git Flow (main, develop, feature branches)
- **Release tagging:** Semantic versioning (v1.0.0 format)

### Error Tracking & Monitoring
- **Azure Application Insights** — primary error tracking across all platforms
  - Exception tracking, request tracing, dependency monitoring
  - Source maps for obfuscated/minified code (web + mobile)
  - Release tracking, grouped issues, custom metrics
  - Integrated dashboards and alerts
- **No Sentry** — Application Insights provides all needed functionality at lower cost
- **User-facing error messages** — no technical jargon, actionable

### Push Notifications
- **Firebase Cloud Messaging (FCM)** — primary for Android
- **Apple Push Notification (APN)** — primary for iOS
- **Backend service** — sends notifications for approvals, leave rejections
- **Notification payload** — deep link to relevant screen in app

### Analytics & Product Metrics
- **Tool: TBD** (Posthog, Mixpanel, or custom dashboard)
  - Track key actions: leave request submitted, approval clicked, calendar viewed
  - Funnel analysis: request → approval → completion
  - Cohort analysis: by team size, country, user role
- **Privacy-first:** No PII in events, anonymized user IDs, GDPR compliance
- **Decision timeline:** Finalize after MVP launch (user behavior data drives choice)

### Deployment Strategy
- **Blue-Green deployment** for zero-downtime API updates
- **Canary deployment** — gradually roll out to 10%, 50%, 100% of users
- **Feature flags** — LaunchDarkly
  - Enable/disable features per environment, user segment, or percentage
- **Rollback plan** — automated rollback on health check failure

### Feature Flags
- **Implementation:** **LaunchDarkly**
- **Purpose:**
  - A/B testing (pricing tiers, approval UX variants)
  - Progressive rollout (new org hierarchy scoping rules)
  - Kill switches (disable expensive features if needed)
  - User segment targeting (by country, company size, role)
- **Cost optimization:** LaunchDarkly scales with usage; evaluate alternatives if costs exceed $5k/year

### Database Backup & Disaster Recovery
- **Automated daily backups** — stored in Azure
- **Point-in-time restore** — 30-day retention minimum
- **Disaster recovery plan:**
  - RTO (Recovery Time Objective): <4 hours
  - RPO (Recovery Point Objective): <1 hour
- **Backup encryption** — AES-256

### Documentation Standards
- **API docs:** OpenAPI spec, Swagger UI
- **Code documentation:**
  - XML comments on public methods (C#)
  - JSDoc on exported functions (TypeScript)
  - KDoc on Kotlin public API
  - Swift documentation comments (///)
- **Architecture decisions:** ADR (Architecture Decision Records) format
- **Runbook:** Deployment, incident response, common troubleshooting

### Dependency Updates & Security
- **Automated dependency scanning:** Dependabot, WhiteSource
- **Update cadence:**
  - Security patches: immediate
  - Minor updates: monthly
  - Major updates: quarterly (after testing)
- **Vendor lock-in mitigation:**
  - Avoid Azure-specific APIs where possible
  - Use standard libraries (not Azure SDK exclusively)

---

## Infrastructure (Azure + Terraform)

### Azure Resources
- **Compute:**
  - App Service (Premium tier, auto-scale based on CPU/memory)
  - OR Container Instances / AKS if containerization desired
- **Database:**
  - Azure SQL Database (EU West Europe region)
    - Backup: LRS (Locally Redundant Storage) in same region
    - Geo-redundancy: optional (North Europe as DR replica)
  - OR PostgreSQL Flexible Server (managed, EU-hosted)
- **Caching:** Azure Cache for Redis (Standard tier)
- **Storage:** Blob Storage (for file exports, GDPR compliance data)
  - Retention policies, encryption at rest
- **Key Vault:** Secrets, keys, certificates
- **CDN:** Azure Front Door (DDoS protection, caching, WAF)
- **Monitoring:** Application Insights, Log Analytics Workspace
- **Networking:**
  - Virtual Network (for private connectivity)
  - Network Security Groups (firewall rules)
  - Private Endpoints (for database, key vault)

### Terraform Configuration
- **Modules:**
  - `app_service` — deploy .NET API
  - `database` — SQL Database / PostgreSQL setup
  - `keyvault` — secrets management
  - `cache` — Redis configuration
  - `cdn` — front-end CDN + WAF
  - `monitoring` — Application Insights, Log Analytics
- **Environment management:** dev, staging, production
- **State management:** Azure Storage Account (remote Terraform state)
- **GDPR enforcement in code:**
  - Geo-constraints (EU region only)
  - Encryption by default
  - Audit logging enabled

### Security & Compliance
- **Network isolation:** Private subnets, NSGs with minimal rules
- **Web Application Firewall (WAF):** Azure Front Door with OWASP rules
- **DDoS protection:** Standard (automatic), Premium (optional, advanced)
- **SSL/TLS:** Free certificates via Let's Encrypt or Azure-managed
- **Data encryption:**
  - At-rest: AES-256
  - In-transit: TLS 1.3
  - Database Transparent Data Encryption (TDE)
- **Secrets rotation:** Annual key rotation policy
- **Compliance auditing:** Azure Policy for governance
- **Penetration testing:** Scheduled quarterly (with Azure approval)

### Cost Optimization
- **Auto-scaling policies:**
  - App Service: CPU >70% scale up, <30% scale down
  - Minimum 2 instances (HA)
- **Reserved Instances:** 1-year or 3-year commitment for predictable workloads
- **Spot VMs** (if using VMs, not recommended for this use case)
- **Cost alerts:** Set budgets in Azure Cost Management

### High Availability & Disaster Recovery
- **Regional failover:** Standby resources in North Europe (optional for Phase 2)
- **Load balancing:** Azure Application Gateway / Front Door
- **Database replication:** Geo-redundancy or manual backup to secondary region
- **Uptime SLA target:** 99.95% (acceptable downtime: ~22 min/month)

---

## Summary Table

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Backend API** | .NET 8, C# | Type-safe, strong ecosystem, Identity Server mature |
| **Database** | Azure SQL Database | EU-hosted, encrypted, integrated with Azure ecosystem, cost-optimized |
| **Frontend Web** | Angular 18, TypeScript | Enterprise-grade, RxJS for complex state, component library |
| **iOS** | Swift + SwiftUI | Modern, performant, native OS integration |
| **Android** | Kotlin + Jetpack Compose | First-class language, modern declarative UI |
| **Caching** | Redis | Fast, distributed session/data caching |
| **Testing** | xUnit, Jasmine, XCTest, JUnit | Standard per platform |
| **CI/CD** | GitHub Actions | Tight GitHub integration, free for public repos |
| **Infrastructure** | Azure (Terraform) | EU-first, GDPR-native, IaC best practices |
| **Error Tracking** | Application Insights | Comprehensive error tracking, integrated with Azure, lower cost |
| **Async Jobs** | Hangfire | Simple, reliable background job scheduling |
| **Message Queue** | RabbitMQ | Cost-efficient self-hosted, async notification delivery, event publishing |
| **Feature Flags** | LaunchDarkly | Robust feature flag platform with user targeting and analytics |
| **Analytics** | TBD (post-MVP) | Decision deferred until MVP launch and user behavior data available (Posthog vs Mixpanel)|