using '../main.bicep'

param environmentName = 'dev'
param location = loadJsonContent('../targets/dev.json').location
param staticSiteLocation = 'westeurope'
param namePrefix = 'vacate'
param staticSiteSku = 'Free'
param maximumInstanceCount = 40

// Keep only essential operational diagnostics. Set false to omit paid log ingestion.
param enableMonitoring = true
param monitoringDailyCapGb = '0.01'
