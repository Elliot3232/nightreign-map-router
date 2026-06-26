# Data Contribution Guidelines

This project depends on accurate map, POI, boss, and route-planning data. Data
changes should be small, source-backed, and easy to verify.

## What to Contribute

Good first data contributions include:

- Layout validation and data-quality tooling.
- POI, boss, Nightlord, Nightfarer, and mechanic aliases.
- Normalized entity metadata such as canonical names, categories, and source URLs.
- Route scoring rules that can be traced to game mechanics or measured gameplay.
- Documentation that explains how data files are generated or verified.

Avoid submitting large unreviewed data dumps. Prefer a small representative set
first, then expand after the data shape is agreed.

## Source and Attribution Rules

- Include a source URL or provenance note for facts derived from external
  references.
- Do not copy full guide text, wiki article bodies, forum posts, or other
  copyrighted prose into this repository.
- Do not add extracted game assets unless the contribution follows the existing
  non-commercial fan-project disclaimer and asset handling practices.
- Keep player reports, forum claims, or low-confidence observations marked as
  unverified unless they are confirmed against gameplay or a stronger source.

Recommended fact shape:

```json
{
  "entityId": "nightlord.gladius",
  "canonicalName": "Gladius",
  "aliases": ["Gladius Beast of Night", "三头犬", "格拉狄乌斯"],
  "category": "Nightlord",
  "sourceUrls": ["https://example.com/source-page"],
  "confidence": "verified"
}
```

## Pull Request Checklist

Before opening a data PR:

1. Explain the data source and what was intentionally excluded.
2. Keep the diff focused on one data area or one tool.
3. Add or update validation when possible.
4. Run `npm run validate:layouts` if the change touches layout or coordinate
   data.
5. Run `npm run typecheck` for TypeScript-facing data shape changes.

## Validation Philosophy

Validation scripts should catch structural problems without encoding uncertain
gameplay assumptions. Prefer checks such as:

- Expected file counts and sequential layout numbers.
- Required fields and known enum values.
- Object shapes for layout entries.
- Coordinate tuple format and duplicate IDs.
- Source URL presence for derived factual data.

Gameplay strategy, route scoring, and priority values should be documented with
their assumptions so they can be tuned over time.
