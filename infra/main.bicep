targetScope = 'resourceGroup'

@allowed(['dev', 'staging', 'prod'])
param environmentName string
param location string = resourceGroup().location
param staticSiteLocation string = 'westeurope'
@minLength(2)
@maxLength(7)
param namePrefix string = 'vacate'
@allowed(['Free', 'Standard'])
param staticSiteSku string = 'Free'
@minValue(40)
@maxValue(1000)
param maximumInstanceCount int = 40

@description('Retain warning/error diagnostics in Application Insights. False omits both monitoring resources.')
param enableMonitoring bool = true
@description('Daily workspace ingestion limit in GB; Azure requires >0.023 GB. This is not a hard spending cap.')
@allowed(['0.025', '0.05', '0.1', '0.25', '0.5', '1'])
param monitoringDailyCapGb string = '0.025'

@allowed(['', 'sc'])
param regionalNameSuffix string = ''
param enableSqlPersistence bool = false
param sqlServerName string = ''
param sqlDatabaseName string = ''

var suffix = uniqueString(subscription().subscriptionId, resourceGroup().id, environmentName)
var baseName = '${namePrefix}-${environmentName}-${suffix}'
var backendBaseName = empty(regionalNameSuffix) ? baseName : '${namePrefix}-${environmentName}-${regionalNameSuffix}-${suffix}'
var backendStorageName = empty(regionalNameSuffix) ? '${namePrefix}${environmentName}${take(suffix, 10)}' : '${namePrefix}${environmentName}${regionalNameSuffix}${take(suffix, 8)}'
var enableDevelopmentData = environmentName == 'dev'
var tags = { application: 'vacate', environment: environmentName, managedBy: 'bicep' }

module web 'modules/static-web-app.bicep' = {
  name: 'static-web-app'
  params: { baseName: baseName, location: staticSiteLocation, sku: staticSiteSku, tags: tags }
}
module monitoring 'modules/monitoring.bicep' = if (enableMonitoring) {
  name: 'monitoring'
  params: { baseName: backendBaseName, location: location, tags: tags, dailyCapGb: monitoringDailyCapGb }
}
module backend 'modules/functions-backend.bicep' = {
  name: 'functions-backend'
  params: {
    baseName: backendBaseName
    storageAccountName: backendStorageName
    location: location
    tags: tags
    allowedOrigins: [web.outputs.url]
    enableDevelopmentData: enableDevelopmentData
    maximumInstanceCount: maximumInstanceCount
    monitoringConnectionString: enableMonitoring ? monitoring!.outputs.connectionString : ''
    enableSqlPersistence: enableSqlPersistence
    sqlServerName: sqlServerName
    sqlDatabaseName: sqlDatabaseName
  }
}

output staticSiteName string = web.outputs.name
output staticSiteUrl string = web.outputs.url
output functionAppName string = backend.outputs.name
output functionAppUrl string = backend.outputs.url
output sqlPersistenceEnabled bool = enableSqlPersistence
output sqlServerHostname string = enableSqlPersistence ? '${sqlServerName}${environment().suffixes.sqlServerHostname}' : ''
output sqlTargetDatabaseName string = sqlDatabaseName
output runtimeIdentityName string = last(split(backend.outputs.identityId, '/'))
output runtimeClientId string = backend.outputs.clientId
