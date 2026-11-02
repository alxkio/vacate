@allowed(['swedencentral'])
param location string
@allowed(['vacate-dev-srv'])
param serverName string
@allowed(['vacate-dev-db'])
param databaseName string
param tags object
@allowed(['Disabled', 'Enabled'])
param publicNetworkAccess string = 'Disabled'
@minLength(36)
@maxLength(36)
param administratorObjectId string
@minLength(1)
param administratorLogin string
@minLength(36)
@maxLength(36)
param tenantId string

// Cost controls are literal: this module cannot enable paid overage or paid fallback.
resource server 'Microsoft.Sql/servers@2023-08-01' = {
  name: serverName
  location: location
  tags: tags
  properties: {
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: publicNetworkAccess
    administrators: {
      administratorType: 'ActiveDirectory'
      principalType: 'User'
      login: administratorLogin
      sid: administratorObjectId
      tenantId: tenantId
      azureADOnlyAuthentication: true
    }
  }
}

resource database 'Microsoft.Sql/servers/databases@2023-08-01' = {
  parent: server
  name: databaseName
  location: location
  tags: tags
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 2
  }
  properties: {
    createMode: 'Default'
    collation: 'Latin1_General_100_CI_AS_SC_UTF8'
    useFreeLimit: true
    freeLimitExhaustionBehavior: 'AutoPause'
    maxSizeBytes: 34359738368
    minCapacity: json('0.5')
    // Free-offer inactivity pause is service-controlled; do not override its delay.
    requestedBackupStorageRedundancy: 'Local'
    zoneRedundant: false
    readScale: 'Disabled'
    isLedgerOn: false
  }
}

resource shortTermRetention 'Microsoft.Sql/servers/databases/backupShortTermRetentionPolicies@2023-08-01' = {
  parent: database
  name: 'default'
  properties: {
    retentionDays: 7
  }
}

resource longTermRetention 'Microsoft.Sql/servers/databases/backupLongTermRetentionPolicies@2023-08-01' = {
  parent: database
  name: 'default'
  properties: {
    weeklyRetention: 'PT0S'
    monthlyRetention: 'PT0S'
    yearlyRetention: 'PT0S'
    // Required by the API even when yearly retention is disabled.
    weekOfYear: 1
  }
}

resource securityAlerts 'Microsoft.Sql/servers/securityAlertPolicies@2023-08-01' = {
  parent: server
  name: 'Default'
  properties: {
    state: 'Disabled'
    emailAccountAdmins: false
  }
}

resource auditing 'Microsoft.Sql/servers/auditingSettings@2023-08-01' = {
  parent: server
  name: 'default'
  properties: {
    state: 'Disabled'
    isAzureMonitorTargetEnabled: false
  }
}

output serverResourceId string = server.id
output databaseResourceId string = database.id
