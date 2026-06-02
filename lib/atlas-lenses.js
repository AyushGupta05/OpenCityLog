"use strict";

const LENS_DEFINITIONS = [
  {
    slug: "planning-pressure",
    label: "Planning Activity",
    group: "planning",
    category: "built_environment",
    primary_object_type: "planning or built-change evidence record",
    visual_metaphor: "planning pressure field",
    color_role: "planning red/orange activity field",
    methodology_anchor: "planning-activity",
  },
  {
    slug: "planning-parcels",
    label: "Development Sites",
    group: "planning",
    category: "built_environment",
    primary_object_type: "development site, parcel, or permit record",
    visual_metaphor: "parcel-stage mosaic",
    color_role: "stage colors for proposed, permitted, construction, completion, and uncertainty",
    methodology_anchor: "development-sites",
  },
  {
    slug: "planning-delta",
    label: "Built Change",
    group: "planning",
    category: "built_environment",
    primary_object_type: "built-form or designation change record",
    visual_metaphor: "built delta cells and site markers",
    color_role: "before/current/delta built-form colors",
    methodology_anchor: "built-change",
  },
  {
    slug: "transport-access",
    label: "Access to Transport",
    group: "transport",
    category: "transport",
    primary_object_type: "transport access record",
    visual_metaphor: "access bands and network context",
    color_role: "transport teal with access band colors",
    methodology_anchor: "access-to-transport",
  },
  {
    slug: "transport-reliability",
    label: "Service Reliability",
    group: "transport",
    category: "transport",
    primary_object_type: "service disruption, route, or transport record",
    visual_metaphor: "service reliability threads",
    color_role: "line style and status colors for disruption confidence",
    methodology_anchor: "service-reliability",
  },
  {
    slug: "transport-speed",
    label: "Transport Activity",
    group: "transport",
    category: "transport",
    primary_object_type: "road activity or transport context record",
    visual_metaphor: "route and corridor traces",
    color_role: "green to red observed activity and delay-context colors",
    methodology_anchor: "journey-speed",
  },
  {
    slug: "civic-access-gaps",
    label: "Service Coverage Context",
    group: "civic",
    category: "civic_services",
    primary_object_type: "public service record or coverage evidence cell",
    visual_metaphor: "coverage context cells",
    color_role: "civic amber with confidence and coverage strokes",
    methodology_anchor: "public-service-gaps",
  },
  {
    slug: "civic-catchment",
    label: "Service Catchments",
    group: "civic",
    category: "civic_services",
    primary_object_type: "service facility or catchment evidence cell",
    visual_metaphor: "service catchment cells",
    color_role: "catchment coverage bands by service family",
    methodology_anchor: "service-catchments",
  },
  {
    slug: "civic-demand",
    label: "Service Context",
    group: "civic",
    category: "civic_services",
    primary_object_type: "service context or civic incident record",
    visual_metaphor: "service context grid",
    color_role: "service-context bands with confidence cues",
    methodology_anchor: "service-demand",
  },
  {
    slug: "economy-land-use",
    label: "Land Use",
    group: "economy",
    category: "economy",
    primary_object_type: "land-use, property, business, or zoning record",
    visual_metaphor: "land-use evidence tiles",
    color_role: "land-use class colors",
    methodology_anchor: "land-use",
  },
  {
    slug: "economy-vitality",
    label: "High Street Activity",
    group: "economy",
    category: "economy",
    primary_object_type: "business, frontage, food hygiene, or property activity record",
    visual_metaphor: "street-front activity ribbons",
    color_role: "economy purple with activity ribbons",
    methodology_anchor: "high-street-activity",
  },
  {
    slug: "economy-gravity",
    label: "Economic Context Links",
    group: "economy",
    category: "economy",
    primary_object_type: "economic anchor, property, employment, or visitor context record",
    visual_metaphor: "economic context nodes and links",
    color_role: "economic context node and link colors",
    methodology_anchor: "economic-pull",
  },
  {
    slug: "utilities-capacity",
    label: "Utility Context",
    group: "utilities",
    category: "utilities",
    primary_object_type: "utility asset, work, or network-context record",
    visual_metaphor: "utility network traces and context assets",
    color_role: "utility teal with asset and status symbols",
    methodology_anchor: "utility-capacity",
  },
  {
    slug: "utilities-resilience",
    label: "Utility Network Context",
    group: "utilities",
    category: "utilities",
    primary_object_type: "utility risk, incident, or network context record",
    visual_metaphor: "network context hierarchy",
    color_role: "network-context line styles with risk cues",
    methodology_anchor: "network-resilience",
  },
  {
    slug: "utilities-works",
    label: "Utility Works",
    group: "utilities",
    category: "utilities",
    primary_object_type: "utility work, permit, or streetworks record",
    visual_metaphor: "utility works traces and work glyphs",
    color_role: "works status colors and non-color line styles",
    methodology_anchor: "utility-works",
  },
];

