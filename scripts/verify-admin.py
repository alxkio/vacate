#!/usr/bin/env python3
"""Mutating administrator acceptance against disposable local fictional InMemory data."""
import argparse
from datetime import datetime, timezone
import json
import urllib.error
import urllib.parse
import urllib.request
import uuid


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--api-base-url', default='http://127.0.0.1:7073/api')
    args = parser.parse_args()
    base = args.api_base_url.rstrip('/') + '/'
    assert urllib.parse.urlparse(base).hostname in ('localhost', '127.0.0.1', '::1'), 'Use a disposable local API.'
    today = datetime.now(timezone.utc).date().isoformat()
    assert '2026-11-10' <= today <= '2026-12-14', (
        'This seeded 2026 acceptance fixture requires November 9 to be past and December 14 pending; refresh fixture dates/allowances before reuse.', today)
    company = '20000000-0000-4000-8000-000000000100'
    root = f'organizations/{company}'
    admin = root + '/admin'

    def call(method, path, token=None, body=None, expected=200):
        request = urllib.request.Request(base + path, method=method,
            headers={'Content-Type': 'application/json', **({'Authorization': 'Bearer ' + token} if token else {})},
            data=json.dumps(body).encode() if body is not None else None)
        try:
            response = urllib.request.urlopen(request, timeout=30)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            payload = response.read()
            data = json.loads(payload) if payload else None
            accepted = expected if isinstance(expected, tuple) else (expected,)
            assert response.status in accepted, (method, path, response.status, data)
            assert response.headers.get('Cache-Control') == 'no-store'
            return data

    def login(alias):
        token = call('POST', 'auth/sessions', body={'username': alias, 'password': alias})['accessToken']
        own = call('GET', 'auth/sessions/current', token)
        assert own['profile']['username'].endswith('@example.invalid'), 'Fictional accounts required.'
        return token, own['profile']['guid']

    nora, nora_id = login('nora')
    daria, daria_id = login('daria')
    maya, maya_id = login('maya')
    ravi, ravi_id = login('ravi')

    def assign(scope, scope_id, person):
        return call('PUT', admin + '/approvers', nora,
            {'scope': scope, 'scopeGuid': scope_id, 'approverGuid': person})

    def request(token, start, end=None, duration=None):
        draft = {'leaveTypeId': 'annual', 'unit': 'days', 'mode': 'duration' if duration else 'range',
                 'startDate': start, **({'duration': duration} if duration else {'endDate': end or start})}
        preview = call('POST', root + '/leave/preview', token, draft)
        assert preview['canSubmit'], preview
        return call('POST', root + '/leave/requests', token,
            {**draft, 'idempotencyKey': str(uuid.uuid4()), 'previewFingerprint': preview['fingerprint']})['request']

    def inbox(token):
        return call('GET', admin + '/approvals', token)

    def decide(token, record, decision='approve', expected=200):
        return call('POST', admin + f'/approvals/{record["guid"]}/decision', token, {'decision': decision}, expected)

    def personnel():
        return {p['userGuid']: p for p in call('GET', admin + '/personnel?year=2026', nora)}

    for endpoint in ('calendar', 'approvals', 'personnel?year=2026'):
        call('GET', admin + '/' + endpoint, maya, expected=(403, 404))
        call('GET', admin + '/' + endpoint, expected=401)
    call('POST', admin + '/holidays', maya, {'name': 'Denied', 'month': 10, 'day': 1}, expected=(403, 404))
    call('PUT', admin + '/approvers', nora,
         {'scope': 'organization', 'scopeGuid': company, 'approverGuid': maya_id}, expected=400)

    call('POST', admin + '/holidays', nora, {'name': 'Invalid date', 'month': 2, 'day': 30}, expected=400)
    leap = call('POST', admin + '/holidays', nora, {'name': 'Leap-only fixture', 'month': 2, 'day': 29})
    assert leap['createdAt'] == leap['updatedAt'] and leap['deletedAt'] is None
    call('POST', admin + '/holidays', nora, {'name': 'Duplicate', 'month': 2, 'day': 29}, expected=409)
    past = request(maya, '2026-11-09')
    call('POST', admin + '/holidays', nora, {'name': 'New holiday after saved leave', 'month': 11, 'day': 9})
    assert next(r for r in call('GET', root + '/leave/requests', maya) if r['guid'] == past['guid'])['dates'] == past['dates']
    call('POST', admin + '/holidays', nora, {'name': 'December fixture holiday', 'month': 12, 'day': 15})
    holiday_preview = call('POST', root + '/leave/preview', maya,
        {'leaveTypeId': 'annual', 'unit': 'days', 'mode': 'range', 'startDate': '2026-12-14', 'endDate': '2026-12-16'})
    assert holiday_preview['workingDates'] == ['2026-12-14', '2026-12-16']

    technology = '20000000-0000-4000-8000-000000000300'
    applications = '20000000-0000-4000-8000-000000000401'
    assign('organization', company, nora_id)
    assign('department', technology, daria_id)
    assign('team', applications, nora_id)
    maya_record = request(maya, '2026-12-14', '2026-12-16')
    ravi_record = request(ravi, '2026-12-18')
    assert all(d['status'] == 'Pending' for r in (maya_record, ravi_record) for d in r['dates'])
    assert any(r['requestGuid'] == maya_record['guid'] for r in inbox(nora))
    assert any(r['requestGuid'] == ravi_record['guid'] for r in inbox(daria))
    decide(daria, maya_record, expected=404)
    assign('team', applications, None)
    assert any(r['requestGuid'] == maya_record['guid'] for r in inbox(daria))
    decide(nora, maya_record, expected=404)
    assign('department', technology, None)
    assert any(r['requestGuid'] == maya_record['guid'] for r in inbox(nora))
    before = personnel()
    approved = decide(nora, maya_record)
    assert all(d['status'] == 'Approved' for d in approved['dates']) and approved['decidedAt']
    assert personnel()[maya_id]['used'] == before[maya_id]['used'] + 2
    decide(nora, maya_record, expected=409)
    declined = decide(nora, ravi_record, 'decline')
    assert all(d['status'] == 'Declined' for d in declined['dates'])
    assert personnel()[ravi_id]['used'] == before[ravi_id]['used']
    self_record = request(nora, '2026-12-21')
    decide(nora, self_record)
    assign('organization', company, daria_id)
    historic = next(r for r in call('GET', root + '/leave/requests', maya) if r['guid'] == maya_record['guid'])
    assert historic['approverGuid'] == nora_id and historic['decidedAt'] == approved['decidedAt']

    before = personnel()
    noncharge = {'name': 'Non-deducting fixture closure', 'startDate': '2026-12-23', 'endDate': '2026-12-23', 'deductAnnualLeave': False}
    preview = call('POST', admin + '/closures/preview', nora, noncharge)
    assert any(r['outcome'] == 'recorded' for r in preview['results'])
    key = str(uuid.uuid4())
    saved = call('POST', admin + '/closures', nora, {**noncharge, 'idempotencyKey': key})
    assert saved['createdAt'] == saved['updatedAt'] and saved['deletedAt'] is None
    assert call('POST', admin + '/closures', nora, {**noncharge, 'idempotencyKey': key})['guid'] == saved['guid']
    after = personnel()
    assert {p: (r['used'], r['pending'], r['available']) for p, r in before.items()} == {p: (r['used'], r['pending'], r['available']) for p, r in after.items()}
    for person in after.values():
        generated = [r for r in person['requests'] if r.get('closureGuid') == saved['guid']]
        result = next(r for r in saved['results'] if r['userGuid'] == person['userGuid'])
        assert len(generated) == (1 if result['outcome'] == 'recorded' else 0)
        for record in generated:
            assert record['source'] == 'CompanyClosure' and record['leaveTypeId'] == 'company-closure'
            assert record['dates'] == [{'date': '2026-12-23', 'status': 'Approved', 'entitlementYear': 2026}]
    assert any(r['source'] == 'CompanyClosure' and r['leaveTypeId'] == 'company-closure' for r in after[maya_id]['requests'])
    call('POST', admin + '/closures', nora, {**noncharge, 'name': 'Changed draft', 'idempotencyKey': key}, expected=409)
    deduct = {'name': 'Partial annual fixture closure', 'startDate': '2026-12-01', 'endDate': '2026-12-31', 'deductAnnualLeave': True}
    saved = call('POST', admin + '/closures', nora, {**deduct, 'idempotencyKey': str(uuid.uuid4())})
    assert any(r['outcome'] == 'recorded' for r in saved['results'])
    assert any(r['outcome'] == 'skipped' and 'balance' in r['reason'].lower() for r in saved['results'])
    final = personnel()
    assert all(r['available'] is None or r['available'] >= 0 for r in final.values())
    for result in saved['results']:
        if result['outcome'] == 'skipped':
            assert final[result['userGuid']]['used'] == after[result['userGuid']]['used']
    assert all('family' not in str(p).lower() and 'soleCare' not in str(p) for p in final.values())
    foreign = call('POST', 'organizations', daria, {'name': 'Other fictional company'}, expected=201)['guid']
    call('GET', f'organizations/{foreign}/admin/calendar', nora, expected=404)
    call('PUT', admin + '/approvers', nora, {'scope': 'organization', 'scopeGuid': foreign, 'approverGuid': nora_id}, expected=400)
    print('PASS: real HTTP administrator isolation, recurring/leap holiday validation, immutable history, scope inheritance/rerouting, assigned/self decisions, accounting, closure partial success/replay and UTC lifecycle.')


if __name__ == '__main__':
    main()
