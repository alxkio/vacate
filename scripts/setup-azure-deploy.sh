#!/usr/bin/env bash
# Run as an Azure administrator after az login; creates an appended deployment credential.
set -euo pipefail
umask 077

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
environment_name="${1:-dev}"
github_repository="${2:-alxkio/vacate}"
case "$environment_name" in dev|staging|prod) ;; *) echo 'Expected dev, staging or prod' >&2; exit 1 ;; esac
if [[ ! "$github_repository" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo 'Expected a GitHub OWNER/REPOSITORY' >&2
  exit 1
fi
command -v az >/dev/null || { echo 'Install Azure CLI and run az login first' >&2; exit 1; }
command -v jq >/dev/null || { echo 'Install jq first' >&2; exit 1; }
target_file="$repo_root/infra/targets/$environment_name.json"
subscription_id=$(jq -er '.subscriptionId' "$target_file")
resource_group=$(jq -er '.resourceGroup' "$target_file")
location=$(jq -er '.location' "$target_file")
az account set --subscription "$subscription_id"
tenant_id=$(az account show --subscription "$subscription_id" --query tenantId -o tsv)

az group create --subscription "$subscription_id" --name "$resource_group" --location "$location" --output none
scope="/subscriptions/$subscription_id/resourceGroups/$resource_group"
for provider in Microsoft.Web Microsoft.Storage Microsoft.ManagedIdentity Microsoft.OperationalInsights Microsoft.Insights; do
  az provider register --subscription "$subscription_id" --namespace "$provider" --wait --output none
done

# Reuse only an unambiguous application with this deployment-specific name.
app_name="${github_repository//\//-}-${environment_name}-deploy"
apps=$(az ad app list --display-name "$app_name" -o json)
app_count=$(jq 'length' <<< "$apps")
if [[ "$app_count" -gt 1 ]]; then
  echo "Multiple app registrations named $app_name; resolve before continuing" >&2
  exit 1
fi
if [[ "$app_count" -eq 0 ]]; then
  app=$(az ad app create --display-name "$app_name" -o json)
else
  app=$(jq '.[0]' <<< "$apps")
fi
client_id=$(jq -er '.appId' <<< "$app")
app_object_id=$(jq -er '.id' <<< "$app")
if ! principal_id=$(az ad sp show --id "$client_id" --query id -o tsv 2>/dev/null); then
  principal_id=$(az ad sp create --id "$client_id" --query id -o tsv)
fi

for role in Contributor 'Role Based Access Control Administrator'; do
  assignment=$(az role assignment list --subscription "$subscription_id" --assignee "$principal_id" --scope "$scope" --role "$role" --query '[0].id' -o tsv)
  if [[ -z "$assignment" ]]; then
    az role assignment create --subscription "$subscription_id" --assignee-object-id "$principal_id" --assignee-principal-type ServicePrincipal --scope "$scope" --role "$role" --output none
  fi
done

# Append a new secret without invalidating existing app credentials.
credential=$(az ad app credential reset --id "$app_object_id" --append --display-name github-deploy --years 1 -o json)
credential_file=$(mktemp "${TMPDIR:-/tmp}/vacate-azure-credentials.XXXXXX")
jq --arg subscription "$subscription_id" --arg tenant "$tenant_id" '{clientId: .appId, clientSecret: .password, subscriptionId: $subscription, tenantId: $tenant}' <<< "$credential" > "$credential_file"
printf 'Add the contents of %s as repository secret AZURE_CREDENTIALS in %s.\n' "$credential_file" "$github_repository"
printf 'The file is owner-readable only and contains a client secret; remove it after saving it in GitHub.\n'
printf 'No GitHub environment or federated credential is required.\n'
printf 'Target: subscription %s, resource group %s\n' "$subscription_id" "$resource_group"
printf 'SWA_DEPLOYMENT_TOKEN is optional; the workflow retrieves the token for the provisioned Vacate site when absent.\n'
