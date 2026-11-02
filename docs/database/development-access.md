# Querying the development database

Target: `vacate-dev-srv.database.windows.net`, database `vacate-dev-db` (Sweden Central). Use Microsoft Entra authentication with the existing configured SQL Entra administrator account. No SQL password/login was created. The application's separate user-assigned identity has a contained database user with limited resource permissions; don't use that identity as a human connection credential.

## VS Code

Install Microsoft's SQL Server (mssql) extension. Open its connection dialog (MS SQL: Connect / Add Connection), enter the server and database above, choose Microsoft Entra authentication with interactive/MFA sign-in and select the existing administrator account. Keep encryption enabled and Trust Server Certificate disabled. The database can then be browsed through the extension's object explorer and queried from a SQL editor. Local network policy must permit SQL connectivity (normally TCP 1433). No paid Azure service is needed for this client.

## Azure portal

Open SQL databases → vacate-dev-db → Query editor. Choose Microsoft Entra authentication / Continue as the configured administrator. Portal access also requires Azure read access to the server/database; Azure resource access alone does not grant SQL data access. Portal query editor uses HTTPS 443. No SQL authentication/password is required.

```sql
SELECT SCHEMA_NAME(schema_id) AS SchemaName, name AS TableName
FROM sys.tables
ORDER BY SchemaName, TableName;

SELECT Id, Guid, Name, IsDemo
FROM dbo.Organizations;

-- Read consumption without a stored balance total.
SELECT e.CompanyId, e.MembershipId, e.PolicyMinimum, e.CustomAllocation,
    COALESCE(SUM(CASE WHEN l.Status = N'Used' THEN l.QuantityDays ELSE 0 END), 0) AS UsedDays,
    COALESCE(SUM(CASE WHEN l.Status = N'Pending' THEN l.QuantityDays ELSE 0 END), 0) AS PendingDays
FROM dbo.MembershipEntitlements e
LEFT JOIN dbo.Leaves l ON l.CompanyId = e.CompanyId AND l.MembershipId = e.MembershipId
GROUP BY e.CompanyId, e.MembershipId, e.PolicyMinimum, e.CustomAllocation;

SELECT MigrationId, ProductVersion
FROM dbo.__EFMigrationsHistory
ORDER BY MigrationId;
```

## Development network exception and cost boundary

On 2026-11-02 the user explicitly requested removing IP filtering during initial development, retaining identity security and enabling VS Code/portal access. The scoped dev runtime template uses DevelopmentOpen: public networking enabled and firewall range 0.0.0.0–255.255.255.255. This permits network connection attempts from any IPv4 address; it grants no database identity/permissions. Entra-only authentication, TLS 1.2 minimum, encrypted/certificate-validated clients and the app's limited database permissions remain required. No SQL password, Defender, private endpoint or NAT gateway was added. This exception supersedes the earlier narrow-IP requirement for this dev server only; no production exception is inferred.

The independent SQL free-offer deployment defaults to disabled public access; explicitly pass publicNetworkAccess=Enabled when preserving current development connectivity during SQL-only changes. Runtime connectivity is managed explicitly through [SQL runtime access Bicep](../../infra/deployments/sql-access.bicep) and the migration runbook. To restore restrictions, use Restricted mode with a verified allowlist and remove the open development rule explicitly; incremental deployments do not delete omitted resources. Do not claim changing the mode alone removes an existing broad rule.

SQL keeps useFreeLimit=true and AutoPause; do not enable BillOverUsage or paid resumption. Monthly allowance exhaustion means downtime until the next calendar month. A paused database may need time to resume. Close query-tool connections when finished because open connections can consume allowance/prevent idle pause. This remains disposable fictional development data, not production recovery or identity readiness.

Sources checked 2026-11-02: [Microsoft VS Code quickstart](https://learn.microsoft.com/en-us/azure/azure-sql/database/connect-query-vscode?view=azuresql), [portal query editor with Entra](https://learn.microsoft.com/en-us/azure/azure-sql/database/connect-query-portal?view=azuresql), [SQL free-tier FAQ](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-tier-faq?view=azuresql).
