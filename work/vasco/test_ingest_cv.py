import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from ingest_cv import affinity_score, extract_triples, parse_args, slug


class IngestCvTest(unittest.TestCase):
    def test_slug_is_contract_compatible(self):
        self.assertEqual(slug("Inês da Silva"), "ines-da-silva")

    def test_extracts_and_deduplicates_cv_facts(self):
        text = """Product Manager using Python, pandas and SQL.
Company: Acme Labs
Python and leadership are used daily.
"""
        triples = extract_triples("Inês da Silva", text)
        facts = {(row["predicate"], row["object"]) for row in triples}
        self.assertIn(("HAS_SKILL", "skill:python"), facts)
        self.assertIn(("HAS_SKILL", "skill:sql"), facts)
        self.assertIn(("HAS_SKILL", "skill:leadership"), facts)
        self.assertIn(("HELD_ROLE", "role:product-manager"), facts)
        self.assertIn(("WORKED_AT", "company:acme-labs"), facts)
        self.assertEqual(len(facts), len(triples))

    def test_cli_accepts_a_cv_directory_without_person(self):
        with tempfile.TemporaryDirectory() as folder, patch(
            "sys.argv", ["ingest_cv.py", folder, "--database", "seed.xlsx", "--html-template", "graph.html"]
        ):
            self.assertEqual(parse_args().cv, Path(folder))

    def test_affinity_is_weighted_overlap_percentage(self):
        left = {"all_might": {
            "personality": {"tag:curious": 0.6, "tag:wise": 0.4},
            "power": {"tag:solver": 1.0},
            "character": {},
        }}
        right = {"all_might": {
            "personality": {"tag:curious": 0.3, "tag:wise": 0.2, "tag:logic": 0.5},
            "power": {"tag:solver": 0.4, "tag:leader": 0.6},
            "character": {},
        }}
        self.assertEqual(affinity_score(left, right), 45.0)


if __name__ == "__main__":
    unittest.main()
