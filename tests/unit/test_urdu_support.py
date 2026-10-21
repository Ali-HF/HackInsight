"""
Unit tests for Bilingual Urdu Support in Insight Agent and Advisories.
HackInsight 2026 - Bilingual Health Advisories.
"""

import unittest
from src.insight_agent.interface import answer_question
from src.insight_agent.urdu_translator import get_aqi_category_info, translate_to_urdu


class TestUrduBilingualSupport(unittest.TestCase):
    """Test Urdu translations, health advisory categories, and agent language parameter."""

    def test_get_aqi_category_info_bilingual(self):
        # Good (<12)
        info_en = get_aqi_category_info(10.0, lang="en")
        info_ur = get_aqi_category_info(10.0, lang="ur")
        self.assertEqual(info_en["category"], "Good")
        self.assertIn("اچھا", info_ur["category"])

        # Hazardous (>250)
        haz_en = get_aqi_category_info(300.0, lang="en")
        haz_ur = get_aqi_category_info(300.0, lang="ur")
        self.assertIn("Smog Emergency", haz_en["category"])
        self.assertIn("اسموگ ایمرجنسی", haz_ur["category"])
        self.assertIn("پنجاب کلین ایئر ایکشن پلان", haz_ur["advisory"])

    def test_agent_answer_urdu_forecast(self):
        res = answer_question("What is the forecast for Lahore?", language="ur")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["language"], "ur")
        self.assertIn("لاہور", res["answer"])
        self.assertIn("PM2.5", res["answer"])
        # Factual values must be preserved
        self.assertIn("118.26", res["answer"])

    def test_agent_unsupported_city_urdu(self):
        res = answer_question("What is the air quality in Peshawar?", language="ur")
        self.assertEqual(res["status"], "unsupported")
        self.assertEqual(res["language"], "ur")
        self.assertIn("معذرت", res["answer"])
        self.assertIn("پشاور", res["answer"])

    def test_agent_out_of_scope_urdu(self):
        res = answer_question("Who won the cricket match?", language="ur")
        self.assertEqual(res["status"], "out_of_scope")
        self.assertEqual(res["language"], "ur")
        self.assertIn("دائرہ کار سے باہر", res["answer"])


if __name__ == "__main__":
    unittest.main()