const LENS_SLUGS = LENS_DEFINITIONS.map((lens) => lens.slug);

const GROUP_PATTERNS = {
  planning: /planning|building|permit|zoning|development|architecture|heritage|housing|certificate|design_review|parcel_geometry|listed|brownfield|land[-_\s]?use/i,
  transport: /transport|transit|traffic|street_network|road|mta|tfl|translink|dft|dot|collisions|journey|bus|rail|cycle/i,
  civic: /civic|education|healthcare?|public_facilities|service_requests|cultural|libraries|public_housing|demographics|police|food hygiene|fire|school|hospital|clinic/i,
  economy: /economy|property|food|business|jobs|commercial|retail|valuation|sales|hpi|price|land registry|voa|companies|employment|floor.?space/i,
  utilities: /utilities|utility|energy|water|electric|power|street.?works|sewer|infrastructure|substation|network|flood/i,
};

const GROUP_CATEGORY = {
  planning: "built_environment",
  transport: "transport",
  civic: "civic_services",
  economy: "economy",
  utilities: "utilities",
};

const GROUP_SIGNALS = {
  planning: new Set(["built_environment", "city_change"]),
  transport: new Set(["mobility", "traffic"]),
  civic: new Set(["civic_services", "services"]),
  economy: new Set(["economic_opportunity", "jobs", "economy"]),
  utilities: new Set(["utilities", "electricity"]),
};

function sourceTextForEvent(event, sourceById) {
  return (event.source_ids || event.sourceIds || [])
    .map((sourceId) => {
      const source = sourceById && sourceById.get ? sourceById.get(sourceId) : null;
      return [
        sourceId,
        source?.source_family,
        source?.title,
        source?.provider,
        source?.provenance_notes,
      ].filter(Boolean).join(" ");
    })
    .join(" ");
}

function eventMatchesLens(event, lensOrSlug, sourceById = new Map()) {
  const lens = typeof lensOrSlug === "string"
    ? LENS_DEFINITIONS.find((item) => item.slug === lensOrSlug)
    : lensOrSlug;
  if (!lens) return false;
  const group = lens.group;
  if (event.category === GROUP_CATEGORY[group]) return true;
  const eventLens = String(event.lens || "").toLowerCase();
  if (GROUP_SIGNALS[group]?.has(eventLens)) return true;
  const signals = Array.isArray(event.affected_signals) ? event.affected_signals : [];
  if (signals.some((signal) => GROUP_SIGNALS[group]?.has(String(signal).toLowerCase()))) return true;
  const haystack = [
    event.category,
    event.lens,
    event.title,
    event.short_description,
    event.summary,
    event.explanation,
    sourceTextForEvent(event, sourceById),
  ].filter(Boolean).join(" ");
  return GROUP_PATTERNS[group].test(haystack);
}

function economyLandUseSpecificEvent(event) {
  if (!event) return null;
  const signals = Array.isArray(event.affected_signals)
    ? event.affected_signals
    : Array.isArray(event.affectedSignals)
    ? event.affectedSignals
    : [];
  const text = [
    event.id,
    event.event_id,
    event.title,
    event.short_description,
    event.shortDescription,
    event.summary,
    event.area,
    event.source_date_field,
    event.sourceDateField,
    ...signals,
  ].filter(Boolean).join(" ").toLowerCase();
  if (/\b(planning[-\s]?statistics|statistics[-\s]?dataset|dataset[-\s]?csv|house[-\s]?price|hpi|citywide|aggregate|borough)\b/.test(text)) return null;
  if (/\b(retail|shop|market|office|business|hospitality|hotel|restaurant|cafe|bar|pub|visitor|tourism|culture|vacan|derelict|commercial|employment|workspace|industrial|warehouse|residential|student)\b/.test(text)) return event;
  return null;
}

function eventDirectlyMatchesLensCategory(event, lensOrSlug) {
  const lens = typeof lensOrSlug === "string"
    ? LENS_DEFINITIONS.find((item) => item.slug === lensOrSlug)
    : lensOrSlug;
  if (!event || !lens || event.category !== lens.category) return false;
  if (lens.slug === "economy-land-use") return Boolean(economyLandUseSpecificEvent(event));
  return true;
}

function licenseNeedsReview(source) {
  const text = [
    source?.licence,
    source?.license,
    source?.licence_url,
    source?.license_url,
    source?.caveats && source.caveats.join(" "),
  ].filter(Boolean).join(" ");
  return /requires source-level review|not specified|pending|verify before redistribution|terms vary|review-required|unclear/i.test(text);
}

function sourceHasMinimumLicense(source) {
  return Boolean(
    source
      && (source.licence || source.license)
      && (source.licence_url || source.license_url)
      && source.attribution_text,
  );
}

module.exports = {
  LENS_DEFINITIONS,
  LENS_SLUGS,
  economyLandUseSpecificEvent,
  eventDirectlyMatchesLensCategory,
  eventMatchesLens,
  licenseNeedsReview,
  sourceHasMinimumLicense,
};
