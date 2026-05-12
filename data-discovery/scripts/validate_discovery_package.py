#!/usr/bin/env python3
"""Validate the Bims-5 London/NYC civic data discovery package."""
from __future__ import annotations
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
REQUIRED_BUCKETS = [
    'boundaries_geography','basemap_physical_features','planning_development',
    'housing_delivery','transport_mobility','environment_air_quality',
    'demographics_socioeconomic','economy_business','public_services_civic_assets',
    'policy_governance','imagery_historical','source_provenance'
]
BUCKET_MAP = {
    'boundaries_geography': ['boundary', 'boundaries', 'geography', 'gis'],
    'basemap_physical_features': ['basemap', 'land use', 'tax lot', 'uprn', 'centerline', 'street network', 'openmap', 'zoomstack', 'lion', 'pluto'],
    'planning_development': ['planning', 'development', 'zoning', 'zap', 'building', 'dob', 'permit'],
    'housing_delivery': ['housing', 'affordable', 'certificate', 'occupancy', 'hpd'],
    'transport_mobility': ['traffic', 'transport', 'mobility', 'cycling', 'transit', 'subway', 'tfl', 'mta', 'taxi', 'street', 'crash', 'collision'],
    'environment_air_quality': ['environment', 'air', 'emission', 'flood', 'climate', 'water', 'tree', 'greenhouse'],
    'demographics_socioeconomic': ['demographic', 'census', 'population', 'acs', 'labour', 'labor'],
    'economy_business': ['economy', 'economic', 'business', 'employment', 'restaurant', 'lodes'],
    'public_services_civic_assets': ['public services', 'facility', 'facilities', 'fire', 'police', 'school', 'nhs', 'parks', '311'],
    'policy_governance': ['policy', 'governance', 'legislation', 'plan', 'law'],
    'imagery_historical': ['imagery', 'historical', 'archive', 'webarchive', 'lidar', 'ortho'],
    'source_provenance': ['provenance', 'metadata', 'open data', 'api', 'catalog'],
}

def load_json(path):
    with path.open(encoding='utf-8') as f:
        return json.load(f)

def srcs(city):
    data = load_json(ROOT / city / 'source_catalog.json')
    return data['sources']

def source_ids(sources):
    ids = set()
    for s in sources:
        for key in ('source_id','id','socrata_id'):
            if s.get(key): ids.add(s[key])
    return ids

def canonical_hits(sources):
    hits = {b:0 for b in REQUIRED_BUCKETS}
    for s in sources:
        text = ' '.join(str(s.get(k,'')) for k in ['bucket','title','publisher','source_id','id','socrata_id']).lower()
        for b, terms in BUCKET_MAP.items():
            if any(t in text for t in terms):
                hits[b]+=1
    return hits

def validate_city(city):
    issues=[]
    sources=srcs(city)
    ids=[s.get('source_id') for s in sources]
    if any(not x for x in ids): issues.append('missing source_id')
    if len(ids)!=len(set(ids)): issues.append('duplicate source_id')
    for s in sources:
        rf=s.get('raw_metadata_file')
        if not rf or not ((ROOT / rf).exists() or (REPO / rf).exists()):
            issues.append(f"missing raw metadata: {s.get('source_id')}")
    hits=canonical_hits(sources)
    missing=[b for b,v in hits.items() if v==0]
    if missing: issues.append('missing required bucket coverage: '+', '.join(missing))
    ev=load_json(ROOT / city / 'events_seed.json')
    ids_all=source_ids(sources)
    unresolved=[]
    if city=='london':
        events=ev.get('events',[])
        for e in events:
            for sid in e.get('source_ids',[]):
                if sid not in ids_all: unresolved.append((e.get('title'), sid))
    else:
        events=ev.get('chronology_milestones',[])+ev.get('event_seed_patterns',[])
        for p in ev.get('event_seed_patterns',[]):
            for sid in p.get('sources',[]):
                if sid not in ids_all and sid not in ['MTA turnstile','TLC trip records','Census API','LODES']:
                    unresolved.append((p.get('seed'), sid))
    if unresolved: issues.append('unresolved event source references: '+str(unresolved[:10]))
    return {'city': city, 'source_count': len(sources), 'event_seed_count': len(events), 'bucket_hits': hits, 'issues': issues}

def main():
    results=[validate_city('london'), validate_city('new_york')]
    raw_files=list((ROOT/'raw_metadata').glob('*.json'))
    script_files=list((ROOT/'scripts').glob('fetch*_metadata.py'))
    summary={'status':'pass' if all(not r['issues'] for r in results) else 'warn', 'cities':results, 'raw_metadata_files':len(raw_files), 'fetch_scripts':[str(p.relative_to(ROOT)) for p in script_files]}
    (ROOT/'validation_report.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps(summary,indent=2,ensure_ascii=False))
    raise SystemExit(0 if summary['status']=='pass' else 1)
if __name__=='__main__': main()
