"""One-time reference-data acquisition; no database writes or scheduled integration."""

import argparse
from dataclasses import asdict, dataclass
from datetime import date, datetime, timezone
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urlencode


@dataclass(frozen=True)
class PublicHoliday:
    country_code: str
    date: str
    name: str


class AboutsProvider:
    name = "holidays.abouts.co"

    def url(self, country, year):
        query = urlencode({"country": country, "year": year, "type": "public"})
        return f"https://holidays.abouts.co/api/v1/holidays?{query}"

    def parse(self, payload, country, year):
        # Verify both the envelope and every date: a successful HTTP response can be for the wrong year.
        metadata = payload.get("meta", {})
        actual_country = payload.get("country", metadata.get("country"))
        actual_year = payload.get("year", metadata.get("year"))
        if actual_country != country or actual_year != year:
            raise ValueError(f"Requested {country}/{year}; provider returned {actual_country}/{actual_year}")
        items = payload.get("holidays")
        if not isinstance(items, list) or not items:
            raise ValueError("Missing or empty holiday coverage requires review")
        result = []
        seen = set()
        for item in items:
            if item.get("type") != "public":
                raise ValueError("Public-only response contains a different holiday type")
            raw_date = item.get("date", "")
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw_date) or date.fromisoformat(raw_date).year != year:
                raise ValueError(f"Invalid/out-of-year holiday date: {raw_date}")
            name = item.get("name")
            if not isinstance(name, str) or not name.strip() or len(name) > 200:
                raise ValueError("Invalid holiday name")
            if raw_date in seen:
                raise ValueError(f"Duplicate holiday date requires review: {raw_date}")
            seen.add(raw_date)
            result.append(PublicHoliday(country, raw_date, name.strip()))
        return sorted(result, key=lambda holiday: holiday.date)


# Add an adapter here to replace the provider; normalized rows and later DB import stay independent.
PROVIDERS = {"abouts": AboutsProvider}


def collect(provider, country, years, fetch):
    holidays = []
    sources = []
    for year in years:
        url = provider.url(country, year)
        holidays.extend(provider.parse(fetch(url), country, year))
        sources.append(url)
    return {
        "schema_version": 1,
        "provider": provider.name,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "country_code": country,
        "years": years,
        "source_urls": sources,
        "review_status": "unreviewed",
        "holidays": [asdict(holiday) for holiday in holidays],
    }


def fetch_json(url):
    # System curl uses the operator's TLS trust; never disable certificate verification.
    response = subprocess.run(
        ["curl", "--fail", "--silent", "--show-error", "--location", "--max-time", "30", url],
        check=True, capture_output=True, text=True,
    )
    return json.loads(response.stdout)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--provider", choices=PROVIDERS, default="abouts")
    parser.add_argument("--country", default="GR")
    parser.add_argument("--years", type=int, nargs="+", default=[2026, 2027, 2028])
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Z]{2}", args.country) or len(set(args.years)) != len(args.years):
        parser.error("Use an uppercase two-letter country and unique years")
    if args.output.exists():
        parser.error("Output exists; choose a new file to preserve earlier acquisition evidence")
    result = collect(PROVIDERS[args.provider](), args.country, args.years, fetch_json)
    # No partial output: all requested years must validate before an import artifact exists.
    with args.output.open("x", encoding="utf-8") as output:
        json.dump(result, output, ensure_ascii=False, indent=2)
        output.write("\n")
    print(f"Fetched {len(result['holidays'])} unreviewed holidays; database unchanged")


if __name__ == "__main__":
    main()
