#!/usr/bin/env python3
"""VAC-31 HTTP acceptance; mutates fictional data on a disposable loopback host only.

Start a freshly seeded InMemory Functions host before running. This is actual HTTP
acceptance, not SQL persistence verification. Restart the host to remove test writes.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
import urllib.error
import urllib.parse
import urllib.request
import uuid


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--api-base-url', default='http://127.0.0.1:7071/api')
    args = parser.parse_args()
    parsed = urllib.parse.urlparse(args.api_base_url)
    if parsed.hostname not in ('localhost', '127.0.0.1', '::1'):
        parser.error('This fixture-writing check requires a disposable loopback host.')
    base = args.api_base_url.rstrip('/') + '/'

    def call(method, path, token=None, body=None, expected=200):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = 'Bearer ' + token
        request = urllib.request.Request(
            base + path, method=method, headers=headers,
            data=json.dumps(body).encode() if body is not None else None)
        try:
            response = urllib.request.urlopen(request, timeout=20)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            payload = response.read()
            assert response.code == expected, (method, path, response.code, payload.decode())
            assert response.headers.get('Cache-Control') == 'no-store'
            return json.loads(payload) if payload else None

    session = call('POST', 'auth/sessions', body={'username': 'maya', 'password': 'maya'})
    token = session['accessToken']
    own = call('GET', 'auth/sessions/current', token)
    org = own['profile']['membership']['companyId']
    prefix = 'organizations/' + org + '/leave/'
    foreign = 'organizations/' + str(uuid.uuid4()) + '/leave/'
    draft = {'leaveTypeId': 'annual', 'unit': 'days', 'mode': 'range',
             'startDate': '2026-01-04', 'endDate': '2026-01-06'}

    try:
        admin = call('POST', 'auth/sessions', body={'username': 'nora', 'password': 'nora'})['accessToken']
        organization_path = 'organizations/' + org
        initial = call('GET', organization_path, admin)
        initial_zone = initial['settings']['timeZone']
        try:
            call('PATCH', organization_path, token, {'timeZone': 'Europe/Athens'}, 404)
            call('PATCH', 'organizations/' + str(uuid.uuid4()), admin, {'timeZone': 'Europe/Athens'}, 404)
            call('PATCH', organization_path, admin, {'timeZone': 'not/a-real-timezone'}, 400)
            unchanged = call('GET', organization_path, admin)
            assert unchanged == initial, 'Invalid/unauthorized timezone writes must be atomic.'
            changed = call('PATCH', organization_path, admin, {'timeZone': 'Europe/Athens'})
            assert changed['settings']['timeZone'] == 'Europe/Athens'
            assert call('GET', organization_path, admin)['settings']['timeZone'] == 'Europe/Athens'
            call('PATCH', organization_path, admin, {'carryoverDeadline': '2099-12-31'}, 400)
            greek = call('PATCH', organization_path, admin, {'countryCode': 'GR'})
            call('PATCH', organization_path, admin,
                 {'carryoverEnabled': not greek['settings']['carryoverEnabled']}, 400)
            call('PATCH', organization_path, admin,
                 {'carryoverYears': greek['settings']['carryoverYears'] + 1}, 400)
            assert call('GET', organization_path, admin) == greek

        finally:
            call('PATCH', organization_path, admin, {'timeZone': initial_zone, 'countryCode': initial['settings']['countryCode']})
            call('DELETE', 'auth/sessions/current', admin, expected=204)
        call('GET', prefix + 'requests', expected=401)
        for resource in ('requests', 'calendar'):
            call('GET', foreign + resource, token, expected=404)
        call('POST', foreign + 'preview', token, draft, 404)
        call('POST', foreign + 'requests', token,
             dict(draft, idempotencyKey=str(uuid.uuid4())), 404)
        before = call('GET', prefix + 'requests', token)
        preview = call('POST', prefix + 'preview', token, draft)
        assert preview['workingDates'] == ['2026-01-05', '2026-01-06']
        assert preview['excludedDates'] == [{'date': '2026-01-04', 'reason': 'Non-working day'}]
        assert preview['canSubmit']
        assert all(b['leaveTypeId'] == 'annual' for b in preview['balances'])
        assert preview['warnings'], 'Excluded/past/missing-holiday conditions must be explained.'

        duration = call('POST', prefix + 'preview', token,
                        dict(draft, mode='duration', duration=2, endDate=None))
        assert duration['endDate'] == '2026-01-06'
        for invalid in (dict(draft, unit='hours'),
                        dict(draft, leaveTypeId='unconfigured'),
                        dict(draft, endDate='2026-01-04'),
                        dict(draft, mode='duration', duration=100),
                        dict(draft, startDate='2027-06-01', endDate='2027-06-03')):
            result = call('POST', prefix + 'preview', token, invalid)
            assert not result['canSubmit'] and result['errors']
            call('POST', prefix + 'requests', token,
                 dict(invalid, idempotencyKey=str(uuid.uuid4())), 400)
        call('POST', prefix + 'preview', token, dict(draft, amount=0), 400)
        call('POST', prefix + 'preview', token, dict(draft, employeeId=str(uuid.uuid4())), 400)
        call('POST', prefix + 'preview', token, dict(draft, mode='duration', duration=1.5), 400)
        assert call('GET', prefix + 'requests', token) == before

        key = str(uuid.uuid4())
        body = dict(draft, idempotencyKey=key, previewFingerprint=preview['fingerprint'])
        started = datetime.now(timezone.utc)
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda _: call('POST', prefix + 'requests', token, body), range(2)))
        first = responses[0]
        assert first['outcome'] == 'created'
        assert responses[1]['request']['guid'] == first['request']['guid'], 'Concurrent retries created two requests.'
        assert [d['date'] for d in first['request']['dates']] == ['2026-01-05', '2026-01-06']
        assert all(d['entitlementYear'] == 2026 for d in first['request']['dates'])
        assert all(d['status'] == 'Approved' for d in first['request']['dates'])
        created = datetime.fromisoformat(first['request']['createdAt'].replace('Z', '+00:00'))
        assert started <= created <= datetime.now(timezone.utc), 'Creation must not be backdated.'
        call('POST', prefix + 'requests', token, dict(body, endDate='2026-01-07'), 409)
        full = call('POST', prefix + 'requests', token, dict(draft, idempotencyKey=str(uuid.uuid4())))
        assert full['outcome'] == 'already-covered' and full['request'] is None
        assert len(call('GET', prefix + 'requests', token)) == len(before) + 1

        # Different submission keys race for the same new day; only one may charge it.
        partial = dict(draft, endDate='2026-01-07')
        with ThreadPoolExecutor(max_workers=2) as pool:
            races = list(pool.map(lambda _: call('POST', prefix + 'requests', token,
                                                dict(partial, idempotencyKey=str(uuid.uuid4()))), range(2)))
        assert sorted(r['outcome'] for r in races) == ['already-covered', 'created']
        saved = next(r['request'] for r in races if r['request'])
        assert [d['date'] for d in saved['dates']] == ['2026-01-07']
        dates = call('GET', prefix + 'calendar', token)
        added = [d for d in dates if d['requestGuid'] in (first['request']['guid'], saved['guid'])]
        assert sorted(d['date'] for d in added) == ['2026-01-05', '2026-01-06', '2026-01-07']
        after = call('POST', prefix + 'preview', token, dict(draft, endDate='2026-01-08'))
        assert after['amount'] == 1 and len(after['coveredDates']) == 3
        assert after['balances'][0]['used'] == preview['balances'][0]['used'] + 3
        assert after['balances'][0]['allocation'] == preview['balances'][0]['allocation']
        print('PASS: real HTTP leave validation, actor/tenant denials, inclusive range/duration, Sunday omission, finite/negative balance guards, actual UTC timestamp, concurrent replay, conflicting keys, overlap races and calendar/date charges.')
        print('Scope: disposable InMemory host; no SQL persistence or browser acceptance claim.')
    finally:
        call('DELETE', 'auth/sessions/current', token, expected=204)
        call('GET', prefix + 'requests', token, expected=401)


if __name__ == '__main__':
    main()
