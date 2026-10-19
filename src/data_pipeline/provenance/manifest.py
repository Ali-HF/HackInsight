"""
Manifest and Ingestion Verification Module.
HackInsight 2026 - Member 1: Data Engineering & Provenance.

Responsibilities:
1. Maintain cryptographic checksums (SHA-256) of all raw artifacts.
2. Record immutable provenance entries in manifest.csv and manifest.json.
3. Validate artifacts against manifest records before pipeline stages run.
"""

from typing import Dict, Any, List, Optional
from pathlib import Path
import hashlib
import json
import csv
import os
from datetime import datetime, timezone


class ManifestManager:
    """Manages raw dataset manifests, cryptographic checksums, and provenance tracking."""

    def __init__(self, manifest_path: Path, schema_path: Optional[Path] = None):
        """
        Initialize the ManifestManager.

        Args:
            manifest_path: Path to the persistent manifest.csv file.
            schema_path: Path to the JSON schema for manifest record validation.
        """
        self.manifest_path = Path(manifest_path)
        self.schema_path = Path(schema_path) if schema_path else None
        self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
        self.fieldnames = [
            "source_id",
            "source_name",
            "publisher",
            "source_url",
            "fetch_timestamp_utc",
            "raw_file_path",
            "sha256_checksum",
            "byte_size",
            "file_format",
            "license",
            "row_count",
            "query_parameters"
        ]

    def calculate_sha256(self, file_path: Path) -> str:
        """
        Compute the SHA-256 cryptographic digest of a local file in 8MB chunks.
        """
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"File not found for hash calculation: {path}")

        sha256_hash = hashlib.sha256()
        with open(path, "rb") as f:
            while chunk := f.read(8 * 1024 * 1024):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest().lower()

    def record_artifact(
        self,
        source_id: str,
        source_name: str,
        publisher: str,
        source_url: str,
        raw_file_path: Path,
        license_str: str,
        file_format: str = "text/plain",
        query_parameters: Optional[Dict[str, Any]] = None,
        row_count: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Record a newly ingested raw artifact into the manifest.
        """
        path = Path(raw_file_path)
        if not path.is_file():
            raise FileNotFoundError(f"Artifact does not exist: {path}")

        file_hash = self.calculate_sha256(path)
        byte_size = path.stat().st_size
        fetch_time = datetime.now(timezone.utc).isoformat()

        record = {
            "source_id": source_id,
            "source_name": source_name,
            "publisher": publisher,
            "source_url": source_url,
            "fetch_timestamp_utc": fetch_time,
            "raw_file_path": str(path.as_posix()),
            "sha256_checksum": file_hash,
            "byte_size": int(byte_size),
            "file_format": file_format,
            "license": license_str,
            "row_count": row_count if row_count is not None else -1,
            "query_parameters": json.dumps(query_parameters or {})
        }

        # Check if CSV exists, if not write header
        write_header = not self.manifest_path.exists() or self.manifest_path.stat().st_size == 0
        
        # Read existing records to prevent exact duplicate rows
        existing_hashes = set()
        if self.manifest_path.exists() and self.manifest_path.stat().st_size > 0:
            with open(self.manifest_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    existing_hashes.add((r.get("source_id"), r.get("sha256_checksum")))

        if (source_id, file_hash) not in existing_hashes:
            with open(self.manifest_path, "a", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=self.fieldnames)
                if write_header:
                    writer.writeheader()
                writer.writerow(record)

        return record

    def verify_artifact(self, raw_file_path: Path, expected_hash: str) -> bool:
        """
        Verify the integrity of a raw artifact against an expected SHA-256 hash.
        """
        path = Path(raw_file_path)
        if not path.is_file():
            raise FileNotFoundError(f"Cannot verify missing file: {path}")

        current_hash = self.calculate_sha256(path)
        if current_hash.lower() != expected_hash.lower():
            raise ValueError(
                f"Tamper detection failed for {path}!\n"
                f"Expected SHA-256: {expected_hash}\n"
                f"Calculated SHA-256: {current_hash}"
            )
        return True
