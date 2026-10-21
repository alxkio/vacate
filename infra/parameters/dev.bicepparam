using '../main.bicep'

param environmentName = 'dev'
param location = loadJsonContent('../targets/dev.json').location
param staticSiteLocation = 'westeurope'
param namePrefix = 'vacate'
param staticSiteSku = 'Free'
param maximumInstanceCount = 40
