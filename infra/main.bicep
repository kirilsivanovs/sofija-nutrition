// Resources the site runs on: Static Web App (Free), Storage, Application Insights.
// Scope: resource group PersonalProjects. App settings are deliberately not described here
// (config/appsettings is a full replace and would need secret parameters).
//
//   az bicep build --file infra/main.bicep
//   az deployment group what-if -g PersonalProjects -f infra/main.bicep -p workspaceResourceId=<id>
//   az deployment group create -g PersonalProjects --mode Incremental -f infra/main.bicep -p workspaceResourceId=<id>
//
// Never use --mode Complete: it would silently delete resources not listed here (e.g. the orphan Function App).

targetScope = 'resourceGroup'

// No default: the id embeds the subscription id and this repo is public.
// Look it up: az monitor app-insights component show --app sofija-nutrition-api -g PersonalProjects --query workspaceResourceId -o tsv
param workspaceResourceId string

var location = 'westeurope'

// The deployment authorization policy (deployment token vs GitHub OIDC) has no ARM property; it is set in the portal.
resource staticSite 'Microsoft.Web/staticSites@2025-03-01' = {
  name: 'sofija-nutrition'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: 'https://github.com/kirilsivanovs/sofija-nutrition'
    branch: 'main'
    provider: 'GitHub'
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'sofijanutristg'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    // The API authenticates with a connection string (AZURE_STORAGE_CONNECTION_STRING), so shared key must stay on.
    allowSharedKeyAccess: true
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'sofija-nutrition-api'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspaceResourceId
    RetentionInDays: 90
    IngestionMode: 'LogAnalytics'
  }
}
