"""Generate editable architecture SVGs; optionally render PNGs with local Chrome."""
from html import escape
from pathlib import Path
import argparse
import subprocess
import tempfile
import struct

ROOT = Path(__file__).resolve().parent
INK = '#1d3038'
MUTED = '#61717b'
GREEN = '#12675e'
LINE = '#dce4e6'
parts = []


def rect(x, y, w, h, fill='white', stroke=LINE, radius=16, dashed=False):
    dash = ' stroke-dasharray="8 6"' if dashed else ''
    parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="2"{dash}/>')


def text(x, y, value, size=20, color=INK, weight=400, mono=False):
    family = 'Menlo,Consolas,monospace' if mono else 'Inter,Arial,sans-serif'
    parts.append(f'<text xml:space="preserve" x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" fill="{color}">{escape(value)}</text>')


def lines(x, y, values, size=20, color=MUTED, step=30, mono=False):
    for index, value in enumerate(values):
        text(x, y + index * step, value, size, color, mono=mono)


def arrow(x1, y1, x2, y2):
    parts.append(f'<path d="M{x1},{y1} L{x2},{y2}" fill="none" stroke="{GREEN}" stroke-width="2.5" marker-end="url(#arrow)"/>')


def start(title, subtitle, height, description):
    parts.clear()
    parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="1560" height="{height}" viewBox="0 0 1560 {height}" role="img" aria-labelledby="title desc">')
    parts.append(f'<title id="title">{escape(title)}</title><desc id="desc">{escape(description)}</desc>')
    parts.append(f'<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="{GREEN}"/></marker></defs>')
    rect(0, 0, 1560, height, '#f4f7f7', '#f4f7f7', 0)
    text(48, 48, 'vacate. / ARCHITECTURE', 18, GREEN, 700)
    rect(1230, 22, 282, 38, '#fff4df', '#e2c894', 19)
    text(1250, 47, 'ACCEPTED · 05 NOV 2026', 17, '#805615', 700)
    text(48, 105, title, 38, weight=700)
    text(48, 145, subtitle, 21, MUTED)


def finish(name, height):
    text(48, height - 40, 'Source: ADR-0005 · VAC-37 | Accepted target structure; future capabilities remain candidates.', 17, MUTED)
    parts.append('</svg>')
    (ROOT / f'{name}.svg').write_text('\n'.join(parts) + '\n')


def card(x, y, w, h, heading, body, future=False):
    rect(x, y, w, h, '#fffaf0' if future else 'white', '#d4b77e' if future else LINE, dashed=future)
    text(x + 22, y + 37, heading, 25, '#805615' if future else GREEN, 700)
    lines(x + 22, y + 78, body, 20, step=30)


def domain_map():
    height = 1220
    start('Domain & subdomain map', 'Problem space → candidate software ownership. Screens and API resources do not define bounded contexts.', height,
          'Candidate Vacate domain map: leave, people, organization and personal account capabilities; composition surfaces and future time-related candidates are separate. Leave transactions and future products are not implemented.')
    rect(48, 185, 1464, 82, '#12675e', GREEN)
    text(76, 220, 'VACATE / Workforce coordination', 28, 'white', 700)
    text(76, 249, 'Candidate business domain framing · exact bounded contexts remain subject to workflow evidence', 19, '#d8eee8')
    text(48, 310, '01  CAPABILITIES WITH EXISTING IMPLEMENTATIONS', 18, GREEN, 700)
    card(48, 332, 354, 285, 'Leave', ['Requests & history previews', 'Balances & eligibility views', 'Approval configuration', 'Transactions / decisions:', 'not implemented'])
    card(418, 332, 354, 285, 'People', ['Organization directory', 'Membership administration', 'Owns membership editing', 'Target: extract editor', 'from Organizations'])
    card(788, 332, 354, 285, 'Organization', ['Organization configuration', 'Departments & teams', 'Structure administration', 'Leave-specific settings', 'remain owned by Leave'])
    card(1158, 332, 354, 285, 'Personal account', ['Own profile', 'Display preferences', 'Target owner: profile/', 'Session lifecycle belongs', 'to technical Core'])
    text(48, 666, '02  COMPOSITION SURFACES · NOT UNIVERSAL BUSINESS OWNERS', 18, GREEN, 700)
    rect(48, 687, 1464, 115, '#e8f4ef', '#b7d8ca')
    text(74, 728, 'Calendar / availability', 24, GREEN, 700)
    text(74, 767, 'Composes permitted projections', 20)
    text(620, 728, 'Settings', 24, GREEN, 700)
    text(620, 767, 'Composes owner-provided panels', 20)
    text(1120, 728, 'Workspace', 24, GREEN, 700)
    text(1120, 767, 'Shell & navigation', 20)
    text(48, 854, '03  FUTURE CANDIDATES · NOT APPROVED IMPLEMENTATION', 18, '#805615', 700)
    card(48, 877, 475, 199, 'Time tracking / time sheets', ['Recorded work and period workflows', 'Units, correction and approval', 'semantics still need agreement'], True)
    card(542, 877, 475, 199, 'Attendance / presence', ['Meaning remains OPEN QUESTION:', 'planned presence or actual records?', 'No leave ≠ proof of presence'], True)
    card(1036, 877, 476, 199, 'Work locations', ['Planned or recorded location', 'Office / remote / other', 'Workflow and scope still open'], True)
    text(48, 1127, 'Auth UI + Core session/HTTP support every capability. Business authorization stays on the server.', 21, INK)
    finish('domain-map', height)


