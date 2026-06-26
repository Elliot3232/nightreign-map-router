#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const layoutDir = path.join(repoRoot, "reference_material", "pattern_layouts");
const poiCoordinatePath = path.join(
  repoRoot,
  "public",
  "assets",
  "maps",
  "poi_coordinates_with_ids.json",
);

const expectedLayoutCount = 320;
const requiredTopLevelFields = [
  "Layout Number",
  "Nightlord",
  "Shifting Earth",
  "Spawn Point",
  "Special Event",
  "Night 1 Boss",
  "Night 2 Boss",
  "Extra Night Boss",
  "Night 1 Circle",
  "Night 2 Circle",
];

const validNightlords = new Set([
  "Gladius",
  "Adel",
  "Gnoster",
  "Fulghor",
  "Caligo",
  "Heolstor",
  "Libra",
  "Maris",
]);

const validShiftingEarthEvents = new Set([
  "Default",
  "Crater",
  "Mountaintop",
  "Rotted Woods",
  "Noklateo",
]);

const issues = [];
const warnings = [];

function addIssue(file, message) {
  issues.push(`${file}: ${message}`);
}

function addWarning(file, message) {
  warnings.push(`${file}: ${message}`);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    addIssue(
      path.relative(repoRoot, filePath),
      `Invalid JSON (${error.message})`,
    );
    return null;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateCoordinateTuple(file, label, value) {
  if (!Array.isArray(value) || value.length !== 2) {
    addIssue(file, `${label} must be a two-item coordinate tuple`);
    return;
  }

  const [x, y] = value;
  if (typeof x !== "number" || typeof y !== "number") {
    addIssue(file, `${label} must contain numeric x/y values`);
  }
}

function validateLayoutFile(fileName) {
  const filePath = path.join(layoutDir, fileName);
  const layout = readJson(filePath);
  if (!isPlainObject(layout)) {
    addIssue(fileName, "Layout file must contain a JSON object");
    return;
  }

  const numberMatch = /^layout_(\d{3})\.json$/.exec(fileName);
  if (!numberMatch) {
    addIssue(fileName, "Layout filename must match layout_###.json");
    return;
  }

  const layoutNumber = Number(numberMatch[1]);
  const expectedLayoutNumber = String(layoutNumber);
  if (layout["Layout Number"] !== expectedLayoutNumber) {
    addIssue(
      fileName,
      `Layout Number should be "${expectedLayoutNumber}", found ${JSON.stringify(
        layout["Layout Number"],
      )}`,
    );
  }

  for (const field of requiredTopLevelFields) {
    if (typeof layout[field] !== "string" || layout[field].trim() === "") {
      addIssue(fileName, `Missing or invalid top-level field "${field}"`);
    }
  }

  if (!validNightlords.has(layout.Nightlord)) {
    addIssue(fileName, `Unknown Nightlord "${layout.Nightlord}"`);
  }

  if (!validShiftingEarthEvents.has(layout["Shifting Earth"])) {
    addIssue(
      fileName,
      `Unknown Shifting Earth value "${layout["Shifting Earth"]}"`,
    );
  }

  for (const [key, value] of Object.entries(layout)) {
    if (!isPlainObject(value)) {
      continue;
    }

    if (typeof value.location !== "string" || value.location.trim() === "") {
      addIssue(fileName, `${key}.location must be a non-empty string`);
    }

    if (typeof value.value !== "string" || value.value.trim() === "") {
      addIssue(fileName, `${key}.value must be a non-empty string`);
    }
  }
}

function validateLayoutSet() {
  if (!fs.existsSync(layoutDir)) {
    addIssue("reference_material/pattern_layouts", "Directory does not exist");
    return;
  }

  const layoutFiles = fs
    .readdirSync(layoutDir)
    .filter((fileName) => /^layout_\d{3}\.json$/.test(fileName))
    .sort();

  if (layoutFiles.length !== expectedLayoutCount) {
    addIssue(
      "reference_material/pattern_layouts",
      `Expected ${expectedLayoutCount} layout files, found ${layoutFiles.length}`,
    );
  }

  const seenNumbers = new Set();
  for (const fileName of layoutFiles) {
    const layoutNumber = Number(fileName.match(/^layout_(\d{3})\.json$/)[1]);
    if (seenNumbers.has(layoutNumber)) {
      addIssue(fileName, `Duplicate layout number ${layoutNumber}`);
    }
    seenNumbers.add(layoutNumber);
    validateLayoutFile(fileName);
  }

  for (
    let layoutNumber = 1;
    layoutNumber <= expectedLayoutCount;
    layoutNumber += 1
  ) {
    if (!seenNumbers.has(layoutNumber)) {
      addIssue(
        "reference_material/pattern_layouts",
        `Missing layout_${String(layoutNumber).padStart(3, "0")}.json`,
      );
    }
  }
}

function validateMasterPoiCoordinates() {
  const relativePath = path.relative(repoRoot, poiCoordinatePath);
  const coordinates = readJson(poiCoordinatePath);
  if (!Array.isArray(coordinates)) {
    addIssue(relativePath, "Expected an array of POI coordinate records");
    return;
  }

  const seenIds = new Set();
  for (const [index, record] of coordinates.entries()) {
    const label = `record ${index + 1}`;
    if (!isPlainObject(record)) {
      addIssue(relativePath, `${label} must be an object`);
      continue;
    }

    if (!Number.isInteger(record.id) || record.id <= 0) {
      addIssue(relativePath, `${label}.id must be a positive integer`);
    } else if (seenIds.has(record.id)) {
      addIssue(relativePath, `Duplicate POI id ${record.id}`);
    } else {
      seenIds.add(record.id);
    }

    validateCoordinateTuple(
      relativePath,
      `${label}.coordinates`,
      record.coordinates,
    );
  }

  if (coordinates.length === 0) {
    addWarning(relativePath, "No POI coordinate records found");
  }
}

validateLayoutSet();
validateMasterPoiCoordinates();

if (warnings.length > 0) {
  console.warn(
    `Layout validation completed with ${warnings.length} warning(s):`,
  );
  for (const warning of warnings) {
    console.warn(`  - ${warning}`);
  }
}

if (issues.length > 0) {
  console.error(`Layout validation failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`  - ${issue}`);
  }
  process.exit(1);
}

console.log(
  `Layout validation passed: ${expectedLayoutCount} layouts and master POI coordinates are structurally valid.`,
);
