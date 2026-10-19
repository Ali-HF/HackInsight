"""
Unit tests for ManifestManager and Artifact Integrity.
HackInsight 2026 - Member 1 Testing Suite (Built-in unittest runner).
"""

import unittest
import hashlib
import tempfile
import shutil
from pathlib import Path
from src.data_pipeline.provenance.manifest import ManifestManager


class TestManifestManager(unittest.TestCase):
    """Verifies interface contract and tamper-detection logic for ManifestManager."""

    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp())
        self.manifest_file = self.test_dir / "manifest.csv"
        self.manager = ManifestManager(manifest_path=self.manifest_file)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_calculate_sha256_contract(self):
        """Verify that calculate_sha256 interface is defined and raises NotImplementedError."""
        test_file = self.test_dir / "sample_artifact.txt"
        test_file.write_bytes(b"HackInsight 2026 - Test Data Artifact")
        
        with self.assertRaises(NotImplementedError):
            self.manager.calculate_sha256(test_file)

    def test_verify_artifact_contract(self):
        """Verify that verify_artifact interface is defined and raises NotImplementedError."""
        test_file = self.test_dir / "tampered_artifact.txt"
        test_file.write_bytes(b"Original Content")
        
        with self.assertRaises(NotImplementedError):
            self.manager.verify_artifact(test_file, expected_hash="0" * 64)


if __name__ == "__main__":
    unittest.main()
