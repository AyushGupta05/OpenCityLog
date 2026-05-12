#!/usr/bin/env python3
"""Fetch metadata snapshots only for catalog records whose raw_metadata_file is missing."""
from fetch_metadata import ROOT, fetch_url, source_id, normalise_catalog, slugify, now_iso
import json, time, argparse

def fetch_missing(city):
    sources = normalise_catalog(city)
    out=[]
    for i, src in enumerate(sources, 1):
        raw = ROOT / src['raw_metadata_file']
        if raw.exists():
            continue
        sid = source_id(city, i, src)
        urls=[]
        if src.get('metadata_url'): urls.append(src['metadata_url'])
        if src.get('socrata_id') and 'data.cityofnewyork.us' in (src.get('url') or src.get('api_endpoint') or src.get('metadata_url') or ''):
            dsid=src['socrata_id']; urls.append(f'https://data.cityofnewyork.us/api/views/{dsid}'); urls.append(f'https://data.cityofnewyork.us/resource/{dsid}.json?$limit=1')
        for field in ['api_endpoint','url','access_url']:
            v=src.get(field)
            if isinstance(v,str) and v.startswith('http') and v not in urls and ';' not in v and ' ' not in v:
                urls.append(v)
        snapshots=[]
        for url in urls[:3]:
            snapshots.append(fetch_url(url)); time.sleep(0.1)
        record={'source_id':sid,'city':city,'title':src.get('title'),'publisher':src.get('publisher'),'bucket':src.get('bucket'),'retrieved_at':now_iso(),'snapshots':snapshots}
        raw.parent.mkdir(parents=True, exist_ok=True)
        raw.write_text(json.dumps(record, indent=2, ensure_ascii=False)+'\n')
        ok=any((s.get('status') or 0) and int(s.get('status') or 0)<400 for s in snapshots)
        print(f'{city} {sid}: {"ok" if ok else "warn"} ({len(snapshots)} snapshots)')
        out.append((sid,ok))
    return out

if __name__ == '__main__':
    ap=argparse.ArgumentParser(); ap.add_argument('--city',choices=['london','new_york','all'],default='all')
    args=ap.parse_args(); cities=['london','new_york'] if args.city=='all' else [args.city]
    summary={}
    for city in cities:
        res=fetch_missing(city); summary[city]={'attempted':len(res),'ok':sum(1 for _,ok in res if ok),'warnings':sum(1 for _,ok in res if not ok)}
    print(json.dumps(summary, indent=2))
