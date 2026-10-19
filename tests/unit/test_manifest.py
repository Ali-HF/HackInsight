"""
Unit tests for ManifestManager and Artifact Integrity.
HackInsight 2026 - Member 1 Testing Suite.
"""

import unittest
import hashlib
import tempfile
import shutil
from pathlib import Path
from src.data_pipeline.provenance.manifest import ManifestManager


class TestManifestManager(unittest.TestCase):
    """Verifies SHA-256 computation, manifest recording, and tamper detection."""

    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp())
        self.manifest_file = self.test_dir / "manifest.csv"
        self.manager = ManifestManager(manifest_path=self.manifest_file)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_calculate_sha256(self):
        """Verify that calculate_sha256 computes accurate hashes on known content."""
        test_file = self.test_dir / "sample_artifact.txt"
        content = b"HackInsight 2026 - Test Data Artifact"
        test_file.write_bytes(content)
        
        expected_hash = hashlib.sha256(content).hexdigest()
        computed_hash = self.manager.calculate_sha256(test_file)
        self.assertEqual(computed_hash, expected_hash)

    def test_record_and_verify_artifact(self):
        """Verify recording an artifact to manifest and verifying its integrity."""
        test_file = self.test_dir / "sample.csv"
        test_file.write_bytes(b"col1,col2\n1,2\n")
        
        record = self.manager.record_artifact(
            source_id="SRC-TEST",
            source_name="Test Source",
            publisher="Test Publisher",
            source_url="https://example.com/data",
            raw_file_path=test_file,
            license_str="MIT",
            file_format="text/csv",
            row_count=1
        )
        
        self.assertTrue(self.manifest_file.exists())
        self.assertEqual(record["source_id"], "SRC-TEST")
        self.assertTrue(self.manager.verify_artifact(test_file, record["sha256_checksum"]))

    def test_verify_artifact_tamper_detection(self):
        """Verify that verify_artifact raises ValueError on tampered content."""
        test_file = self.test_dir / "tampered_artifact.txt"
        test_file.write_bytes(b"Original Content")
        
        with self.assertRaises(ValueError):
            self.manager.verify_artifact(test_file, expected_hash="0" * 64)


if __name__ == "__main__":
    unittest.main()
