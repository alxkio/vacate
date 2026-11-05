import importlib.util
from pathlib import Path
import sys
import unittest


spec = importlib.util.spec_from_file_location("holiday_fetch", Path(__file__).with_name("fetch-public-holidays.py"))
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)


class HolidayAcquisitionTests(unittest.TestCase):
    def payload(self, year=2026):
        return {"country": "GR", "year": year, "holidays": [
            {"date": f"{year}-01-01", "name": "New Year's Day", "type": "public"},
        ]}

    def test_normalizes_public_holiday(self):
        result = module.AboutsProvider().parse(self.payload(), "GR", 2026)
        self.assertEqual(result, [module.PublicHoliday("GR", "2026-01-01", "New Year's Day")])

    def test_rejects_wrong_country_or_year(self):
        for country, year in [("NO", 2026), ("GR", 2027)]:
            with self.subTest(country=country, year=year), self.assertRaises(ValueError):
                module.AboutsProvider().parse(self.payload(), country, year)

    def test_rejects_invalid_dates_types_names_and_duplicates(self):
        for patch in [{"date": "2027-01-01"}, {"date": "2026-02-30"}, {"type": "observance"}, {"name": " "}]:
            payload = self.payload()
            payload["holidays"][0].update(patch)
            with self.subTest(patch=patch), self.assertRaises(ValueError):
                module.AboutsProvider().parse(payload, "GR", 2026)
        payload = self.payload()
        payload["holidays"] *= 2
        with self.assertRaises(ValueError):
            module.AboutsProvider().parse(payload, "GR", 2026)

    def test_rejects_missing_coverage(self):
        payload = self.payload()
        payload["holidays"] = []
        with self.assertRaises(ValueError):
            module.AboutsProvider().parse(payload, "GR", 2026)

    def test_entire_collection_fails_on_wrong_year(self):
        with self.assertRaisesRegex(ValueError, "Requested GR/2027"):
            module.collect(module.AboutsProvider(), "GR", [2026, 2027, 2028], lambda _: self.payload())

    def test_another_adapter_uses_the_same_normalized_contract(self):
        class AlternativeProvider:
            name = "test-only"

            def url(self, country, year):
                return str(year)

            def parse(self, payload, country, year):
                return [module.PublicHoliday(country, f"{year}-12-25", "Christmas")]

        result = module.collect(AlternativeProvider(), "GR", [2027], lambda _: {})
        self.assertEqual(result["holidays"][0]["country_code"], "GR")
        self.assertEqual(result["provider"], "test-only")


if __name__ == "__main__":
    unittest.main()
