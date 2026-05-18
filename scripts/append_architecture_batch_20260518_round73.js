const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const sourceByCity = {
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages",
  belfast: "belfast-architecture-public-pages"
};

const sourceRecords = [
  {
    city_id: "london",
    event_id: "lon_arch_imperial_school_public_health_opening_2024",
    date: "2024-03-06",
    bucket: "planning/development/architecture/university research building",
    title: "Imperial School of Public Health development opened at White City",
    summary:
      "Imperial College London announced on March 6, 2024 that its new School of Public Health building at White City officially opened.",
    observed_change:
      "A documented university research and teaching building opening was recorded at Imperial's White City campus.",
    area: "White City / Hammersmith and Fulham",
    latitude: 51.5176,
    longitude: -0.2259,
    source_name: "Imperial College London news: Imperial opens major building for School of Public Health",
    source_url: "https://www.imperial.ac.uk/news/251877/imperial-opens-major-building-school-public/",
    source_record_id: "imperial-2024-03-06-school-public-health",
    source_date_field: "Imperial news publication and official-opening date",
    confidence: "documented",
    architect: "Allies and Morrison",
    project_type: "university public-health research building opening",
    geometry_source:
      "Approximate point for Imperial's White City campus from subagent geocode notes; replace with building footprint when available.",
    geometry_precision: "campus/site approximate",
    limitations:
      "The source records official opening. It does not verify practical completion, later occupation levels, laboratory fit-out, or operating outcomes."
  },
  {
    city_id: "london",
    event_id: "lon_arch_mrc_lms_hammersmith_opening_2024",
    date: "2024-01-24",
    bucket: "planning/development/architecture/laboratory building",
    title: "MRC Laboratory of Medical Sciences development opened at Hammersmith Campus",
    summary:
      "Imperial College London announced on January 24, 2024 that the new MRC Laboratory of Medical Sciences building at the Hammersmith Campus was officially opened.",
    observed_change:
      "A documented biomedical laboratory and research building opening was recorded at Imperial's Hammersmith Campus.",
    area: "Hammersmith Hospital / White City",
    latitude: 51.517,
    longitude: -0.2357,
    source_name: "Imperial College London news: Royal opening of MRC Laboratory of Medical Sciences",
    source_url: "https://www.imperial.ac.uk/news/250937/royal-opening-mrc-laboratory-medical-sciences/amp/",
    source_record_id: "imperial-2024-01-24-mrc-lms-hammersmith",
    source_date_field: "Imperial news publication and official-opening date",
    confidence: "documented",
    architect: "Hawkins Brown",
    project_type: "biomedical laboratory building opening",
    geometry_source:
      "Approximate point for Imperial Hammersmith Campus and Hammersmith Hospital from subagent geocode notes.",
    geometry_precision: "campus/site approximate",
    limitations:
      "The source records a ceremonial opening. It does not establish exact practical completion, earlier occupation, later research activity, or building performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_imperial_dyson_school_building_opening_2019",
    date: "2019-05-15",
    bucket: "planning/development/architecture/university teaching building",
    title: "Imperial Dyson School development permanent building opened",
    summary:
      "Imperial College London reported on May 15, 2019 that the permanent home for the Dyson School of Design Engineering was officially open.",
    observed_change:
      "A documented university design-engineering teaching and research building opening was recorded at Imperial's South Kensington campus.",
    area: "South Kensington",
    latitude: 51.4988,
    longitude: -0.1749,
    source_name: "Imperial College London news: Dyson School building celebration",
    source_url: "https://www.imperial.ac.uk/news/191226/celebration-dyson-school-building-design-engineers/",
    source_record_id: "imperial-2019-05-15-dyson-school-building",
    source_date_field: "Imperial news publication and official-opening date",
    confidence: "documented",
    architect: "Imperial source does not name the architect on the cited page",
    project_type: "university design-engineering building opening",
    geometry_source:
      "Approximate point for Imperial's South Kensington campus from subagent geocode notes.",
    geometry_precision: "campus/site approximate",
    limitations:
      "The source records official opening of the school building. It does not document earlier fit-out, school launch dates, later alterations, or full estate context."
  },
  {
    city_id: "london",
    event_id: "lon_arch_oru_sutton_launch_2024",
    date: "2024-02-01",
    bucket: "planning/development/architecture/high-street retrofit",
    title: "Oru Sutton high-street retrofit development launched",
    summary:
      "London City Hall records Oru Sutton in Sutton town centre as officially launched in February 2024 after retrofit of vacant high-street space.",
    observed_change:
      "A documented high-street retrofit project was recorded as launching workspace, wellbeing, hospitality, and community uses.",
    area: "Sutton town centre",
    latitude: 51.364046469867,
    longitude: -0.19262235,
    source_name: "London City Hall project page: Oru Sutton",
    source_url:
      "https://www.london.gov.uk/programmes-strategies/shaping-local-spaces/regeneration-projects/oru-sutton-london-borough-sutton",
    source_record_id: "london-city-hall-oru-sutton",
    source_date_field: "London City Hall project page launch month",
    confidence: "documented",
    architect: "Takero Shimazaki Architects and Samuel Chisholm Studio",
    project_type: "high-street commercial retrofit launch",
    geometry_source: "Coordinates taken from the London City Hall project page.",
    geometry_precision: "site approximate",
    limitations:
      "The source gives a month-level launch date. It does not confirm exact opening day, tenancy mix over time, construction completion, or later operating changes."
  },
  {
    city_id: "london",
    event_id: "lon_arch_kings_head_theatre_islington_square_launch_2024",
    date: "2024-01-01",
    bucket: "planning/development/architecture/theatre retrofit",
    title: "King's Head Theatre development launched in Islington Square",
    summary:
      "London City Hall records the King's Head Theatre in Islington Square as officially launched in January 2024 after retrofit of vacant underground space.",
    observed_change:
      "A documented theatre retrofit was recorded as launching performance, cafe-bar, workspace, and community space in Islington Square.",
    area: "Islington Square / Islington",
    latitude: 51.5373,
    longitude: -0.1026,
    source_name: "London City Hall project page: King's Head Theatre",
    source_url:
      "https://www.london.gov.uk/programmes-strategies/shaping-local-spaces/regeneration-projects/kings-head-theatre-lb-islington",
    source_record_id: "london-city-hall-kings-head-theatre-islington-square",
    source_date_field: "London City Hall project page launch month",
    confidence: "documented",
    architect: "S+CO and PUP Architects",
    project_type: "theatre and cultural-space retrofit launch",
    geometry_source:
      "Approximate point for Islington Square from subagent geocode notes; replace with theatre entrance point when available.",
    geometry_precision: "site approximate",
    limitations:
      "The source gives a month-level launch date. It does not confirm first performance date, fit-out completion, audience capacity, or later operator changes."
  },
  {
    city_id: "london",
    event_id: "lon_arch_open_havelock_opening_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/community hub retrofit",
    title: "Open Havelock community-hub development opened in Southall",
    summary:
      "London City Hall records Open Havelock at Havelock Estate in Southall as officially opened on November 18, 2022.",
    observed_change:
      "A documented estate community-hub retrofit was recorded as opening in Southall.",
    area: "Havelock Estate / Southall",
    latitude: 51.5035,
    longitude: -0.3789,
    source_name: "London City Hall project page: Open Havelock",
    source_url:
      "https://www.london.gov.uk/programmes-strategies/shaping-local-spaces/regeneration-projects/open-havelock-london-borough-ealing",
    source_record_id: "london-city-hall-open-havelock",
    source_date_field: "London City Hall project page opening date",
    confidence: "documented",
    architect: "London City Hall page does not name the architect in the cited text",
    project_type: "community hub retrofit opening",
    geometry_source: "Approximate point for Havelock Estate from subagent geocode notes.",
    geometry_precision: "estate/site approximate",
    limitations:
      "The source records the opening date. It does not document full construction history, operator continuity, programme outcomes, or later estate works."
  },
  {
    city_id: "london",
    event_id: "lon_arch_talent_house_stratford_opening_2022",
    date: "2022-07-05",
    bucket: "planning/development/architecture/creative hub",
    title: "Talent House creative development opened on Sugar House Island",
    summary:
      "UD Music records the official opening of Talent House on Sugar House Island on July 5, 2022, a creative hub for music and dance organisations.",
    observed_change:
      "A documented creative-production and education hub opening was recorded on Sugar House Island.",
    area: "Sugar House Island / Stratford",
    latitude: 51.5364,
    longitude: -0.0068,
    source_name: "UD Music blog: Talent House official opening",
    source_url: "https://www.udmusic.org/blog/featured/talent-house-official-opening/",
    source_record_id: "ud-music-2022-07-05-talent-house-official-opening",
    source_date_field: "Operator news page opening date, corroborated by partner/public reports noted in candidate review",
    confidence: "corroborated",
    architect: "Citizens Design Bureau with shell and stair cores by Waugh Thistleton",
    project_type: "creative hub opening",
    geometry_source: "Approximate point for 3 Sugar House Lane, Stratford from subagent geocode notes.",
    geometry_precision: "site approximate",
    limitations:
      "The source records an official opening event. Construction completion, soft launch, tenant move-in, and later programming may have separate dates."
  },
  {
    city_id: "london",
    event_id: "lon_arch_spid_theatre_kensal_house_opening_2024",
    date: "2024-07-16",
    bucket: "planning/development/architecture/community theatre retrofit",
    title: "SPID Theatre development reopened Kensal House Community Rooms",
    summary:
      "The Mayor's Report to the London Assembly records SPID Theatre's Estate of Play project at Kensal House as officially opened on July 16, 2024.",
    observed_change:
      "A documented listed-estate community-room refurbishment was recorded as opening for cultural, youth, and community use.",
    area: "Kensal House Estate / Kensington and Chelsea",
    latitude: 51.5234,
    longitude: -0.2139,
    source_name: "London City Hall - Mayor's Report to the Assembly",
    source_url: "https://www.london.gov.uk/media/106631/download?attachment=",
    source_record_id: "mayors-report-4-spid-theatre-estate-of-play",
    source_date_field: "Mayor's Report official-opening date",
    confidence: "documented",
    architect: "Cited report does not name the architect",
    project_type: "listed community-room refurbishment opening",
    geometry_source:
      "Approximate point for Kensal House Estate from subagent geocode notes; replace with room entrance point when available.",
    geometry_precision: "estate/site approximate",
    limitations:
      "The Assembly report is concise. It does not provide full design team, construction-phasing, accessibility, or operating details."
  },
  {
    city_id: "london",
    event_id: "lon_arch_west_london_disability_hub_opening_2023",
    date: "2023-06-07",
    bucket: "planning/development/architecture/community hub fit-out",
    title: "West London Disability Hub development opened on the Clem Attlee Estate",
    summary:
      "The Mayor's Report to the London Assembly records the West London Disability Hub on the Clem Attlee Estate as officially opened on June 7, 2023.",
    observed_change:
      "A documented accessible community, office, meeting, and advice hub fit-out was recorded as opening within the estate.",
    area: "Clem Attlee Estate / Hammersmith and Fulham",
    latitude: 51.4808,
    longitude: -0.2079,
    source_name: "London City Hall - Mayor's Report to the Assembly",
    source_url: "https://gla.moderngov.co.uk/documents/s105555/22nd%20Mayors%20Report.pdf",
    source_record_id: "mayors-report-22-west-london-disability-hub",
    source_date_field: "Mayor's Report official-opening date",
    confidence: "documented",
    architect: "Cited report does not name the architect",
    project_type: "accessible community hub fit-out opening",
    geometry_source:
      "Approximate point for Clem Attlee Estate from subagent geocode notes; exact unit should be confirmed before footprint mapping.",
    geometry_precision: "estate/site approximate",
    limitations:
      "The source records the hub opening within a wider estate context. It does not identify the exact unit, design team, lease terms, or later service delivery."
  },
  {
    city_id: "london",
    event_id: "lon_arch_spark_lab_ilford_opening_2022",
    date: "2022-06-21",
    bucket: "planning/development/architecture/high-street incubator",
    title: "Spark Lab Ilford high-street development opened",
    summary:
      "The London Borough of Redbridge reported on June 21, 2022 that The Spark Lab had recently opened on Ilford High Road.",
    observed_change:
      "A documented high-street shop-space retrofit and enterprise incubator opening was recorded in Ilford town centre.",
    area: "Ilford town centre / Redbridge",
    latitude: 51.5586,
    longitude: 0.0718,
    source_name: "London Borough of Redbridge news: Spark Lab Ilford",
    source_url:
      "https://www.redbridge.gov.uk/news/june-2022/redbridge-council-adds-a-spark-of-entrepreneurship-to-ilford-high-street/",
    source_record_id: "redbridge-2022-06-21-spark-lab-ilford",
    source_date_field: "Council news publication date and recently-opened wording",
    confidence: "documented",
    architect: "Redbridge source does not name the architect",
    project_type: "high-street shop-space retrofit and incubator opening",
    geometry_source:
      "Approximate point for High Road Ilford from subagent geocode notes; source does not provide a precise unit point.",
    geometry_precision: "street/site approximate",
    limitations:
      "The source records the Spark Lab opening, not the full Spark Ilford programme, exact fit-out completion, tenant outcomes, or later market changes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_hayden_lord_park_opening_2013",
    date: "2013-09-15",
    bucket: "planning/development/architecture/community park",
    title: "Hayden Lord Park development opened in University Heights",
    summary:
      "NYC HDC announced on September 15, 2013 the opening of Hayden Lord Park, a new community art park tied to the University Avenue Consolidated redevelopment.",
    observed_change:
      "A documented public release recorded opening of a community art park within a larger Bronx redevelopment.",
    area: "University Heights / Bronx",
    latitude: 40.8516,
    longitude: -73.9164,
    source_name: "NYC HDC release: Hayden Lord Park opening",
    source_url:
      "https://www.nychdc.com/newsroom/city-officials-residents-join-bronx-pro-group-dreamyard-project-celebrate-opening-hayden",
    source_record_id: "nychdc-2013-09-15-hayden-lord-park-opening",
    source_date_field: "HDC release date",
    confidence: "documented",
    architect: "HDC release does not name the park designer on the cited page",
    project_type: "community art park opening",
    geometry_source:
      "Approximate point near 1665 Andrews Avenue from subagent geocode notes; use parcel or park geometry if available.",
    geometry_precision: "site approximate",
    limitations:
      "The event records park opening tied to a larger redevelopment. It does not cover all University Avenue Consolidated phases, long-term maintenance, or park programming."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_navy_green_phase_one_completion_2013",
    date: "2013-10-31",
    bucket: "planning/development/architecture/mixed-income housing",
    title: "Navy Green first development phase was completed",
    summary:
      "NYC HDC announced on October 31, 2013 a ribbon-cutting and completion milestone for Navy Green's first phase at the former Brig site near the Brooklyn Navy Yard.",
    observed_change:
      "A documented housing-finance release recorded completion of the first phase of a mixed-income, mixed-use redevelopment.",
    area: "Wallabout / Brooklyn Navy Yard",
    latitude: 40.6958,
    longitude: -73.9713,
    source_name: "NYC HDC release: Navy Green first phase completion",
    source_url:
      "https://www.nychdc.com/newsroom/hcr-hpd-hdc-join-dunn-development-corp-lm-development-partners-pratt-area-community",
    source_record_id: "nychdc-2013-10-31-navy-green-phase-one",
    source_date_field: "HDC release date and completion wording",
    confidence: "documented",
    architect: "HDC release does not name the architect on the cited page",
    project_type: "mixed-income housing redevelopment phase completion",
    geometry_source:
      "Approximate site point near 7 Clermont Avenue, 45 Clermont Avenue, and 40 Vanderbilt Avenue from subagent notes.",
    geometry_precision: "site approximate",
    limitations:
      "The event covers the first phase only. Later condominium, townhouse, open-space, occupancy, and operating changes require separate records."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_norman_towers_opening_2014",
    date: "2014-10-30",
    bucket: "planning/development/architecture/mixed-income housing",
    title: "Norman Towers development opened in Downtown Jamaica",
    summary:
      "NYC HDC announced on October 30, 2014 a ribbon-cutting for the 161st Street Apartments, also known as Norman Towers, in Downtown Jamaica.",
    observed_change:
      "A documented public housing-finance release recorded opening of mixed-income housing with ground-floor commercial and office space.",
    area: "Downtown Jamaica / Queens",
    latitude: 40.7043,
    longitude: -73.7995,
    source_name: "NYC HDC release: Norman Towers opening",
    source_url:
      "https://www.nychdc.com/newsroom/new-york-city-and-state-housing-officials-join-bluestone-organization-and-partners",
    source_record_id: "nychdc-2014-10-30-norman-towers",
    source_date_field: "HDC release date",
    confidence: "documented",
    architect: "HDC release does not name the architect on the cited page",
    project_type: "mixed-income housing and commercial building opening",
    geometry_source: "Approximate point from 90-14 161st Street address in subagent notes.",
    geometry_precision: "site approximate",
    limitations:
      "The source records ribbon cutting and building program. It does not provide full permitting, certificate-of-occupancy, or long-term occupancy history."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_arverne_view_reopening_2014",
    date: "2014-10-27",
    bucket: "planning/development/architecture/housing rehabilitation",
    title: "Arverne View development reopened after post-Sandy rehabilitation",
    summary:
      "NYC HDC announced on October 27, 2014 the official reopening of Arverne View after post-Sandy rehabilitation work.",
    observed_change:
      "A documented public release recorded ceremonial reopening and rehabilitation completion for a Rockaway housing complex.",
    area: "Arverne / Rockaway Peninsula",
    latitude: 40.5945,
    longitude: -73.7891,
    source_name: "NYC HDC release: Arverne View reopening",
    source_url:
      "https://www.nychdc.com/newsroom/two-years-after-hurricane-sandy-lm-development-re-opens-arverne-view-housing-complex",
    source_record_id: "nychdc-2014-10-27-arverne-view-reopening",
    source_date_field: "HDC release date and reopening wording",
    confidence: "documented",
    architect: "HDC release does not name the architect on the cited page",
    project_type: "housing rehabilitation reopening",
    geometry_source:
      "Approximate campus point for Arverne View / former Ocean Village from subagent notes.",
    geometry_precision: "campus approximate",
    limitations:
      "The source records a ceremonial reopening and rehabilitation milestone. Individual building repairs, tenant return dates, and later resilience performance are separate evidence paths."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_mother_arnetta_crawford_apartments_opening_2015",
    date: "2015-10-16",
    bucket: "planning/development/architecture/affordable housing",
    title: "Mother Arnetta Crawford Apartments development opened",
    summary:
      "NYC HDC announced on October 16, 2015 the grand opening of Mother Arnetta Crawford Apartments at 1500 Hoe Avenue in the Bronx.",
    observed_change:
      "A documented city housing-finance release recorded opening of a seven-story affordable apartment building.",
    area: "Crotona Park East / Bronx",
    latitude: 40.8306,
    longitude: -73.8894,
    source_name: "NYC HDC release: Mother Arnetta Crawford Apartments opening",
    source_url:
      "https://www.nychdc.com/newsroom/city-officials-join-macquesten-and-union-grove-community-economic-development-corp-grand",
    source_record_id: "nychdc-2015-10-16-mother-arnetta-crawford-apartments",
    source_date_field: "HDC release date",
    confidence: "documented",
    architect: "HDC release does not name the architect on the cited page",
    project_type: "affordable apartment building opening",
    geometry_source: "Approximate point from 1500 Hoe Avenue address in subagent notes.",
    geometry_precision: "site approximate",
    limitations:
      "The source records the grand opening and building program. It does not verify DOB closeout, resident move-in sequence, service outcomes, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_barrier_free_living_residences_opening_2015",
    date: "2015-09-24",
    bucket: "planning/development/architecture/supportive housing",
    title: "Barrier Free Living Residences development opened in Mott Haven",
    summary:
      "NYC HDC announced on September 24, 2015 the grand opening of the Barrier Free Living Residences in Mott Haven.",
    observed_change:
      "A documented housing-finance release recorded opening of a two-building supportive housing development.",
    area: "Mott Haven / Bronx",
    latitude: 40.8056,
    longitude: -73.9162,
    source_name: "NYC HDC release: Barrier Free Living Residences opening",
    source_url:
      "https://www.nychdc.com/newsroom/city-officials-join-barrier-free-living-alembic-community-development-and-foxy-management",
    source_record_id: "nychdc-2015-09-24-barrier-free-living-residences",
    source_date_field: "HDC release date",
    confidence: "documented",
    architect: "HDC release does not name the architect on the cited page",
    project_type: "supportive affordable housing opening",
    geometry_source:
      "Approximate midpoint between 637 East 138th Street and 616 East 139th Street from subagent notes.",
    geometry_precision: "address-cluster approximate",
    limitations:
      "The source documents building opening and unit program. It does not provide resident-level data, service outcomes, or later operating history."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_east_new_york_resyndication_rehab_completion_2016",
    date: "2016-09-21",
    bucket: "planning/development/architecture/housing rehabilitation",
    title: "East New York rental portfolio rehabilitation development was announced complete",
    summary:
      "NYC HDC announced on September 21, 2016 a combined ribbon-cutting and groundbreaking event that included completion of an East New York rental portfolio rehabilitation.",
    observed_change:
      "A documented public release recorded a portfolio rehabilitation completion milestone for occupied affordable housing.",
    area: "East New York / Brooklyn",
    latitude: 40.6668,
    longitude: -73.8953,
    source_name: "NYC HDC release: East New York resyndication rehabilitation",
    source_url:
      "https://www.nychdc.com/newsroom/hpd-and-hdc-join-brp-companies-announce-preservation-and-creation-combined-total-710-low",
    source_record_id: "nychdc-2016-09-21-east-new-york-resyndication-rehab",
    source_date_field: "HDC release date; source also states rehabilitation completion in January 2015",
    confidence: "documented",
    architect: "HDC release does not name the architect on the cited page",
    project_type: "affordable housing portfolio rehabilitation completion",
    geometry_source:
      "Approximate East New York neighborhood point; source covers a multi-building portfolio and does not provide a single geometry.",
    geometry_precision: "neighborhood approximate",
    limitations:
      "This is a multi-site portfolio record. Individual building addresses, DOB records, and exact rehabilitation completion dates should be added before parcel-level analysis."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_beach_channel_senior_apartments_opening_2018",
    date: "2018-11-20",
    bucket: "planning/development/architecture/senior affordable housing",
    title: "Beach Channel Senior Apartments development opened in Far Rockaway",
    summary:
      "NYC HDC announced on November 20, 2018 the opening of Beach Channel Senior Apartments in Far Rockaway.",
    observed_change:
      "A documented housing-finance release recorded opening of senior affordable housing with community and medical facility space.",
    area: "Far Rockaway / Edgemere",
    latitude: 40.5975,
    longitude: -73.7654,
    source_name: "NYC HDC release: Beach Channel Senior Apartments opening",
    source_url:
      "https://www.nychdc.com/newsroom/affordable-housing-community-seniors-opens-far-rockaway-just-time-holidays",
    source_record_id: "nychdc-2018-11-20-beach-channel-senior-apartments",
    source_date_field: "HDC release date",
    confidence: "documented",
    architect: "HDC release does not name the architect on the cited page",
    project_type: "senior affordable housing opening",
    geometry_source:
      "Approximate point for Beach Channel Drive senior housing from subagent notes; source does not include a parcel geometry.",
    geometry_precision: "site approximate",
    limitations:
      "The source records opening only. It does not verify DOB closeout, lease-up, flood-resilience performance, medical-space operation, or later conditions."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_alvista_towers_completion_2019",
    date: "2019-02-12",
    bucket: "planning/development/architecture/mixed-income housing",
    title: "Alvista Towers development completion was announced in Jamaica",
    summary:
      "NYC HDC announced on February 12, 2019 that project partners unveiled and celebrated completion of Alvista Towers in Jamaica, Queens.",
    observed_change:
      "A documented public housing-finance release recorded a completion celebration for a mixed-income affordable housing development.",
    area: "Jamaica / Queens",
    latitude: 40.7016,
    longitude: -73.8003,
    source_name: "NYC HDC release: Alvista Towers completion",
    source_url:
      "https://www.nychdc.com/newsroom/hdc-and-hpd-join-project-partners-unveil-380-new-affordable-homes-jamaica-queens",
    source_record_id: "nychdc-2019-02-12-alvista-towers",
    source_date_field: "HDC release date and completion-celebration wording",
    confidence: "documented",
    architect: "GF55 Partners image credit appears in the candidate review; confirm from primary project records",
    project_type: "mixed-income affordable housing completion",
    geometry_source:
      "Approximate point near the Jamaica transit hub from subagent notes; verify address before parcel mapping.",
    geometry_precision: "site approximate",
    limitations:
      "The source is a completion/unveiling record. DOB completion, certificate-of-occupancy, and occupancy records should be checked before administrative closeout claims."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_archer_avenue_affordable_housing_opening_2019",
    date: "2019-10-09",
    bucket: "planning/development/architecture/affordable housing",
    title: "Archer Avenue affordable housing development opened in Jamaica",
    summary:
      "NYC HDC announced on October 9, 2019 a ribbon-cutting for new affordable housing at 92-61 165th Street in Jamaica, Queens.",
    observed_change:
      "A documented housing-finance release recorded opening of a 14-story affordable housing and commercial building.",
    area: "Jamaica / Queens",
    latitude: 40.7051,
    longitude: -73.7956,
    source_name: "NYC HDC release: Archer Avenue affordable housing opening",
    source_url:
      "https://www.nychdc.com/newsroom/city-and-elected-officials-join-arker-companies-celebrate-new-100-affordable-housing",
    source_record_id: "nychdc-2019-10-09-archer-avenue-affordable-housing",
    source_date_field: "HDC release date",
    confidence: "documented",
    architect: "HDC release does not name the architect on the cited page",
    project_type: "affordable housing and commercial building opening",
    geometry_source: "Approximate point from 92-61 165th Street address in subagent notes.",
    geometry_precision: "site approximate",
    limitations:
      "The source records ribbon cutting and program. It does not provide a full permit history, certificate-of-occupancy date, or long-term retail occupancy."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_archer_green_opening_2021",
    date: "2021-12-01",
    bucket: "planning/development/architecture/mixed-use affordable housing",
    title: "Archer Green mixed-use development opened in Downtown Jamaica",
    summary:
      "NYC HDC announced on December 1, 2021 the opening of Archer Green, a mixed-use affordable housing development in Downtown Jamaica.",
    observed_change:
      "A documented public release recorded opening of affordable housing, community facility, commercial, and grocery-store space.",
    area: "Downtown Jamaica / Queens",
    latitude: 40.7072,
    longitude: -73.7935,
    source_name: "NYC HDC release: Archer Green opening",
    source_url:
      "https://www.nychdc.com/newsroom/nyc-hdc-hpd-edc-and-elected-officials-celebrate-opening-new-affordable-housing-development",
    source_record_id: "nychdc-2021-12-01-archer-green",
    source_date_field: "HDC release date",
    confidence: "documented",
    architect: "HDC release does not name the architect on the cited page",
    project_type: "mixed-use affordable housing opening",
    geometry_source:
      "Approximate point for the former NYPD garage redevelopment near 168th Street from subagent notes.",
    geometry_precision: "site approximate",
    limitations:
      "The source documents opening celebration and project program. It does not provide detailed design-team, lease-up, grocery-store operation, or long-term management data."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_park_terrace_west_217th_historic_district_designated_2018",
    date: "2018-12-11",
    bucket: "planning/development/architecture/historic district designation",
    title: "Park Terrace West-West 217th Street Historic District designation was recorded",
    summary:
      "NYC Landmarks Preservation Commission announced on December 11, 2018 the designation of the Park Terrace West-West 217th Street Historic District in Inwood.",
    observed_change:
      "A documented LPC press release recorded a historic district designation covering early-20th-century Inwood apartment houses.",
    area: "Inwood / Manhattan",
    latitude: 40.8727,
    longitude: -73.9166,
    source_name: "NYC LPC release: Park Terrace West-West 217th Street Historic District",
    source_url:
      "https://www.nyc.gov/site/lpc/about/pr2018/lpc-designates-the-park-terrace-west-west-217th-street-historic-district-in-inwood.page",
    source_record_id: "lpc-2018-12-11-park-terrace-west-217th-historic-district",
    source_date_field: "LPC press-release designation date",
    confidence: "documented",
    architect: "LPC release covers district character rather than a single project architect",
    project_type: "historic district designation",
    geometry_source:
      "Approximate district point near Park Terrace West and West 217th Street from subagent notes; use LPC polygon for final mapping.",
    geometry_precision: "district centroid approximate",
    limitations:
      "The event records designation status only. It does not record original construction dates, individual building alterations, or later permit actions."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_sunset_park_four_historic_districts_designated_2019",
    date: "2019-06-18",
    bucket: "planning/development/architecture/historic district designation",
    title: "Four Sunset Park historic district designations were recorded",
    summary:
      "NYC Landmarks Preservation Commission announced on June 18, 2019 the designation of four historic districts in Sunset Park.",
    observed_change:
      "A documented LPC release recorded designation of grouped historic districts of late-19th and early-20th-century row houses and apartment houses.",
    area: "Sunset Park / Brooklyn",
    latitude: 40.6425,
    longitude: -74.0086,
    source_name: "NYC LPC release: Four Sunset Park historic districts",
    source_url: "https://www.nyc.gov/site/lpc/about/pr2019/lpc-designates-four-historic-districts-in-sunset-park.page",
    source_record_id: "lpc-2019-06-18-four-sunset-park-historic-districts",
    source_date_field: "LPC press-release designation date",
    confidence: "documented",
    architect: "LPC release covers multiple districts rather than a single project architect",
    project_type: "historic district designation",
    geometry_source:
      "Approximate neighborhood centroid across four districts from subagent notes; use four LPC polygons for district-level mapping.",
    geometry_precision: "neighborhood/district centroid approximate",
    limitations:
      "The grouped event covers four designations. Split into separate records if polygon-level geometry or district-by-district analysis is needed."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_bay_ridge_doctors_row_historic_district_designated_2019",
    date: "2019-06-25",
    bucket: "planning/development/architecture/historic district designation",
    title: "Bay Ridge Parkway-Doctors' Row Historic District designation was recorded",
    summary:
      "NYC Landmarks Preservation Commission announced on June 25, 2019 the designation of the Bay Ridge Parkway-Doctors' Row Historic District.",
    observed_change:
      "A documented LPC release recorded designation of a historic district of early-20th-century row houses in Bay Ridge.",
    area: "Bay Ridge / Brooklyn",
    latitude: 40.6299,
    longitude: -74.0267,
    source_name: "NYC LPC release: Bay Ridge Parkway-Doctors' Row Historic District",
    source_url:
      "https://www.nyc.gov/site/lpc/about/pr2019/lpc-designates-the-first-historic-district-in-bay-ridge-brooklyn.page",
    source_record_id: "lpc-2019-06-25-bay-ridge-doctors-row-historic-district",
    source_date_field: "LPC press-release designation date",
    confidence: "documented",
    architect: "LPC release covers district character rather than a single project architect",
    project_type: "historic district designation",
    geometry_source:
      "Approximate point on Bay Ridge Parkway between 4th and 5th avenues from subagent notes; use LPC district polygon for final mapping.",
    geometry_precision: "district centroid approximate",
    limitations:
      "The event records designation status only. It does not record original construction dates or subsequent changes to individual houses."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_dorrance_brooks_square_harlem_branch_designated_2021",
    date: "2021-06-15",
    bucket: "planning/development/architecture/historic district designation",
    title: "Dorrance Brooks Square Historic District and Harlem Branch Library designations were recorded",
    summary:
      "NYC Landmarks Preservation Commission announced on June 15, 2021 designation of the Dorrance Brooks Square Historic District and the NYPL Harlem Branch as an individual landmark.",
    observed_change:
      "A documented LPC release recorded paired landmark designations in Central Harlem.",
    area: "Central Harlem / Manhattan",
    latitude: 40.8172,
    longitude: -73.9422,
    source_name: "NYC LPC release: Dorrance Brooks Square and Harlem Branch Library",
    source_url:
      "https://www.nyc.gov/site/lpc/about/pr2021/lpc-designates-a-historic-district-and-public-library-in-harlem.page",
    source_record_id: "lpc-2021-06-15-dorrance-brooks-square-harlem-branch-library",
    source_date_field: "LPC press-release designation date",
    confidence: "documented",
    architect: "NYPL Harlem Branch is identified by LPC as a McKim, Mead & White building",
    project_type: "historic district and individual landmark designation",
    geometry_source:
      "Approximate point near Dorrance Brooks Square from subagent notes; district and library should be mapped separately if split.",
    geometry_precision: "representative district point approximate",
    limitations:
      "The source groups a district and a library landmark. Split into separate geometry records if the atlas requires one geometry per event."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_kimlau_war_memorial_landmark_designated_2021",
    date: "2021-06-22",
    bucket: "planning/development/architecture/individual landmark designation",
    title: "Kimlau War Memorial landmark designation was recorded",
    summary:
      "NYC Landmarks Preservation Commission announced on June 22, 2021 the designation of the Kimlau War Memorial in Chinatown as an individual landmark.",
    observed_change:
      "A documented LPC release recorded individual-landmark designation of a granite ceremonial gateway and public monument.",
    area: "Chinatown / Manhattan",
    latitude: 40.7147,
    longitude: -73.9972,
    source_name: "NYC LPC release: Kimlau War Memorial landmark designation",
    source_url:
      "https://www.nyc.gov/site/lpc/about/pr2021/lpc-recognizes-native-american-and-chinese-american-history-with-the-designation-of-two-individual-landmarks.page",
    source_record_id: "lpc-2021-06-22-kimlau-war-memorial-landmark",
    source_date_field: "LPC press-release designation date",
    confidence: "documented",
    architect: "Poy Gum Lee",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point at Kimlau Square from subagent notes.",
    geometry_precision: "site approximate",
    limitations:
      "The cited LPC release also covers a separate Staten Island archaeological-site designation; this record refers only to the Kimlau War Memorial."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_truesdell_house_227_duffield_landmark_designated_2021",
    date: "2021-02-02",
    bucket: "planning/development/architecture/individual landmark designation",
    title: "227 Duffield Street landmark designation was recorded",
    summary:
      "NYC public communications recorded February 2, 2021 designation of the Harriet and Thomas Truesdell House at 227 Duffield Street as an individual landmark.",
    observed_change:
      "A documented public announcement recorded individual-landmark designation of a Greek Revival row house associated with abolitionist history.",
    area: "Downtown Brooklyn / Brooklyn",
    latitude: 40.6912,
    longitude: -73.9848,
    source_name: "NYC Community Affairs Unit newsletter linking LPC designation announcement",
    source_url: "https://www.nyc.gov/assets/cau/html/newsletters/newsletter-2021-02-05.html",
    source_record_id: "nyc-cau-2021-02-05-227-duffield-street-landmark",
    source_date_field: "NYC/LPC public announcement and designation date",
    confidence: "documented",
    architect: "Announcement does not name the original architect",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point from 227 Duffield Street address in subagent notes.",
    geometry_precision: "address/site approximate",
    limitations:
      "The accessible source is a public newsletter linking the LPC designation announcement. The LPC designation report should be added for architectural detail."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_beverley_square_ditmas_park_west_historic_districts_designated_2025",
    date: "2025-11-25",
    bucket: "planning/development/architecture/historic district designation",
    title: "Beverley Square West and Ditmas Park West Historic District designations were recorded",
    summary:
      "NYC Landmarks Preservation Commission announced on November 25, 2025 the designation of the Beverley Square West and Ditmas Park West Historic Districts in Flatbush.",
    observed_change:
      "A documented LPC release recorded two Flatbush historic district designations.",
    area: "Flatbush / Brooklyn",
    latitude: 40.6408,
    longitude: -73.9653,
    source_name: "NYC LPC release: Beverley Square West and Ditmas Park West historic districts",
    source_url: "https://www.nyc.gov/site/lpc/about/pr2025/lpc-designates-two-new-historic-districts-in-flatbush.page",
    source_record_id: "lpc-2025-11-25-beverley-square-west-ditmas-park-west",
    source_date_field: "LPC press-release designation date",
    confidence: "documented",
    architect:
      "LPC release names several architects associated with the districts, including John J. Petit, John B. Slee, Benjamin Driesler, and Arlington D. Isham",
    project_type: "historic district designation",
    geometry_source:
      "Approximate Flatbush point between the two districts from subagent notes; use LPC polygons for district-level mapping.",
    geometry_precision: "district centroid approximate",
    limitations:
      "The grouped event covers two districts. Split into separate records if district-level geometry, building lists, or permit analysis are needed."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_upper_newtownards_512_516_outdoor_seating_advertised_2026",
    date: "2026-05-15",
    bucket: "planning/development/architecture/hospitality public realm application",
    title: "512-516 Upper Newtownards Road outdoor-seating development application was advertised",
    summary:
      "Belfast City Council's current applications page for Friday May 15, 2026 listed LA04/2026/0619/F for change of use of land to enclosed outdoor seating and associated works at 512-516 Upper Newtownards Road.",
    observed_change:
      "A documented council public notice recorded an advertised planning application for hospitality-related outdoor seating works.",
    area: "Ballyhackamore / Upper Newtownards Road",
    latitude: 54.594,
    longitude: -5.845,
    source_name: "Belfast City Council current planning applications",
    source_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    source_record_id: "bcc-current-applications-2026-05-15-la04-2026-0619-upper-newtownards-road",
    source_date_field: "Council current-applications table advertised on Friday 15 May 2026",
    confidence: "documented",
    architect: "Council current-applications page does not name the architect",
    project_type: "outdoor seating planning application advertisement",
    geometry_source: "Approximate road-front point from subagent geocode notes; not a surveyed site boundary.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records an application advertisement only. It does not document planning permission, construction, implementation, or long-term operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_2_4_bruce_street_structural_bracing_advertised_2026",
    date: "2026-05-15",
    bucket: "planning/development/architecture/listed office alteration application",
    title: "2-4 Bruce Street office-alteration development application was advertised",
    summary:
      "Belfast City Council's current applications page for Friday May 15, 2026 listed LA04/2026/0782/F for structural bracing works to an existing office building at 2-4 Bruce Street.",
    observed_change:
      "A documented council public notice recorded an advertised planning application for structural bracing to a city-centre office building.",
    area: "Bruce Street / Linen Quarter",
    latitude: 54.5937,
    longitude: -5.9324,
    source_name: "Belfast City Council current planning applications",
    source_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    source_record_id: "bcc-current-applications-2026-05-15-la04-2026-0782-bruce-street",
    source_date_field: "Council current-applications table advertised on Friday 15 May 2026",
    confidence: "documented",
    architect: "Council current-applications page does not name the architect",
    project_type: "office structural bracing planning application advertisement",
    geometry_source: "Approximate street-address point from subagent geocode notes; not a building footprint.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records an application advertisement only. It does not confirm listed-building consent, final scope, construction, or completion of works."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_berry_street_22_24_shopfront_fenestration_advertised_2026",
    date: "2026-05-15",
    bucket: "planning/development/architecture/shopfront alteration application",
    title: "22-24 Berry Street shopfront development applications were advertised",
    summary:
      "Belfast City Council's current applications page for Friday May 15, 2026 listed LA04/2026/0809/F and LA04/2026/0810/DCA for shopfront alteration and demolition-in-conservation-area works at 22-24 Berry Street.",
    observed_change:
      "A documented council public notice recorded advertised planning applications for shopfront and conservation-area alteration works.",
    area: "Berry Street / Cathedral Quarter edge",
    latitude: 54.601,
    longitude: -5.9287,
    source_name: "Belfast City Council current planning applications",
    source_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    source_record_id: "bcc-current-applications-2026-05-15-la04-2026-0809-0810-berry-street",
    source_date_field: "Council current-applications table advertised on Friday 15 May 2026",
    confidence: "documented",
    architect: "Council current-applications page does not name the architect",
    project_type: "shopfront and conservation-area alteration application advertisement",
    geometry_source: "Approximate address point from subagent geocode notes.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records application advertisements only. It does not confirm consent, conservation-area assessment outcome, physical works, or occupation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_blackstaff_chambers_serviced_apartments_advertised_2026",
    date: "2026-05-08",
    bucket: "planning/development/architecture/mixed-use redevelopment application",
    title: "Blackstaff Chambers mixed-use development application was advertised",
    summary:
      "Belfast City Council's current applications page for Friday May 8, 2026 listed LA04/2026/0482/F for demolition and construction of an 11-storey mixed-use development at Blackstaff Chambers, 2 Amelia Street.",
    observed_change:
      "A documented council public notice recorded an advertised application for a serviced-apartment, retail, and office redevelopment.",
    area: "Amelia Street / Linen Quarter",
    latitude: 54.5938,
    longitude: -5.9308,
    source_name: "Belfast City Council current planning applications",
    source_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    source_record_id: "bcc-current-applications-2026-05-08-la04-2026-0482-blackstaff-chambers",
    source_date_field: "Council current-applications table advertised on Friday 8 May 2026",
    confidence: "documented",
    architect: "Council current-applications page does not name the architect",
    project_type: "mixed-use redevelopment planning application advertisement",
    geometry_source: "Approximate point for 2 Amelia Street / Blackstaff Chambers from subagent geocode notes.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an advertised proposal. It does not document approval, demolition, construction, final height, serviced-apartment operation, or completion."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_joy_street_24_short_term_let_advertised_2026",
    date: "2026-05-08",
    bucket: "planning/development/architecture/listed-building change-of-use application",
    title: "24 Joy Street short-term-let development application was advertised",
    summary:
      "Belfast City Council's current applications page for Friday May 8, 2026 listed LA04/2026/0599/F for change of use of 24 Joy Street from residential to short-term-let accommodation with retrospective internal alterations to a listed building.",
    observed_change:
      "A documented council public notice recorded an advertised change-of-use and listed-building alteration application.",
    area: "Joy Street / Markets area",
    latitude: 54.5928,
    longitude: -5.9254,
    source_name: "Belfast City Council current planning applications",
    source_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    source_record_id: "bcc-current-applications-2026-05-08-la04-2026-0599-joy-street",
    source_date_field: "Council current-applications table advertised on Friday 8 May 2026",
    confidence: "documented",
    architect: "Council current-applications page does not name the architect",
    project_type: "short-term-let change-of-use planning application advertisement",
    geometry_source: "Approximate street-address point from subagent geocode notes.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records an application advertisement only. It does not confirm consent, lawful use, heritage impact, construction, or operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_europa_bus_centre_padel_market_extension_advertised_2026",
    date: "2026-05-08",
    bucket: "planning/development/architecture/temporary leisure application",
    title: "Former Europa Bus Centre temporary leisure development application was advertised",
    summary:
      "Belfast City Council's current applications page for Friday May 8, 2026 listed LA04/2026/0629/F for temporary padel courts, market-related structures, seating, and landscaping at the former Europa Bus Centre.",
    observed_change:
      "A documented council public notice recorded an advertised application to extend temporary leisure and market uses at the former bus-centre site.",
    area: "Glengall Street / Great Victoria Street",
    latitude: 54.5947,
    longitude: -5.9365,
    source_name: "Belfast City Council current planning applications",
    source_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    source_record_id: "bcc-current-applications-2026-05-08-la04-2026-0629-europa-bus-centre",
    source_date_field: "Council current-applications table advertised on Friday 8 May 2026",
    confidence: "documented",
    architect: "Council current-applications page does not name the architect",
    project_type: "temporary leisure and market planning application advertisement",
    geometry_source: "Approximate point for the former Europa Bus Centre site from subagent geocode notes.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an advertised temporary-use application. It does not confirm permission, duration, implementation, permanent redevelopment, or long-term use."
  }
];

const records = sourceRecords.map((record) => {
  const sourceId = sourceByCity[record.city_id];
  if (!sourceId) {
    throw new Error(`No source configured for city_id ${record.city_id}`);
  }
  return {
    ...record,
    source_ids: [sourceId],
    source_retrieved_at: retrievedAt,
    source_dataset_id: sourceId
  };
});

const existingIds = new Set(doc.events.map((event) => event.event_id));
const duplicateIds = records.filter((event) => existingIds.has(event.event_id)).map((event) => event.event_id);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate event_id values: ${duplicateIds.join(", ")}`);
}

const duplicateSourceRecords = records
  .filter((event) =>
    doc.events.some(
      (existing) =>
        existing.city_id === event.city_id &&
        existing.source_record_id === event.source_record_id &&
        existing.source_url === event.source_url
    )
  )
  .map((event) => event.event_id);
if (duplicateSourceRecords.length > 0) {
  throw new Error(`Duplicate source records: ${duplicateSourceRecords.join(", ")}`);
}

doc.events.push(...records);
doc.sources = doc.sources.map((source) => {
  if (Object.values(sourceByCity).includes(source.source_id)) {
    return {
      ...source,
      retrieved_at: retrievedAt
    };
  }
  return source;
});

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${path}`);
