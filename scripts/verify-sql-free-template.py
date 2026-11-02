#!/usr/bin/env python3
"""Fail closed on unexpected resources or cost/security settings in compiled SQL ARM."""

import argparse
import json
import re
from pathlib import Path


def verify(template):
    deployments = template['resources']
    if len(deployments) != 1:
        raise ValueError('SQL entry point must contain exactly one reviewed module')
    deployment = deployments[0]
    if deployment['type'] != 'Microsoft.Resources/deployments' or deployment['name'] != 'sql-free-dev':
        raise ValueError('Only the SQL-free module is permitted')
    properties = deployment['properties']
    if properties.get('mode') != 'Incremental' or 'templateLink' in properties:
        raise ValueError('Only an inline Incremental SQL module is permitted')
    if properties.get('expressionEvaluationOptions') != {'scope': 'inner'}:
        raise ValueError('SQL module must evaluate within its own scope')
    values = properties['parameters']
    if values['serverName']['value'] != 'vacate-dev-srv':
        raise ValueError('Only the requested server name vacate-dev-srv is permitted')
    if values['databaseName']['value'] != 'vacate-dev-db':
        raise ValueError('Only the requested database name vacate-dev-db is permitted')
    if values['location']['value'] != "[parameters('location')]":
        raise ValueError('SQL module must use the authorized entry-point location')
    if template['parameters']['location'].get('allowedValues') != ['swedencentral']:
        raise ValueError('Only the authorized SQL region Sweden Central is permitted')
    default = template['parameters']['location'].get('defaultValue', '')
    match = re.fullmatch(r"\[variables\('([^']+)'\)\.sqlLocation\]", default)
    if not match or template.get('variables', {}).get(match.group(1), {}).get('sqlLocation') != 'swedencentral':
        raise ValueError('SQL region must resolve from the current dev target')
    for parameters in (template['parameters'], properties['template']['parameters']):
        if parameters.get('publicNetworkAccess') != {
            'type': 'string', 'defaultValue': 'Disabled', 'allowedValues': ['Disabled', 'Enabled'],
        }:
            raise ValueError('Public network mode must be explicit, constrained and disabled by default')
    if values['publicNetworkAccess']['value'] != "[parameters('publicNetworkAccess')]":
        raise ValueError('SQL module must preserve the explicit network-mode parameter')
    template = properties['template']
    resources = template['resources']
    expected = {
        'Microsoft.Sql/servers',
        'Microsoft.Sql/servers/databases',
        'Microsoft.Sql/servers/databases/backupShortTermRetentionPolicies',
        'Microsoft.Sql/servers/databases/backupLongTermRetentionPolicies',
        'Microsoft.Sql/servers/securityAlertPolicies',
        'Microsoft.Sql/servers/auditingSettings',
    }
    by_type = {resource['type']: resource for resource in resources}
    if len(resources) != len(expected) or set(by_type) != expected:
        raise ValueError('SQL-only resource allowlist failed')
    if template['parameters']['serverName'].get('allowedValues') != ['vacate-dev-srv']:
        raise ValueError('SQL module server-name constraint failed')
    if template['parameters']['databaseName'].get('allowedValues') != ['vacate-dev-db']:
        raise ValueError('SQL module database-name constraint failed')
    if by_type['Microsoft.Sql/servers']['name'] != "[parameters('serverName')]":
        raise ValueError('Server resource must use the reviewed server name')
    database_name = "[format('{0}/{1}', parameters('serverName'), parameters('databaseName'))]"
    if by_type['Microsoft.Sql/servers/databases']['name'] != database_name:
        raise ValueError('Database resource must use the reviewed names')
    server = by_type['Microsoft.Sql/servers']['properties']
    database = by_type['Microsoft.Sql/servers/databases']
    required = {
        'createMode': 'Default',
        'collation': 'Latin1_General_100_CI_AS_SC_UTF8',
        'useFreeLimit': True,
        'freeLimitExhaustionBehavior': 'AutoPause',
        'maxSizeBytes': 34359738368,
        'minCapacity': "[json('0.5')]",
        'requestedBackupStorageRedundancy': 'Local',
        'zoneRedundant': False,
        'readScale': 'Disabled',
        'isLedgerOn': False,
    }
    if database['properties'] != required:
        raise ValueError('Database properties differ from reviewed free-offer settings')
    if database['sku'] != {
        'name': 'GP_S_Gen5', 'tier': 'GeneralPurpose', 'family': 'Gen5', 'capacity': 2,
    }:
        raise ValueError('Only reviewed GP serverless SKU is permitted')
    if server.get('minimalTlsVersion') != '1.2' or server.get('publicNetworkAccess') != "[parameters('publicNetworkAccess')]":
        raise ValueError('TLS/network restrictions failed')
    if server.get('administrators', {}).get('azureADOnlyAuthentication') is not True:
        raise ValueError('Entra-only authentication is required')
    if 'administratorLoginPassword' in server:
        raise ValueError('SQL password authentication is excluded')
    if by_type['Microsoft.Sql/servers/databases/backupShortTermRetentionPolicies']['properties'] != {'retentionDays': 7}:
        raise ValueError('Only seven-day short-term retention is permitted')
    if by_type['Microsoft.Sql/servers/databases/backupLongTermRetentionPolicies']['properties'] != {
        'weeklyRetention': 'PT0S', 'monthlyRetention': 'PT0S', 'yearlyRetention': 'PT0S', 'weekOfYear': 1,
    }:
        raise ValueError('Long-term retention must stay disabled')
    if by_type['Microsoft.Sql/servers/securityAlertPolicies']['properties'] != {
        'state': 'Disabled', 'emailAccountAdmins': False,
    }:
        raise ValueError('Paid security alerts must stay disabled')
    if by_type['Microsoft.Sql/servers/auditingSettings']['properties'] != {
        'state': 'Disabled', 'isAzureMonitorTargetEnabled': False,
    }:
        raise ValueError('Audit ingestion must stay disabled')
    if template['parameters']['location'].get('allowedValues') != ['swedencentral']:
        raise ValueError('Only the authorized SQL region Sweden Central is permitted')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('template', type=Path)
    args = parser.parse_args()
    verify(json.loads(args.template.read_text()))
    print('PASS: SQL-only ARM resource, free-limit, AutoPause, storage, security and feature controls')


if __name__ == '__main__':
    main()
