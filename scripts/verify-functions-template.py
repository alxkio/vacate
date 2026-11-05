#!/usr/bin/env python3
"""Validate the SQL hostname and connection options in compiled Functions ARM."""

import argparse
import json
import re
from pathlib import Path


def verify(template):
    module = next(resource['properties']['template'] for resource in template['resources']
                  if resource.get('type') == 'Microsoft.Resources/deployments'
                  and resource['name'] == 'functions-backend')
    hostname = module.get('variables', {}).get('sqlServerHostname', '')
    match = re.fullmatch(
        r"\[format\('([^']+)', parameters\('sqlServerName'\), environment\(\)\.suffixes\.sqlServerHostname\)\]",
        hostname,
    )
    if not match:
        raise ValueError('SQL hostname must combine the server name and Azure environment suffix')

    site = next(resource for resource in module['resources'] if resource['type'] == 'Microsoft.Web/sites')
    settings = site['properties']['siteConfig']['appSettings']
    connection = next(setting['value'] for setting in settings if setting['name'] == 'ConnectionStrings__Vacate')
    if not connection.startswith("[if(parameters('enableSqlPersistence'), ") or not connection.endswith(", '')]"):
        raise ValueError('SQL connection must remain disabled when SQL persistence is disabled')
    connection_format = re.search(
        r"format\('([^']+)', variables\('sqlServerHostname'\), parameters\('sqlDatabaseName'\), reference\(",
        connection,
    )
    if not connection_format or ').clientId)' not in connection:
        raise ValueError('SQL connection must use the validated hostname, database and managed identity client ID')

    for suffix in ('.database.windows.net', '.database.usgovcloudapi.net', '.database.chinacloudapi.cn'):
        host = match.group(1).format('vacate-dev-srv', suffix)
        if host != 'vacate-dev-srv' + suffix:
            raise ValueError('SQL hostname contains missing or duplicated separators')
        rendered = connection_format.group(1).format(host, 'vacate-dev-db', 'test-client-id')
        options = dict(field.split('=', 1) for field in rendered.split(';') if field)
        expected = {
            'Server': f'tcp:{host},1433',
            'Database': 'vacate-dev-db',
            'Authentication': 'Active Directory Managed Identity',
            'User Id': 'test-client-id',
            'Encrypt': 'True',
            'TrustServerCertificate': 'False',
        }
        if any(options.get(key) != value for key, value in expected.items()):
            raise ValueError('SQL connection hostname or identity/TLS options are invalid')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('template', type=Path)
    args = parser.parse_args()
    verify(json.loads(args.template.read_text()))
    print('PASS: compiled Functions SQL hostname, persistence switch, managed identity and TLS options.')


if __name__ == '__main__':
    main()