def matrix():
    height = 1150
    start('Angular architecture matrix', 'Each capability owns its journeys, presentation and data. Shared code stays deliberately small.', height,
          'Accepted target matrix of Leave, People, Organization and Profile capabilities with journey, presentation, data access and utility responsibilities. Composition uses public APIs, Core and Shared do not depend on features.')
    rect(48, 183, 1464, 80, '#e8f4ef', '#b7d8ca')
    text(73, 218, 'APP COMPOSITION', 18, GREEN, 700)
    text(73, 246, 'app.routes.ts + Workspace outlet · Settings panels · Calendar projections · deliberate public APIs', 21)
    columns = [(278, 'Leave'), (588, 'People'), (898, 'Organization'), (1208, 'Profile')]
    for x, title in columns:
        rect(x, 296, 294, 63, GREEN, GREEN)
        text(x + 20, 337, title, 25, 'white', 700)
    rows = [
        (379, 'JOURNEYS', 'Pages / orchestration', [
            ['Request previews', 'Balance overview', 'Leave settings'],
            ['Directory', 'Membership editor', 'Scoped interactions'],
            ['Organization settings', 'Department / team edits', 'Structure browsing'],
            ['Own profile editing', 'Display preferences', 'Save / cancel flow']]),
        (529, 'PRESENTATION', 'Owned UI', [
            ['Balance displays', 'Request fields', 'No HTTP / store access'],
            ['Directory rows', 'Membership fields', 'Inputs / outputs'],
            ['Structure views', 'Configuration fields', 'Inputs / outputs'],
            ['Profile fields', 'Preference controls', 'Inputs / outputs']]),
        (679, 'DATA ACCESS', 'State / models / mapping', [
            ['Facade + read models', 'Explicit reference adapter', 'Future commands separate'],
            ['Membership queries', 'Directory projections', 'DTO → view mappings'],
            ['Structure queries', 'Scoped mutations', 'DTO → view mappings'],
            ['Profile query / mutation', 'Preference persistence', 'Actor-scoped state']]),
        (829, 'UTILITIES', 'Only where needed', [
            ['Leave-specific formatting', 'No universal time model'],
            ['Owned helpers', 'No feature-screen imports'],
            ['Owned helpers', 'No feature-screen imports'],
            ['Owned helpers', 'No feature-screen imports']])]
    for y, heading, detail, cells in rows:
        text(48, y + 36, heading, 20, GREEN, 700)
        lines(48, y + 68, detail.split(' / '), 17, step=25)
        for (x, _), body in zip(columns, cells):
            rect(x, y, 294, 132, 'white')
            lines(x + 17, y + 37, body, 18, step=29)
    rect(48, 996, 1464, 77, '#e8edf5', '#c7d2e5')
    text(73, 1028, 'CORE: session/context + generic HTTP', 21, '#315bb9', 700)
    text(790, 1028, 'SHARED: reusable UI + date utilities', 21, '#315bb9', 700)
    text(73, 1057, 'Features consume these foundations. Neither foundation imports features. PrimeNG/CDK are evaluation candidates.', 19)
    finish('architecture-matrix', height)


