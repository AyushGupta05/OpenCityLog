#!/usr/bin/env python3
"""Round-3 broad catalog searches for London/UK and NYC sources.

Creates shared/round3_catalog_candidates.json and CSV from official catalog APIs.
This does not blindly ingest everything; it records candidates for review/promotion.
"""
from __future__ import annotations
import csv, json, re, time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

ROOT=Path(__file__).resolve().parents[1]
UA='Bims-5 civic discovery round3/0.1'

def get_json(url, timeout=20):
    req=Request(url, headers={'User-Agent':UA,'Accept':'application/json,*/*'})
    with urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8','replace'))

def load_existing(city):
    d=json.loads((ROOT/city/'source_catalog.json').read_text())
    ids=set(); titles=set(); urls=set()
    for s in d['sources']:
        ids.add(str(s.get('source_id') or s.get('id') or s.get('socrata_id') or '').lower())
        titles.add(str(s.get('title','')).lower())
        for k in ['url','access_url','api_endpoint','metadata_url']:
            if s.get(k): urls.add(str(s[k]).lower())
    return ids,titles,urls

def search_nyc():
    terms=['building footprint historic landmark zoning tax map capital project sidewalk curb parking signal event permit storefront pedestrian count sanitation tree canopy school childcare crime fire ems flood elevation lidar community district',
           'landmark permit zoning geodatabase digital tax map capital budget public event film permit storefront vacancy pedestrian count curb parking meters',
           'resiliency heat vulnerability sea level rise evacuation lidar elevation orthophoto community board council district school zone']
    out=[]; seen=set(); ex_ids,ex_titles,ex_urls=load_existing('new_york')
    for q in terms:
        url='https://api.us.socrata.com/api/catalog/v1?'+urlencode({'domains':'data.cityofnewyork.us','search_context':'data.cityofnewyork.us','q':q,'limit':100})
        try: data=get_json(url)
        except Exception as e:
            out.append({'city':'new_york','error':str(e),'query':q}); continue
        for r in data.get('results',[]):
            res=r.get('resource',{}); meta=r.get('metadata',{})
            dsid=res.get('id')
            title=res.get('name') or ''
            if not dsid or dsid.lower() in ex_ids or title.lower() in ex_titles or dsid in seen: continue
            seen.add(dsid)
            out.append({'city':'new_york','catalog':'socrata','dataset_id':dsid,'title':title,'publisher':(meta.get('domain') or 'NYC Open Data'),'description':res.get('description'),'url':res.get('permalink') or f'https://data.cityofnewyork.us/api/views/{dsid}','metadata_url':f'https://data.cityofnewyork.us/api/views/{dsid}','type':res.get('type'),'categories':';'.join(res.get('categories') or []),'columns':res.get('columns_name'),'query':q})
        time.sleep(0.2)
    return out

def search_uk_london():
    # UK data.gov CKAN package_search; queries focus London and national layers useful to London.
    queries=['London planning conservation tree parking traffic roadworks footfall open data',
             'London borough open data trees parking planning conservation areas',
             'England spatial planning brownfield conservation article 4 tree preservation order developer agreement',
             'London air quality noise flood heat green space transport stops road safety',
             'London schools hospitals care facilities sport food hygiene deprivation health']
    ex_ids,ex_titles,ex_urls=load_existing('london')
    out=[]; seen=set()
    for q in queries:
        url='https://www.data.gov.uk/api/3/action/package_search?'+urlencode({'q':q,'rows':50})
        try: data=get_json(url)
        except Exception as e:
            out.append({'city':'london','error':str(e),'query':q}); continue
        for pkg in data.get('result',{}).get('results',[]):
            name=pkg.get('name') or ''
            title=pkg.get('title') or name
            pkgurl='https://www.data.gov.uk/dataset/'+name if name else None
            if not name or name in seen or title.lower() in ex_titles or (pkgurl and pkgurl.lower() in ex_urls): continue
            seen.add(name)
            org=(pkg.get('organization') or {}).get('title') or pkg.get('publisher') or ''
            out.append({'city':'london','catalog':'data.gov.uk','dataset_id':name,'title':title,'publisher':org,'description':pkg.get('notes'),'url':pkgurl,'metadata_url':'https://www.data.gov.uk/api/3/action/package_show?id='+name,'type':'ckan_package','categories':';'.join(pkg.get('groups') or []),'columns':None,'query':q})
        time.sleep(0.2)
    return out

def score(c):
    text=' '.join(str(c.get(k,'')) for k in ['title','description','publisher','query']).lower()
    s=0
    for kw,w in [('polygon',3),('geospatial',3),('map',2),('gis',3),('boundary',3),('building',3),('zoning',3),('permit',2),('traffic',3),('parking',2),('sidewalk',2),('flood',3),('tree',2),('historic',2),('london',2),('nyc',2),('new york',2),('open data',1)]:
        if kw in text: s+=w
    return s

def main():
    candidates=search_nyc()+search_uk_london()
    for c in candidates:
        c['score']=score(c); c['retrieved_at']=datetime.now(timezone.utc).isoformat()
    candidates=sorted(candidates, key=lambda x:(x.get('city',''), -x.get('score',0), x.get('title','')))
    out_json=ROOT/'shared/round3_catalog_candidates.json'
    out_csv=ROOT/'shared/round3_catalog_candidates.csv'
    out_json.write_text(json.dumps({'retrieved_at':datetime.now(timezone.utc).isoformat(),'count':len(candidates),'candidates':candidates},indent=2,ensure_ascii=False)+'\n')
    fields=['city','score','catalog','dataset_id','title','publisher','url','metadata_url','type','categories','query','description']
    with out_csv.open('w', newline='', encoding='utf-8') as f:
        w=csv.DictWriter(f, fieldnames=fields, extrasaction='ignore'); w.writeheader(); w.writerows(candidates)
    print(json.dumps({'count':len(candidates),'by_city':{city:sum(1 for c in candidates if c.get('city')==city) for city in ['london','new_york']},'files':[str(out_json),str(out_csv)]},indent=2))
if __name__=='__main__': main()
