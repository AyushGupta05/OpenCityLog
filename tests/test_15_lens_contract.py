import json
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
LENS_SLUGS = [
    "planning-pressure",
    "planning-parcels",
    "planning-delta",
    "transport-access",
    "transport-reliability",
    "transport-speed",
    "civic-access-gaps",
    "civic-catchment",
    "civic-demand",
    "economy-land-use",
    "economy-vitality",
    "economy-gravity",
    "utilities-capacity",
    "utilities-resilience",
    "utilities-works",
]


class FifteenLensContractTests(unittest.TestCase):
    def test_generated_lens_contract_verifies(self) -> None:
        completed = subprocess.run(
            ["node", "scripts/verify_15_lens_contract.js"],
            cwd=REPO_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertIn("15-lens contract OK", completed.stdout)

    def test_verifier_rejects_lens_source_without_license_url(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            atlas = Path(tmp) / "atlas"
            write_fixture_atlas(atlas)
            sources_path = atlas / "cities" / "fixture" / "sources.json"
            sources = read_json(sources_path)
            sources["sources"][0].pop("licence_url")
            write_json(sources_path, sources)

            completed = subprocess.run(
                ["node", "scripts/verify_15_lens_contract.js", "--atlas-dir", str(atlas)],
                cwd=REPO_ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("source fixture-source missing licence_url", completed.stderr)

    def test_verifier_rejects_missing_lens(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            atlas = Path(tmp) / "atlas"
            write_fixture_atlas(atlas, lens_slugs=LENS_SLUGS[:-1])

            completed = subprocess.run(
                ["node", "scripts/verify_15_lens_contract.js", "--atlas-dir", str(atlas)],
                cwd=REPO_ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("fixture missing lens utilities-works", completed.stderr)


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_fixture_atlas(atlas: Path, lens_slugs: list[str] = LENS_SLUGS) -> None:
    source = {
        "source_id": "fixture-source",
        "title": "Fixture public source",
        "provider": "Fixture public agency",
        "source_family": "planning",
        "city_ids": ["fixture"],
        "licence": "Open Government Licence v3.0",
        "licence_url": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
        "coverage_years": {"start": 2020, "end": 2026},
        "update_frequency": "Annual",
        "url": "https://example.test/source",
        "local_paths": [],
        "reliability": "strong",
        "source_confidence": "documented",
        "attribution_text": "Fixture attribution.",
        "provenance_notes": "Fixture row-level public source.",
        "caveats": ["Fixture caveat."],
        "accessed_at": "2026-05-25",
    }
    write_json(atlas / "cities" / "fixture" / "sources.json", {
        "schema_version": "1.0.0",
        "city_id": "fixture",
        "generated_at": "2026-05-25T00:00:00Z",
        "source_count": 1,
        "sources": [source],
    })
    chunks = []
    for year in range(2007, 2027):
        events = fixture_events_for_year(year)
        write_json(atlas / "cities" / "fixture" / f"events_{year}.json", {
            "schema_version": "1.0.0",
            "city_id": "fixture",
            "year": year,
            "event_count": len(events),
            "events": events,
        })
        write_json(atlas / "cities" / "fixture" / f"events_{year}.geojson", {
            "type": "FeatureCollection",
            "features": [{"type": "Feature", "properties": {"event_id": event["event_id"]}, "geometry": event["geometry"]} for event in events],
        })
        write_json(atlas / "cities" / "fixture" / f"lens_detail_{year}.geojson", {
            "type": "FeatureCollection",
            "metadata": {
                "schema_version": "1.0.0",
                "city_id": "fixture",
                "year": year,
                "method": "Fixture lens detail file.",
                "caveats": ["Fixture evidence grids caveat.", "Aggregate records are excluded from site-like lens geometry."],
            },
            "features": [],
        })
        chunks.append({
            "year": year,
            "event_count": len(events),
            "counts_by_category": {
                "built_environment": 1,
                "transport": 1,
                "civic_services": 1,
                "economy": 1,
                "utilities": 1,
            },
            "counts_by_confidence": {"documented": len(events)},
            "counts_by_category_confidence": {
                "built_environment": {"documented": 1},
                "transport": {"documented": 1},
                "civic_services": {"documented": 1},
                "economy": {"documented": 1},
                "utilities": {"documented": 1},
            },
            "area_facet_basis": "affected_area.label",
            "area_facet_count": 1,
            "area_facets": [{
                "key": "fixture ward",
                "label": "Fixture Ward",
                "search_text": "fixture ward",
                "basis": "affected_area.label",
                "count": len(events),
                "counts_by_category": {
                    "built_environment": 1,
                    "transport": 1,
                    "civic_services": 1,
                    "economy": 1,
                    "utilities": 1,
                },
                "counts_by_confidence": {"documented": len(events)},
                "counts_by_category_confidence": {
                    "built_environment": {"documented": 1},
                    "transport": {"documented": 1},
                    "civic_services": {"documented": 1},
                    "economy": {"documented": 1},
                    "utilities": {"documented": 1},
                },
            }],
            "json_path": str(atlas / "cities" / "fixture" / f"events_{year}.json"),
            "geojson_path": str(atlas / "cities" / "fixture" / f"events_{year}.geojson"),
        })

    write_json(atlas / "cities" / "fixture" / "events.json", {
        "schema_version": "1.0.0",
        "city_id": "fixture",
        "generated_at": "2026-05-25T00:00:00Z",
        "event_count": sum(chunk["event_count"] for chunk in chunks),
        "event_years": list(range(2007, 2027)),
        "chunks": chunks,
    })

    lenses = [lens_row(slug) for slug in lens_slugs]
    write_json(atlas / "cities" / "fixture" / "city.json", {
        "schema_version": "1.0.0",
        "city_id": "fixture",
        "display_name": "Fixture City",
        "bounds": [0, 0, 1, 1],
        "default_center": [0.5, 0.5],
        "available_years": {"schema_supported_start": 2007, "schema_supported_end": 2026},
        "artifact_paths": {
            "city": str(atlas / "cities" / "fixture" / "city.json"),
            "events": str(atlas / "cities" / "fixture" / "events.json"),
            "lens_detail_template": str(atlas / "cities" / "fixture" / "lens_detail_{year}.geojson"),
            "lens_manifest": str(atlas / "cities" / "fixture" / "lens_manifest.json"),
            "lens_year_coverage": str(atlas / "cities" / "fixture" / "lens_year_coverage.json"),
        },
    })
    write_json(atlas / "cities" / "fixture" / "lens_year_coverage.json", lens_year_coverage_rows(atlas))
    write_json(atlas / "cities" / "fixture" / "lens_manifest.json", {
        "schema_version": "1.0.0",
        "artifact_kind": "bims_15_lens_city_manifest",
        "generated_at": "2026-05-25T00:00:00Z",
        "city_id": "fixture",
        "display_name": "Fixture City",
        "contract_source": "docs/15_lens_city_design_contract.md",
        "visual_reference_set": "tmp/reference-screens",
        "launched_city": True,
        "official_scope": {
            "official_boundary": {
                "label": "Fixture official boundary",
                "source_name": "Fixture boundary",
                "publisher": "Fixture public agency",
                "source_url": "https://example.test/boundary",
                "source_type": "official boundary dataset",
                "licence": "Open Government Licence v3.0",
                "licence_url": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
                "attribution_text": "Fixture boundary attribution.",
                "accessed_at": "2026-05-25",
                "source_ids": ["fixture-source"],
            },
            "admin_overlays": ["Fixture wards."],
            "scope_note": "Fixture covers the full official boundary.",
        },
        "lens_year_coverage_path": str(atlas / "cities" / "fixture" / "lens_year_coverage.json"),
        "lens_count": len(lenses),
        "lenses": lenses,
    })
    write_json(atlas / "index.json", {
        "schema_version": "1.0.0",
        "generated_at": "2026-05-25T00:00:00Z",
        "default_city_id": "fixture",
        "city_count": 1,
        "cities": [{
            "city_id": "fixture",
            "display_name": "Fixture City",
            "event_count": 15,
            "source_count": 1,
            "availability_status": "ready",
            "artifact_paths": {
                "lens_manifest": str(atlas / "cities" / "fixture" / "lens_manifest.json"),
                "lens_year_coverage": str(atlas / "cities" / "fixture" / "lens_year_coverage.json"),
                "events": str(atlas / "cities" / "fixture" / "events.json"),
                "lens_detail_template": str(atlas / "cities" / "fixture" / "lens_detail_{year}.geojson"),
            },
        }],
        "contracts": {
            "lens_manifest_schema": "schemas/lens_manifest.schema.json",
            "lens_year_coverage_schema": "schemas/lens_year_coverage.schema.json",
        },
        "lens_manifest_path": "web/data/city-atlas/lens-manifest.json",
    })
    write_json(atlas / "lens-manifest.json", {
        "schema_version": "1.0.0",
        "artifact_kind": "bims_15_lens_manifest_index",
        "generated_at": "2026-05-25T00:00:00Z",
        "contract_source": "docs/15_lens_city_design_contract.md",
        "visual_reference_set": "tmp/reference-screens",
        "lens_count": len(lenses),
        "lenses": [{"slug": slug, "public_label": slug} for slug in lens_slugs],
        "cities": [{
            "city_id": "fixture",
            "lens_count": len(lenses),
            "lens_year_coverage_path": str(atlas / "cities" / "fixture" / "lens_year_coverage.json"),
        }],
    })


def fixture_events_for_year(year: int) -> list[dict]:
    categories = [
        ("built_environment", "built_environment"),
        ("transport", "mobility"),
        ("civic_services", "civic_services"),
        ("economy", "economy"),
        ("utilities", "utilities"),
    ]
    events = []
    for index, (category, lens) in enumerate(categories):
        events.append({
            "schema_version": "1.0.0",
            "city_id": "fixture",
            "event_id": f"fixture-{year}-{category}",
            "title": f"Fixture {category} record {year}",
            "short_description": f"Fixture source-backed {category} row.",
            "year": year,
            "effective_date": f"{year}-01-01",
            "date_precision": "day",
            "source_date_field": "fixture_date",
            "category": category,
            "lens": lens,
            "geometry": {"type": "Point", "coordinates": [0.1 + index * 0.1, 0.1 + index * 0.1]},
            "affected_area": {"label": "Fixture Ward"},
            "source_ids": ["fixture-source"],
            "evidence": [{"source_id": "fixture-source", "label": "Fixture row", "kind": "source_record", "record_id": f"{year}-{category}"}],
            "confidence": "documented",
            "affected_signals": [lens],
            "explanation": "Fixture event for contract verification.",
            "caveats": ["Fixture caveat."],
            "provenance": {
                "transform": "tests/test_15_lens_contract.py#fixture_events_for_year",
                "source_record_id": f"{year}-{category}",
                "source_date_field": "fixture_date",
                "geometry_source": "fixture point",
                "geometry_precision": "fixture point",
            },
        })
    return events


def lens_year_coverage_rows(atlas: Path) -> dict:
    rows = []
    for slug in LENS_SLUGS:
        group = slug.split("-")[0]
        category = {
            "planning": "built_environment",
            "transport": "transport",
            "civic": "civic_services",
            "economy": "economy",
            "utilities": "utilities",
        }[group]
        for year in range(2007, 2027):
            rows.append({
                "city_id": "fixture",
                "display_name": "Fixture City",
                "lens_slug": slug,
                "public_label": slug,
                "group": group,
                "category": category,
                "year": year,
                "required_year": True,
                "visible_map_contract": True,
                "status": "source_backed_records",
                "event_count": 1,
                "compatible_event_count": 1,
                "detail_feature_count": 0,
                "coverage_context_feature_count": 0,
                "headline_count_included": 1,
                "headline_count_excluded_context_features": 0,
                "confidence_counts": {"documented": 1},
                "source_count": 1,
                "source_ids": ["fixture-source"],
                "compatible_source_ids": ["fixture-source"],
                "evidence_basis": "Fixture source-backed event row.",
                "map_artifacts": {
                    "events_json": str(atlas / "cities" / "fixture" / f"events_{year}.json"),
                    "events_geojson": str(atlas / "cities" / "fixture" / f"events_{year}.geojson"),
                    "lens_detail_geojson": str(atlas / "cities" / "fixture" / f"lens_detail_{year}.geojson"),
                },
                "limitations": ["Fixture caveat."],
                "exports": {
                    "markdown": True,
                    "csv": True,
                    "geojson": True,
                    "includes_uncertainty_confidence_limitations_licenses_transform_notes": True,
                },
            })
    return {
        "schema_version": "1.0.0",
        "artifact_kind": "bims_lens_year_coverage",
        "generated_at": "2026-05-25T00:00:00Z",
        "city_id": "fixture",
        "display_name": "Fixture City",
        "contract_source": "docs/15_lens_city_design_contract.md",
        "visual_reference_set": "tmp/reference-screens",
        "required_years": {"start": 2007, "end": 2026},
        "required_lens_count": 15,
        "required_row_count": 300,
        "row_count": 300,
        "status_counts": {"source_backed_records": 300},
        "rows": rows,
    }


def lens_row(slug: str) -> dict:
    group = slug.split("-")[0]
    if group == "transport":
        category = "transport"
    elif group == "civic":
        category = "civic_services"
    elif group == "economy":
        category = "economy"
    elif group == "utilities":
        category = "utilities"
    else:
        group = "planning"
        category = "built_environment"
    return {
        "slug": slug,
        "public_label": slug,
        "group": group,
        "category": category,
        "primary_selectable_object_type": "fixture source-backed object",
        "visual_metaphor": "fixture lens metaphor",
        "color_role": "fixture color role",
        "full_city_scope_required": True,
        "coverage": {
            "event_count": 1,
            "compatible_event_count": 1,
            "review_required_event_count": 0,
            "source_count": 1,
            "compatible_source_count": 1,
            "review_required_source_count": 0,
            "observed_years": {"start": 2020, "end": 2026},
            "confidence_counts": {"documented": 1},
            "caveats": ["Fixture caveat."],
            "year_contract": {
                "required_years": {"start": 2007, "end": 2026},
                "required_year_count": 20,
                "visible_year_count": 20,
                "missing_visible_years": [],
                "source_backed_record_year_count": 20,
                "source_backed_context_year_count": 0,
                "lens_year_coverage_path": "fixture/lens_year_coverage.json",
            },
        },
        "freshness": {
            "last_retrieved_or_reviewed": "2026-05-25",
            "source_coverage_period": "2020-2026",
            "update_cadence": "Annual",
        },
        "provenance": {
            "source_ids": ["fixture-source"],
            "compatible_source_ids": ["fixture-source"],
            "review_required_source_ids": [],
            "source_samples": [],
            "transformation_method": "tests/test_15_lens_contract.py#lens_row",
            "methodology_path": "docs/15_lens_source_audit.md#fixture",
            "correction_path": "CONTRIBUTING.md#correction-flow",
        },
        "exports": {
            "selected_object_markdown": True,
            "filtered_view_csv": True,
            "filtered_view_geojson": True,
            "includes_citations_licenses_dates_confidence_limitations": True,
        },
    }


if __name__ == "__main__":
    unittest.main()