def structure():
    height = 1260
    start('Angular structure & dependency direction', 'One standalone application · capability ownership · explicit public APIs · no mandatory NgModules or libraries', height,
          'Accepted target Angular tree with Core, Features and Shared. Arrows show composition depending on feature APIs, pages depending on owned data access and presentation, and data access depending on generic HTTP. PrimeNG is not adopted.')
    rect(48, 185, 674, 959, 'white')
    text(76, 227, 'TARGET SOURCE TREE', 18, GREEN, 700)
    tree = [
        'src/app/', '  app.config.ts', '  app.routes.ts', '  core/', '    http/', '    session/',
        '  features/', '    workspace/   # layout + outlet', '    auth/', '    profile/',
        '    organizations/', '    people/', '    leave/', '      leave.routes.ts',
        '      requests/', '      balances/', '      approval-settings/', '      data-access/',
        '    calendar/    # projection + UI', '    settings/    # composition',
        '  shared/', '    ui/', '    date/']
    lines(76, 271, tree, 20, INK, step=33, mono=True)
    text(76, 1084, 'Illustrative target; small features stay flat.', 20, MUTED)
    text(76, 1117, 'No parallel top-level capability folders.', 20, MUTED)
    text(766, 213, 'ARROWS MEAN “DEPENDS ON”', 18, GREEN, 700)
    card(766, 238, 746, 95, 'App / Workspace composition', ['Consumes public route and panel entry points'])
    arrow(1139, 333, 1139, 370)
    card(766, 373, 746, 95, 'Capability public API', ['Only deliberate routes, panels, facades and projections'])
    arrow(1139, 468, 1139, 505)
    card(766, 508, 746, 95, 'Owned journey / page', ['Coordinates state, mutations and presentation'])
    arrow(1000, 603, 960, 643)
    arrow(1280, 603, 1320, 643)
    card(766, 646, 361, 135, 'Owned data access', ['Signals/services + RxJS', 'DTOs, models, mappings'])
    card(1151, 646, 361, 135, 'Presentation', ['Owned or shared UI', 'Inputs / outputs only'])
    arrow(946, 781, 946, 824)
    arrow(1331, 781, 1331, 824)
    card(766, 827, 361, 135, 'Core infrastructure', ['Generic HTTP + context', 'State reset on actor change'])
    card(1151, 827, 361, 135, 'UI foundations', ['Tokens + existing controls', 'PrimeNG / CDK: evaluate'])
    rect(766, 994, 746, 150, '#fff4df', '#e2c894')
    lines(791, 1030, ['Core / Shared never import features.',
                      'Cross-feature dependencies use public APIs; no cycles.',
                      'Server owns authorization and business rules.',
                      'Folder moves do not change API contracts.'], 20, '#805615', step=29)
    text(48, 1193, 'Current source still needs the state/routing extraction. The duplicate unused scaffold has already been removed.', 20, MUTED)
    finish('angular-structure', height)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--render', action='store_true', help='Export PNG copies using local headless Chrome')
    parser.add_argument('--diagram', choices=['domain-map', 'architecture-matrix', 'angular-structure'], help='Render only the named PNG; all SVGs are regenerated')
    args = parser.parse_args()
    domain_map()
    matrix()
    structure()
    if args.render:
        chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        for name, height in [('domain-map', 1220), ('architecture-matrix', 1150), ('angular-structure', 1260)]:
            if args.diagram and name != args.diagram:
                continue
            with tempfile.TemporaryDirectory(prefix='vacate-diagrams-') as profile:
                output = ROOT / (name + '.png')
                output.unlink(missing_ok=True)
                process = subprocess.Popen([chrome, '--headless', '--disable-gpu', '--no-first-run',
                                '--no-default-browser-check', f'--user-data-dir={profile}',
                                '--hide-scrollbars', '--force-device-scale-factor=2',
                                f'--window-size=1560,{height}', f'--screenshot={ROOT / (name + ".png")}',
                                (ROOT / (name + '.svg')).as_uri()], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                try:
                    process.wait(timeout=20)
                except subprocess.TimeoutExpired:
                    # Chrome can retain background processes after writing the screenshot.
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait()
                image = output.read_bytes()
                assert image[:8] == b'\x89PNG\r\n\x1a\n', output
                assert struct.unpack('>II', image[16:24]) == (3120, height * 2), output
    print('Generated three SVG diagrams' + (' and requested PNG copies.' if args.render else '.'))


if __name__ == '__main__':
    main()
