#!/usr/bin/env python3
"""Real Functions-host HTTP acceptance using fictional records only."""
import argparse
import json
import time
import urllib.error
import urllib.request
import uuid


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--api-base-url', default='http://127.0.0.1:7071/api')
    args = parser.parse_args()
    base = args.api_base_url.rstrip('/') + '/'

    def call(method, path, token=None, body=None, expected=200):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = 'Bearer ' + token
        request = urllib.request.Request(base + path, method=method, headers=headers,
                                         data=json.dumps(body or {}).encode() if method in ('POST', 'PATCH') else None)
        try:
            response = urllib.request.urlopen(request, timeout=10)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            payload = response.read()
            assert response.code == expected, (method, path, response.code, payload.decode())
            assert response.headers.get('Cache-Control') == 'no-store'
            return json.loads(payload) if payload else None

    for attempt in range(60):
        try:
            urllib.request.urlopen(args.api_base_url.rstrip('/') + '/health', timeout=2).close()
            break
        except (urllib.error.URLError, TimeoutError):
            if attempt == 59:
                raise
            time.sleep(1)
    call('GET', 'auth/sessions/current', expected=401)
    for name in ['leah', 'ravi', 'noah', 'maya', 'theo', 'iris', 'ella', 'owen', 'zoe', 'daria', 'nora', 'sam']:
        session = call('POST', 'auth/sessions', body={'username': name, 'password': name})
        token = session['accessToken']
        own = call('GET', 'auth/sessions/current', token)
        assert own['profile']['username'] == name + '@example.invalid'
        assert own['profile']['createdAt'] and own['profile']['deletedAt'] is None
        call('DELETE', 'auth/sessions/current', token, expected=204)
        call('GET', 'auth/sessions/current', token, expected=401)
    session = call('POST', 'auth/sessions', body={'username': 'nora', 'password': 'nora'})
    token = session['accessToken']
    own = call('GET', 'auth/sessions/current', token)
    org_id = own['profile']['membership']['companyId']
    org_path = 'organizations/' + org_id
    roles = call('GET', org_path + '/roles', token)
    colleague = call('GET', 'users/20000000-0000-4000-8000-000000000004', token)
    assert set(colleague) == {'username', 'email', 'firstName', 'middleName', 'lastName', 'gender', 'jobTitle', 'systemRole'}
    created = call('POST', 'users', token, {'username': 'http-acceptance-' + uuid.uuid4().hex + '@example.invalid', 'firstName': 'HTTP', 'lastName': 'Example'}, 201)
    user_id = created['guid']
    membership_path = org_path + '/memberships/' + user_id
    member = call('POST', membership_path, token, {'systemRoleId': roles['systemRoles'][1]['guid'], 'jobRoleId': roles['jobRoles'][0]['guid']}, 201)
    assert member['membership']['createdAt']
    call('PATCH', membership_path, token, {'priorService': 4.5, 'customAllocation': 26})
    call('POST', membership_path + '/deletion-request', token)
    call('DELETE', membership_path, token, expected=204)
    call('GET', membership_path, token, expected=404)
    call('DELETE', 'users/' + user_id, token, expected=204)
    new_org = call('POST', 'organizations', token, {'name': 'HTTP acceptance', 'workWeekDays': 6}, 201)
    path = 'organizations/' + new_org['guid']
    dept = call('POST', path + '/departments', token, {'name': 'Optional'}, 201)
    team = call('POST', path + '/teams', token, {'name': 'Team', 'departmentId': dept['guid']}, 201)
    call('PATCH', path + '/teams/' + team['guid'], token, {'name': 'Renamed'})
    call('DELETE', path + '/departments/' + dept['guid'], token, expected=409)
    call('DELETE', path + '/teams/' + team['guid'], token, expected=204)
    call('DELETE', path + '/departments/' + dept['guid'], token, expected=204)
    call('DELETE', path, token, expected=204)
    call('GET', path, token, expected=404)
    call('DELETE', 'auth/sessions/current', token, expected=204)
    print('PASS: real HTTP all 12 sessions, bearer/revocation, private projection, account/membership/org/structure CRUD, timestamps and deletion conflicts.')


if __name__ == '__main__':
    main()
