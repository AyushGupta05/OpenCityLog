#!/usr/bin/env python3
"""Regenerate shared inventory, coverage matrix, manifests and README for data-discovery."""
from __future__ import annotations
import csv, json
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TERMS={
'boundaries_geography':['boundary','boundaries','geography','gis','community district','council district'],
'basemap_physical_features':['basemap','land use','tax lot','uprn','centerline','street network','openmap','zoomstack','lion','pluto','footprint','parcel','tax map'],
'planning_development':['planning','development','zoning','zap','building','dob','permit','brownfield','developer agreement','article 4','conservation'],
'housing_delivery':['housing','affordable','certificate','occupancy','hpd','price paid','house price'],
'transport_mobility':['traffic','transport','mobility','cycling','transit','subway','tfl','mta','taxi','street','crash','collision','rail','bus','pedestrian','parking','curb','sidewalk'],
'environment_air_quality':['environment','air','emission','flood','climate','water','tree','greenhouse','noise','heat','canopy','geology','energy'],
'demographics_socioeconomic':['demographic','census','population','acs','labour','labor','deprivation','welfare'],
'economy_business':['economy','economic','business','employment','restaurant','lodes','licence','license','storefront','companies','charity'],
'public_services_civic_assets':['public services','facility','facilities','fire','police','school','nhs','parks','311','care','sport','childcare','ems','sanitation','open space'],
'policy_governance':['policy','governance','legislation','plan','law','article 4','council','boundary commission','local plan'],
'imagery_historical':['imagery','historical','archive','webarchive','lidar','ortho','historic maps','aerial'],
'source_provenance':['provenance','metadata','open data','api','catalog','portal','ckan','socrata']}
def city_sources(city):
    return json.loads((ROOT/city/'source_catalog.json').read_text())['sources']
def sid(s): return s.get('source_id') or s.get('id') or s.get('socrata_id')
def event_count(city):
    ev=json.loads((ROOT/city/'events_seed.json').read_text())
    return len(ev.get('events',[])) if city=='london' else len(ev.get('chronology_milestones',[]))+len(ev.get('event_seed_patterns',[]))
def main():
    now=datetime.now(timezone.utc).isoformat(); cities=['london','new_york']; all_rows=[]; counts={}
    for city in cities:
        sources=city_sources(city); counts[city]=len(sources)
        for s in sources:
            all_rows.append({'city':city,'source_id':sid(s),'title':s.get('title',''),'publisher':s.get('publisher',''),'bucket':s.get('bucket',''),'source_type':s.get('source_type',''),'access_url':s.get('access_url') or s.get('url') or s.get('api_endpoint') or '', 'api_endpoint':s.get('api_endpoint') or s.get('metadata_url') or '', 'coverage':s.get('coverage_start') or s.get('time_coverage',''), 'spatial_granularity':s.get('spatial_granularity',''),'temporal_granularity':s.get('temporal_granularity',''),'licence':s.get('licence',''),'limitations':s.get('limitations',''),'raw_metadata_file':s.get('raw_metadata_file','')})
    with (ROOT/'shared/dataset_inventory.csv').open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=list(all_rows[0].keys())); w.writeheader(); w.writerows(all_rows)
    with (ROOT/'shared/coverage_matrix.csv').open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=['city','required_bucket','source_count','example_source_ids','status']); w.writeheader()
        for city in cities:
            src=[r for r in all_rows if r['city']==city]
            for b,ts in TERMS.items():
                hits=[r['source_id'] for r in src if any(t in ' '.join([r['bucket'],r['title'],r['publisher'],r['source_id'],r['source_type']]).lower() for t in ts)]
                w.writerow({'city':city,'required_bucket':b,'source_count':len(hits),'example_source_ids':';'.join(hits[:10]),'status':'covered' if hits else 'gap'})
    for city in cities:
        src=[r for r in all_rows if r['city']==city]
        warnings=[]
        for r in src:
            rf=ROOT/r['raw_metadata_file']
            if not rf.exists(): warnings.append((r['source_id'],r['title'],['missing raw metadata'])); continue
            rec=json.loads(rf.read_text(errors='replace')); snaps=rec.get('snapshots',[])
            if not any((s.get('status') or 0) and int(s.get('status') or 0)<400 for s in snaps): warnings.append((r['source_id'],r['title'],[s.get('error') or s.get('status') for s in snaps]))
        (ROOT/city/'city_manifest.json').write_text(json.dumps({'city':city,'created_for':'Bims-5 civic city-change atlas','updated_at':now,'source_catalog':f'{city}/source_catalog.json','events_seed':f'{city}/events_seed.json','source_count':len(src),'event_seed_count':event_count(city),'raw_metadata_count':sum(1 for r in src if (ROOT/r['raw_metadata_file']).exists()),'warning_snapshot_count':len(warnings)},indent=2)+'\n')
    total_events=sum(event_count(c) for c in cities); raw_count=len(list((ROOT/'raw_metadata').glob('*.json')))
    (ROOT/'manifest.json').write_text(json.dumps({'package':'Bims-5 London and NYC civic open-data discovery package','updated_at':now,'cities':cities,'source_count_total':len(all_rows),'source_counts':counts,'event_seed_count_total':total_events,'raw_metadata_files':raw_count,'files':{'dataset_inventory':'shared/dataset_inventory.csv','coverage_matrix':'shared/coverage_matrix.csv','round3_candidates_json':'shared/round3_catalog_candidates.json','round3_candidates_csv':'shared/round3_catalog_candidates.csv','validation_report':'validation_report.json','fetch_script':'scripts/fetch_metadata.py','fetch_missing_script':'scripts/fetch_missing_metadata.py','catalog_search_round3':'scripts/catalog_search_round3.py'}},indent=2)+'\n')
    (ROOT/'README.md').write_text(f'''# London + New York civic city-change data discovery package\n\nUpdated: {now}\n\nReproducible source-discovery pack for Bims-5: an open-source urban changelog / city-change atlas. It covers official/open data for spatial change, transport, planning, buildings, streets/curbs, events, environment, demographics, economy, public services, historic maps/imagery and source provenance.\n\nThis is Part 1 discovery, not a finished ingestion, prediction, simulation, or causal impact model.\n\n## Current counts\n\n- Total sources: {len(all_rows)}\n  - London: {counts['london']}\n  - NYC: {counts['new_york']}\n- Event seeds/patterns: {total_events}\n- Raw metadata/page/API snapshot files: {raw_count}\n\n## Main files\n\n- `manifest.json`\n- `validation_report.json`\n- `shared/dataset_inventory.csv`\n- `shared/coverage_matrix.csv`\n- `shared/round3_catalog_candidates.json`\n- `shared/round3_catalog_candidates.csv`\n- `london/source_catalog.json`\n- `london/events_seed.json`\n- `new_york/source_catalog.json`\n- `new_york/events_seed.json`\n- `raw_metadata/`\n\n## Re-run\n\n```bash\npython3 data-discovery/scripts/catalog_search_round3.py\npython3 data-discovery/scripts/fetch_missing_metadata.py --city all\npython3 data-discovery/scripts/update_shared_package.py\npython3 data-discovery/scripts/validate_discovery_package.py\n```\n\n## Product-use warning\n\nUse this package to drive ETL/source adapters. Do not present candidate event seeds as proven causal impacts. Use labels such as documented, corroborated, inferred, disputed, and candidate_requires_row_validation.\n''')
    print(json.dumps({'sources':len(all_rows),'counts':counts,'events':total_events,'raw_metadata_files':raw_count},indent=2))
if __name__=='__main__': main()
