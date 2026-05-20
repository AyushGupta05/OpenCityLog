const fs = require("fs");
const path = require("path");

const retrievedAt = "2026-05-19";
const corpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const sourceRegistryPath = "config/source_registry.json";

const candidatePaths = {
  londonPlanningDataHighVolume: "tmp/subagents/round119_london_planning_data_high_volume/candidates.json",
  londonGlaMajorAppsDeep: "tmp/subagents/round119_london_gla_major_apps_deep/candidates.json",
  londonPlanningDataLocal: "tmp/subagents/round119_london_planning_data_local/candidates.json",
  nycDobLegacyBulk: "tmp/subagents/round119_nyc_dob_legacy_bulk/candidates.json",
  nycPublicFacilitiesPages: "tmp/subagents/round119_nyc_public_facilities_pages/candidates.json",
  belfastPlanningPortalMore: "tmp/subagents/round119_belfast_planning_portal_more/candidates.json",
  belfastPublicFacilitiesMore: "tmp/subagents/round119_belfast_public_facilities_more/candidates.json",
  londonPublicFacilitiesOfficial: "tmp/subagents/round120_london_public_facilities_official/candidates.json",
  nycDdcProjectsOfficial: "tmp/subagents/round120_nyc_ddc_projects_official/candidates.json",
  nycLibrariesScaNarrow: "tmp/subagents/round120_nyc_libraries_sca_narrow/candidates.json",
  nycLpcDesignationsMore: "tmp/subagents/round120_nyc_lpc_designations_more/candidates.json",
  belfastHeritageHarniMore: "tmp/subagents/round120_belfast_heritage_harni_more/candidates.json",
  belfastDecisionsCommitteeMore: "tmp/subagents/round121_belfast_decisions_committee_more/candidates.json",
  londonGlaPldLbcMore: "tmp/subagents/round121_london_gla_pld_lbc_more/candidates.json",
  londonOfficialFacilitiesMore: "tmp/subagents/round121_london_official_facilities_more/candidates.json",
  nycPublicFacilitiesMore: "tmp/subagents/round121_nyc_public_facilities_more/candidates.json",
  belfastMajorPlanningDecisions: "tmp/subagents/round122_belfast_major_planning_decisions/candidates.json",
  londonBoroughMajorSchemes: "tmp/subagents/round122_london_borough_major_schemes/candidates.json",
  nycLpcPermitsDesignations: "tmp/subagents/round122_nyc_lpc_permits_designations/candidates.json",
  nycPublicSchoolsGeocoded: "tmp/subagents/round122_nyc_public_schools_geocoded/candidates.json",
  londonHeritageDesignations: "tmp/subagents/round123_london_heritage_designations/candidates.json",
  belfastPublicFacilitiesUniversitiesHealth: "tmp/subagents/round123_belfast_public_facilities_universities_health/candidates.json",
  belfastPlanningPortalCommitteeMore: "tmp/subagents/round123_belfast_planning_portal_committee_more/candidates.json",
  londonLddArchiveCompletions: "tmp/subagents/round124_london_ldd_archive_completions/candidates.json",
  nycPublicDesignCommission: "tmp/subagents/round124_nyc_public_design_commission/candidates.json",
  belfastPlanningAppealsDfcPublicRealm: "tmp/subagents/round124_belfast_planning_appeals_dfc_public_realm/candidates.json",
  londonLddArchiveCompletionsNext: "tmp/subagents/round125_london_ldd_archive_completions_next/candidates.json",
  nycDcpZapLanduse: "tmp/subagents/round125_nyc_dcp_zap_landuse/candidates.json",
  belfastCivicPublicRealmGeocoded: "tmp/subagents/round125_belfast_civic_public_realm_geocoded/candidates.json",
  belfastGeocodePreviousRejects: "tmp/subagents/round125_belfast_geocode_previous_rejects/candidates.json",
  londonMajorBoroughDecisionsFacilities: "tmp/subagents/round125_london_major_borough_decisions_facilities/candidates.json",
  nycCivicCapitalProjects: "tmp/subagents/round125_nyc_civic_capital_projects/candidates.json",
  londonPldLifecycleDirect: "tmp/subagents/round126_london_pld_lifecycle_direct/candidates.json",
  londonPlanningAppealsCalledInMore: "tmp/subagents/round126_london_planning_appeals_calledin_more/candidates.json",
  belfastPlanningPortalOfficialMore: "tmp/subagents/round126_belfast_planning_portal_official_more/candidates.json",
  londonPldLifecycleMore: "tmp/subagents/round126_london_pld_lifecycle_more/candidates.json",
  nycPdcMoreDesignReview: "tmp/subagents/round126_nyc_pdc_more_design_review/candidates.json",
  nycDotPublicRealmReconstruction: "tmp/subagents/round127_nyc_dot_public_realm_reconstruction/candidates.json",
  londonOfficialPublicRealmProjects: "tmp/subagents/round127_london_official_public_realm_projects/candidates.json",
  nycCapitalProjectsDashboardActualConstruction: "tmp/subagents/round128_nyc_capital_projects_dashboard/candidates.json",
  belfastHarniSpatial: "tmp/subagents/round128_belfast_harni_spatial/candidates.json",
  londonLddArchiveMore: "tmp/subagents/round129_london_ldd_archive_more/candidates.json",
  londonDfeGiasEducationRegister: "tmp/subagents/round130_london_official_more/candidates.json",
  nycDcpPublicAccessOfficial: "tmp/subagents/round130_nyc_official_more/candidates.json",
  belfastHedScheduledZones: "tmp/subagents/round130_belfast_official_more/candidates.json",
  heritageDesignationsMore: "tmp/subagents/round130_heritage_designations_more/candidates.json",
  belfastPlanningStatisticsRound131: "tmp/subagents/round131_belfast_planning_statistics/candidates.json",
  londonLddArchiveNextRound132: "tmp/subagents/round132_london_ldd_archive_next/candidates.json",
  nycDobNowOfficialRound133: "tmp/subagents/round133_nyc_official_architecture/candidates.json",
  belfastPlanningStatisticsDeep: "tmp/subagents/round134_belfast_planning_statistics_deep/candidates.json",
  londonLddArchiveNext2Round135: "tmp/subagents/round135_london_ldd_archive_next2/candidates.json",
  nycDobNowMoreRound136: "tmp/subagents/round136_nyc_dob_now_more/candidates.json",
  belfastPlanningStatisticsMoreRound137: "tmp/subagents/round137_belfast_planning_statistics_more/candidates.json",
  nycLpcIndividualLandmarkGapsRound138: "tmp/subagents/round138_nyc_lpc_individual_landmark_gaps/candidates.json",
  londonCertificateImmunityGapsRound139: "tmp/subagents/round139_london_certificate_immunity_gaps/candidates.json",
  londonPldLifecycleMoreRound140: "tmp/subagents/round140_london_pld_lifecycle_more/candidates.json",
  nycLpcDesignationGapsRound142: "tmp/subagents/round142_nyc_lpc_designation_gaps/candidates.json",
  nycDobNowEvenMoreRound143: "tmp/subagents/round143_nyc_dob_now_even_more/candidates.json",
  londonLddArchiveNext3Round144: "tmp/subagents/round144_london_ldd_archive_next3/candidates.json",
  belfastPlanningStatisticsNextRound145: "tmp/subagents/round145_belfast_planning_statistics_next/candidates.json",
  londonLddArchiveNext4Round146: "tmp/subagents/round146_london_ldd_archive_next4/candidates.json",
  londonPldLifecycleNextRound147: "tmp/subagents/round147_london_pld_lifecycle_next/candidates.json",
  londonLddArchiveNext5Round148: "tmp/subagents/round148_london_ldd_archive_next5/candidates.json",
  nycDobNowNextRound149: "tmp/subagents/round149_nyc_dob_now_next/candidates.json",
  londonPldLifecycleNext2Round150: "tmp/subagents/round150_london_pld_lifecycle_next2/candidates.json",
  belfastPlanningStatisticsNext2Round151: "tmp/subagents/round151_belfast_planning_statistics_next2/candidates.json",
  nycDobNowNext2Round152: "tmp/subagents/round152_nyc_dob_now_next2/candidates.json",
  londonPldLifecycleNext3Round153: "tmp/subagents/round153_london_pld_lifecycle_next3/candidates.json",
  nycLpcPermitDeepRound154: "tmp/subagents/round154_nyc_lpc_permit_deep/candidates.json",
  nycDobCoNextRound155: "tmp/subagents/round155_nyc_dob_co_next/candidates.json",
  belfastOfficialHeritageTailRound156: "tmp/subagents/round156_belfast_official_heritage_tail/candidates.json",
  londonPldLifecycleNext4Round157: "tmp/subagents/round157_london_pld_lifecycle_next4/candidates.json",
  nycDobNowNext3Round158: "tmp/subagents/round158_nyc_dob_now_next3/candidates.json",
  nycLpcPermitNextRound159: "tmp/subagents/round159_nyc_lpc_permit_next/candidates.json",
  nycDobCoNext2Round160: "tmp/subagents/round160_nyc_dob_co_next2/candidates.json",
  londonPldLifecycleNext5Round161: "tmp/subagents/round161_london_pld_lifecycle_next5/candidates.json",
  nycDobNowNext4Round162: "tmp/subagents/round162_nyc_dob_now_next4/candidates.json",
  nycLpcPermitNext2Round163: "tmp/subagents/round163_nyc_lpc_permit_next2/candidates.json",
  nycDobCoNext3Round164: "tmp/subagents/round164_nyc_dob_co_next3/candidates.json",
  belfastPlanningStatisticsNext3Round165: "tmp/subagents/round165_belfast_planning_statistics_next3/candidates.json",
  londonPldLifecycleNext6Round166: "tmp/subagents/round166_london_pld_lifecycle_next6/candidates.json",
  nycDobNowNext5Round167: "tmp/subagents/round167_nyc_dob_now_next5/candidates.json",
  nycLpcPermitNext3Round168: "tmp/subagents/round168_nyc_lpc_permit_next3/candidates.json",
  nycDobCoNext4Round169: "tmp/subagents/round169_nyc_dob_co_next4/candidates.json",
  londonLddArchiveNext6Round170: "tmp/subagents/round170_london_ldd_archive_next6/candidates.json",
  belfastPlanningStatisticsNext4Round171: "tmp/subagents/round171_belfast_planning_statistics_next4/candidates.json",
  londonPldLifecycleNext7Round172: "tmp/subagents/round172_london_pld_lifecycle_next7/candidates.json",
  nycDobNowNext6Round173: "tmp/subagents/round173_nyc_dob_now_next6/candidates.json",
  nycLpcPermitNext4Round174: "tmp/subagents/round174_nyc_lpc_permit_next4/candidates.json",
  nycDobCoNext5Round175: "tmp/subagents/round175_nyc_dob_co_next5/candidates.json",
  londonLddArchiveNext7Round176: "tmp/subagents/round176_london_ldd_archive_next7/candidates.json",
  belfastOfficialArchitectureExpansionRound177: "tmp/subagents/round177_belfast_official_architecture_expansion/candidates.json",
  londonPldLifecycleNext8Round178: "tmp/subagents/round178_london_pld_lifecycle_next8/candidates.json",
  nycDobNowNext7Round179: "tmp/subagents/round179_nyc_dob_now_next7/candidates.json",
  nycLpcPermitNext5Round180: "tmp/subagents/round180_nyc_lpc_permit_next5/candidates.json",
  nycDobCoNext6Round181: "tmp/subagents/round181_nyc_dob_co_next6/candidates.json",
  londonLddArchiveNext8Round182: "tmp/subagents/round182_london_ldd_archive_next8/candidates.json",
  belfastDeepPublicRealmRound183: "tmp/subagents/round183_belfast_deep_public_realm/candidates.json",
  londonPldLifecycleNext9Round184: "tmp/subagents/round184_london_pld_lifecycle_next9/candidates.json",
  nycDobNowNext8Round185: "tmp/subagents/round185_nyc_dob_now_next8/candidates.json",
  nycLpcPermitNext6Round186: "tmp/subagents/round186_nyc_lpc_permit_next6/candidates.json",
  nycDobCoNext7Round187: "tmp/subagents/round187_nyc_dob_co_next7/candidates.json",
  londonLddArchiveNext9Round188: "tmp/subagents/round188_london_ldd_archive_next9/candidates.json",
  belfastDeepCommitteeRound189: "tmp/subagents/round189_belfast_deep_committee/candidates.json",
  londonPldLifecycleNext10Round190: "tmp/subagents/round190_london_pld_lifecycle_next10/candidates.json",
  nycDobNowNext9Round191: "tmp/subagents/round191_nyc_dob_now_next9/candidates.json",
  nycLpcPermitNext7Round192: "tmp/subagents/round192_nyc_lpc_permit_next7/candidates.json",
  nycDobCoNext8Round193: "tmp/subagents/round193_nyc_dob_co_next8/candidates.json",
  londonLddArchiveNext10Round194: "tmp/subagents/round194_london_ldd_archive_next10/candidates.json",
  belfastDeepTailRound195: "tmp/subagents/round195_belfast_deep_tail/candidates.json",
  londonPldLifecycleNext11Round196: "tmp/subagents/round196_london_pld_lifecycle_next11/candidates.json",
  nycDobNowNext10Round197: "tmp/subagents/round197_nyc_dob_now_next10/candidates.json",
  nycLpcPermitNext8Round198: "tmp/subagents/round198_nyc_lpc_permit_next8/candidates.json",
  nycDobCoNext9Round199: "tmp/subagents/round199_nyc_dob_co_next9/candidates.json",
  londonLddArchiveNext11Round200: "tmp/subagents/round200_london_ldd_archive_next11/candidates.json",
  belfastFinalDeepTailRound201: "tmp/subagents/round201_belfast_final_deep_tail/candidates.json",
  londonPldLifecycleNext12Round202: "tmp/subagents/round202_london_pld_lifecycle_next12/candidates.json",
  nycDobNowNext11Round203: "tmp/subagents/round203_nyc_dob_now_next11/candidates.json",
  nycLpcPermitNext9Round204: "tmp/subagents/round204_nyc_lpc_permit_next9/candidates.json",
  nycDobCoNext10Round205: "tmp/subagents/round205_nyc_dob_co_next10/candidates.json",
  londonLddArchiveNext12Round206: "tmp/subagents/round206_london_ldd_archive_next12/candidates.json",
  belfastOfficialTailDiscoveryRound207: "tmp/subagents/round207_belfast_official_tail_or_discovery/candidates.json",
  londonPldLifecycleNext13Round208: "tmp/subagents/round208_london_pld_lifecycle_next13/candidates.json",
  nycDobNowNext12Round209: "tmp/subagents/round209_nyc_dob_now_next12/candidates.json",
  nycLpcPermitNext10Round210: "tmp/subagents/round210_nyc_lpc_permit_next10/candidates.json",
  nycDobCoNext11Round211: "tmp/subagents/round211_nyc_dob_co_next11/candidates.json",
  londonLddArchiveNext13Round212: "tmp/subagents/round212_london_ldd_archive_next13/candidates.json",
  nycHpdAffordableHousingNextRound213: "tmp/subagents/round213_nyc_hpd_affordable_housing_next/candidates.json",
  belfastOfficialDeepTailRound214: "tmp/subagents/round214_belfast_official_deep_tail/candidates.json",
  londonNhleHeritageTailRound215: "tmp/subagents/round215_london_nhle_heritage_tail/candidates.json",
  nycLpcDesignationTailRound216: "tmp/subagents/round216_nyc_lpc_designation_tail/candidates.json",
  londonPldLifecycleNext14Round217: "tmp/subagents/round217_london_pld_lifecycle_next14/candidates.json",
  nycLpcPermitNext11Round218: "tmp/subagents/round218_nyc_lpc_permit_next11/candidates.json",
  nycDobCoNext12Round219: "tmp/subagents/round219_nyc_dob_co_next12/candidates.json",
  londonLddArchiveNext14Round220: "tmp/subagents/round220_london_ldd_archive_next14/candidates.json",
  nycHpdAffordableHousingNext2Round221: "tmp/subagents/round221_nyc_hpd_affordable_housing_next2/candidates.json",
  nycDobNowNext13Round222: "tmp/subagents/round222_nyc_dob_now_next13/candidates.json",
  londonPldLifecycleNext15Round223: "tmp/subagents/round223_london_pld_lifecycle_next15/candidates.json",
  nycLpcPermitNext12Round224: "tmp/subagents/round224_nyc_lpc_permit_next12/candidates.json",
  nycDobCoNext13Round225: "tmp/subagents/round225_nyc_dob_co_next13/candidates.json",
  londonLddArchiveNext15Round226: "tmp/subagents/round226_london_ldd_archive_next15/candidates.json",
  nycDobNowNext14Round227: "tmp/subagents/round227_nyc_dob_now_next14/candidates.json",
  belfastOfficialDeepTailNextRound228: "tmp/subagents/round228_belfast_official_deep_tail_next/candidates.json",
  nycHpdAffordableHousingNext3Round229: "tmp/subagents/round229_nyc_hpd_affordable_housing_next3/candidates.json",
  londonPldLifecycleNext16Round230: "tmp/subagents/round230_london_pld_lifecycle_next16/candidates.json",
  nycLpcPermitNext13Round231: "tmp/subagents/round231_nyc_lpc_permit_next13/candidates.json",
  nycDobCoNext14Round232: "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",
  londonLddArchiveNext16Round233: "tmp/subagents/round233_london_ldd_archive_next16/candidates.json",
  nycHpdAffordableHousingNext4Round234: "tmp/subagents/round234_nyc_hpd_affordable_housing_next4/candidates.json",
  nycHpdAffordableHousingNext5Round236: "tmp/subagents/round236_nyc_hpd_affordable_housing_next5/candidates.json",
  nycDobNowResidualNext15Round237: "tmp/subagents/round237_nyc_dob_now_residual_next15/candidates.json",
  londonPldLifecycleNext17Round238: "tmp/subagents/round238_london_pld_lifecycle_next17/candidates.json",
  londonLddArchiveNext17Round239: "tmp/subagents/round239_london_ldd_archive_next17/candidates.json",
  nycLpcPermitNext14Round240: "tmp/subagents/round240_nyc_lpc_permit_next14/candidates.json",
  nycHpdAffordableHousingNext6Round241: "tmp/subagents/round241_nyc_hpd_affordable_housing_next6/candidates.json",
  nycDobCoNext15Round242: "tmp/subagents/round242_nyc_dob_co_next15/candidates.json",
  londonPldLifecycleNext18Round243: "tmp/subagents/round243_london_pld_lifecycle_next18/candidates.json",
  nycLpcPermitNext15Round244: "tmp/subagents/round244_nyc_lpc_permit_next15/candidates.json",
  londonLddArchiveNext18Round245: "tmp/subagents/round245_london_ldd_archive_next18/candidates.json",
  nycHpdAffordableHousingNext7Round246: "tmp/subagents/round246_nyc_hpd_affordable_housing_next7/candidates.json",
  nycDobCoNext16Round247: "tmp/subagents/round247_nyc_dob_co_next16/candidates.json",
  londonPldLifecycleNext19Round248: "tmp/subagents/round248_london_pld_lifecycle_next19/candidates.json",
  nycLpcPermitNext16Round249: "tmp/subagents/round249_nyc_lpc_permit_next16/candidates.json",
  nycDobCoNext17Round250: "tmp/subagents/round250_nyc_dob_co_next17/candidates.json",
  nycHpdAffordableHousingNext8Round251: "tmp/subagents/round251_nyc_hpd_affordable_housing_next8/candidates.json",
  londonLddArchiveNext19Round252: "tmp/subagents/round252_london_ldd_archive_next19/candidates.json",
  londonPldLifecycleNext20Round253: "tmp/subagents/round253_london_pld_lifecycle_next20/candidates.json",
  nycLpcPermitNext17Round254: "tmp/subagents/round254_nyc_lpc_permit_next17/candidates.json",
  nycHpdAffordableHousingNext9Round255: "tmp/subagents/round255_nyc_hpd_affordable_housing_next9/candidates.json",
  nycDobCoNext18Round256: "tmp/subagents/round256_nyc_dob_co_next18/candidates.json",
  londonPldLifecycleNext21Round261: "tmp/subagents/round261_london_pld_lifecycle_next21/candidates.json",
  nycLpcPermitNext18Round262: "tmp/subagents/round262_nyc_lpc_permit_next18/candidates.json",
  nycHpdAffordableHousingNext10Round263: "tmp/subagents/round263_nyc_hpd_affordable_housing_next10/candidates.json",
  nycDobCoNext19Round264: "tmp/subagents/round264_nyc_dob_co_next19/candidates.json",
  londonLddArchiveNext20Round260: "tmp/subagents/round260_london_ldd_archive_next20/candidates.json",
  londonPldLifecycleNext22Round266: "tmp/subagents/round266_london_pld_lifecycle_next22/candidates.json",
  nycDobCoNext20Round267: "tmp/subagents/round267_nyc_dob_co_next20/candidates.json",
  nycLpcPermitNext19Round268: "tmp/subagents/round268_nyc_lpc_permit_next19/candidates.json",
  nycHpdAffordableHousingNext11Round269: "tmp/subagents/round269_nyc_hpd_affordable_housing_next11/candidates.json",
  londonLddArchiveNext21Round271: "tmp/subagents/round271_london_ldd_archive_next21/candidates.json",
  londonPldLifecycleNext23Round272: "tmp/subagents/round272_london_pld_lifecycle_next23/candidates.json",
  nycDobCoNext21Round273: "tmp/subagents/round273_nyc_dob_co_next21/candidates.json",
  nycLpcPermitNext20Round274: "tmp/subagents/round274_nyc_lpc_permit_next20/candidates.json",
  nycHpdAffordableHousingNext12Round275: "tmp/subagents/round275_nyc_hpd_affordable_housing_next12/candidates.json"
};

const sourceIdAliases = {
  "hg8x-zxpr": "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr",
  "hq68-rnsi": "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr",
  "4hcv-tc5r": "nyc-parks-capital-project-tracker-4hcv-tc5r",
  "pkdm-hqz6": "nyc-dob-now-co-pkdm-hqz6",
  "nyc-dob-now-certificate-of-occupancy-pkdm-hqz6": "nyc-dob-now-co-pkdm-hqz6",
  "bs8b-p36w": "nyc-dob-co-bs8b-p36w",
  "nyc-dob-certificate-of-occupancy-bs8b-p36w": "nyc-dob-co-bs8b-p36w",
  "ic3t-wcy2": "nyc-dob-filings-permits",
  "nyc-dob-job-application-filings-ic3t-wcy2": "nyc-dob-filings-permits",
  "w9ak-ipjd": "nyc-dob-filings-permits",
  "nyc-dob-now-build-job-application-filings-w9ak-ipjd": "nyc-dob-filings-permits",
  "rbx6-tga4": "nyc-dob-filings-permits",
  "nyc-dob-now-build-approved-permits-rbx6-tga4": "nyc-dob-filings-permits",
  "dpm2-m9mq": "nyc-lpc-permit-application-information",
  "nyc-lpc-permit-application-information-dpm2-m9mq": "nyc-lpc-permit-application-information",
  "nyc-open-data-lpc-permit-application-information-dpm2-m9mq": "nyc-lpc-permit-application-information",
  "nyc_sca_school_openings_api": "nyc-sca-school-openings-projects",
  "NYC SCA School Openings listing/API; SCA fact-sheet PDF; NYC PAD/Geosearch": "nyc-sca-school-openings-projects",
  "nyc_sca_school_opening_fact_sheets": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_k053": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_k253": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_k322": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_k347": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_k464": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_k597": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_k676": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_k694": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_k909": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_q026": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_q160": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_q278": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_q472": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_q509": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_r005": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_r121": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_x077": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_x087": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_x105": "nyc-sca-school-openings-projects",
  "nyc_sca_fact_sheet_x138": "nyc-sca-school-openings-projects",
  "nyc_planninglabs_geosearch_nycpad": "nyc-planninglabs-geosearch-nycpad",
  "round123-he-nhle-amend-20260518": "historic-england-nhle",
  "round123-he-dedesig-20260518": "historic-england-nhle",
  "round123-planning-data-coi-20260518": "planning-data-certificate-of-immunity",
  "nyc-dcp-zap-project-data-hgx4-8ukb": "nyc-dcp-zap-project-data",
  "nyc-dcp-zap-bbl-2iga-a6mk": "nyc-dcp-zap-bbl",
  "nyc-dcp-pluto": "nyc-pluto-mappluto-lots",
  "nyc-pluto-mappluto-lots-64uk-42ks": "nyc-pluto-mappluto-lots",
  "planning-london-datahub-lbc": "gla-planning-datahub-applications",
  "london-planning-datahub-api/core": "gla-planning-datahub-applications",
  "gla-canada-water-stage3-report-2026": "gla-planning-application-decisions",
  "planning-data-article-4-legal-instrument": "planning-data-article-4-direction-area",
  "bcc-current-planning-applications-20260519": "bcc-current-planning-applications",
  "ni-planning-portal-public-register-round123": "ni-planning-portal-public-register",
  "bcc-planning-committee-round126": "bcc-planning-committee-minutes"
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  const dir = path.dirname(file);
  const tempFile = path.join(dir, `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tempFile, payload);
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      fs.renameSync(tempFile, file);
      return;
    } catch (error) {
      lastError = error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250 * (attempt + 1));
    }
  }
  try {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  } catch (_) {
    // Best-effort cleanup only; preserve the original write error below.
  }
  throw lastError;
}

function canonicalSourceId(sourceId) {
  return sourceIdAliases[sourceId] || sourceId;
}

function safeText(value) {
  const text = Array.isArray(value) ? value.join(" ") : String(value || "");
  return text
    .replace(/\bdoes not prove\b/gi, "is not evidence of")
    .replace(/\bnot proof of\b/gi, "not evidence of")
    .replace(/\bas proof of\b/gi, "as evidence of")
    .replace(/\bproof that\b/gi, "evidence that")
    .replace(/\bproof\b/gi, "evidence")
    .replace(/\bproves?\b/gi, "documents")
    .replace(/\bcaused\b/gi, "was associated with")
    .replace(/\bcauses?\b/gi, "is associated with")
    .replace(/\bforecasts?\b/gi, "projects")
    .replace(/\bforecast(ed|ing)?\b/gi, "projected")
    .replace(/\bpredicts?\b/gi, "projects")
    .replace(/\bsimulates?\b/gi, "models")
    .replace(/\bwill increase\b/gi, "is described as intended to increase")
    .replace(/\bwill decrease\b/gi, "is described as intended to decrease")
    .trim();
}

function slugify(value) {
  return safeText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .slice(0, 112)
    .replace(/_+$/g, "");
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{4}-\d{2}$/.test(text) || /^\d{4}$/.test(text)) return text;
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return text;
}

function normalizeDateForComparison(value) {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
}

function datePrecision(value) {
  const text = String(value || "");
  if (/^\d{4}$/.test(text)) return "year";
  if (/^\d{4}-\d{2}$/.test(text)) return "month";
  return "day";
}

function latestDateFromObject(obj) {
  if (!obj || typeof obj !== "object") return "";
  return Object.values(obj)
    .map(normalizeDate)
    .filter((value) => /^\d{4}(-\d{2})?(-\d{2})?$/.test(value))
    .sort()
    .pop() || "";
}

function sourceIdsFor(candidate) {
  const explicit = [];
  if (Array.isArray(candidate.source_ids)) explicit.push(...candidate.source_ids);
  if (candidate.source_id) explicit.push(candidate.source_id);
  if (candidate.source_dataset_id) explicit.push(candidate.source_dataset_id);
  if (candidate.provenance?.source_dataset_id) explicit.push(candidate.provenance.source_dataset_id);
  if (candidate.dataset_id) explicit.push(candidate.dataset_id);
  const seen = new Set();
  return explicit
    .map(canonicalSourceId)
    .filter(Boolean)
    .filter((sourceId) => {
      if (seen.has(sourceId)) return false;
      seen.add(sourceId);
      return true;
    });
}

function pointFrom(candidate) {
  const options = [
    [candidate.latitude, candidate.longitude],
    [candidate.lat, candidate.lon],
    [candidate.geometry?.latitude, candidate.geometry?.longitude],
    [candidate.location?.latitude, candidate.location?.longitude],
    [candidate.coordinates?.lat, candidate.coordinates?.lon],
    [candidate.coordinates?.latitude, candidate.coordinates?.longitude]
  ];
  for (const [lat, lon] of options) {
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
  }
  if (Array.isArray(candidate.geometry?.coordinates) && candidate.geometry.coordinates.length >= 2) {
    const [longitude, latitude] = candidate.geometry.coordinates.map(Number);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
  }
  return null;
}

function sourceUrlFor(candidate) {
  if (candidate.source_url) return candidate.source_url;
  if (candidate.provenance?.source_url) return candidate.provenance.source_url;
  if (Array.isArray(candidate.source_urls) && candidate.source_urls.length > 0) return candidate.source_urls[0];
  if (Array.isArray(candidate.evidence) && candidate.evidence.length > 0) {
    const evidenceUrl = candidate.evidence.map((item) => item?.url).find(Boolean);
    if (evidenceUrl) return evidenceUrl;
  }
  if (candidate.dataset_page_url) return candidate.dataset_page_url;
  return candidate.source_dataset_url || "";
}

function dateFrom(candidate) {
  const values = [
    candidate.date,
    candidate.effective_date,
    candidate.event_date,
    candidate.decision_date,
    candidate.date_fields?.decision_or_publication_date,
    candidate.date_fields?.decision_date,
    latestDateFromObject(candidate.dates),
    latestDateFromObject(candidate.date_fields),
    candidate.raw_row?.building_completion_date,
    candidate.raw_row?.project_completion_date,
    candidate.raw_row?.constructionactualcompletion,
    candidate.effective_date_range?.end,
    candidate.effective_date_range?.start
  ];
  for (const value of values) {
    const normalized = normalizeDate(value);
    if (/^\d{4}(-\d{2})?(-\d{2})?$/.test(normalized)) return normalized;
  }
  return normalizeDate(values.find(Boolean));
}

function isPageLike(candidate, sourceIds) {
  const text = `${candidate.source_type || ""} ${candidate.source_url || ""} ${sourceIds.join(" ")}`.toLowerCase();
  if (/open data|socrata|api row|planning data entity|zap|pluto|dob|lpc permit|application row|portal register/.test(text)) return false;
  return /page|press|news|project|committee|minutes|pdf|report|article|web/.test(text);
}

function sourceRecordIdFor(candidate, sourceIds) {
  let recordId = "";
  if (candidate.source_record_id) recordId = String(candidate.source_record_id);
  else if (candidate.provenance?.source_record_id) recordId = String(candidate.provenance.source_record_id);
  else if (Array.isArray(candidate.source_record_ids) && candidate.source_record_ids.length > 0) recordId = candidate.source_record_ids.join("; ");
  else if (Array.isArray(candidate.evidence) && candidate.evidence.length > 0) recordId = candidate.evidence.map((item) => item?.record_id).filter(Boolean).join("; ");
  else if (Array.isArray(candidate.planning_refs) && candidate.planning_refs.length > 0) recordId = candidate.planning_refs.join("; ");
  else if (candidate.raw_row?.project_id && candidate.raw_row?.building_id) recordId = `${candidate.raw_row.project_id}:${candidate.raw_row.building_id}`;
  else if (candidate.raw_row?.trackerid) recordId = String(candidate.raw_row.trackerid);
  else recordId = candidate.candidate_id || candidate.event_id || "";

  if (recordId && isPageLike(candidate, sourceIds)) {
    return `${recordId}; event ${candidate.candidate_id || candidate.event_id || slugify(candidate.title)}`;
  }
  return recordId;
}

function eventSourceRecordIdFor(candidate, sourceIds, date) {
  const recordId = sourceRecordIdFor(candidate, sourceIds);
  const sourceText = sourceIds.join(" ");
  const dateField = sourceDateFieldFor(candidate);
  const lifecycleField = candidate.source_lifecycle_field || dateField;
  if (/gla-planning-datahub-applications|london-planning-datahub-api\/core/i.test(sourceText) && /actual_(commencement|completion)_date/i.test(lifecycleField)) {
    return `${recordId}; DATE_FIELD:${safeText(lifecycleField)}; DATE:${date}`;
  }
  return recordId;
}

function eventIdFor(candidate, date) {
  const prefix = { belfast: "bfs_arch", london: "lon_arch", nyc: "nyc_arch" }[candidate.city_id];
  const existing = safeText(candidate.event_id || "");
  if (prefix && existing.startsWith(prefix)) return existing;
  const token = candidate.candidate_id || candidate.event_id || `${candidate.title}_${sourceRecordIdFor(candidate, sourceIdsFor(candidate))}_${date}`;
  return `${prefix}_${slugify(token)}`.slice(0, 140).replace(/_+$/g, "");
}

function sourceDateFieldFor(candidate) {
  const fields = [];
  if (candidate.source_date_field) fields.push(candidate.source_date_field);
  if (candidate.date_field) fields.push(candidate.date_field);
  if (candidate.date_basis) fields.push(candidate.date_basis);
  if (candidate.date_type) fields.push(candidate.date_type);
  return fields.filter(Boolean).join("; ") || "Observed date from the cited public source record.";
}

function limitationsFor(candidate) {
  const parts = [];
  if (Array.isArray(candidate.limitations)) parts.push(candidate.limitations.join(" "));
  else if (candidate.limitations) parts.push(candidate.limitations);
  if (Array.isArray(candidate.caveats)) parts.push(candidate.caveats.join(" "));
  else if (candidate.caveats) parts.push(candidate.caveats);
  if (candidate.confidence_note) parts.push(candidate.confidence_note);
  if (candidate.effective_date_note) parts.push(candidate.effective_date_note);
  parts.push("This event is retained as an observed, source-backed milestone only; broader design, delivery, usage, safety, affordability, regeneration, or causal claims are not inferred.");
  return parts.join(" ");
}

function normalizeCandidate(candidate, packName) {
  const date = dateFrom(candidate);
  const point = pointFrom(candidate);
  const sourceIds = sourceIdsFor(candidate);
  const primarySourceId = sourceIds[0] || canonicalSourceId(candidate.source_id || candidate.source_dataset_id || "");
  return {
    city_id: candidate.city_id,
    event_id: eventIdFor(candidate, date),
    date,
    date_precision: candidate.date_precision || candidate.date_granularity || candidate.effective_date_precision || datePrecision(date),
    bucket: safeText(candidate.bucket || candidate.category || "planning/development/architecture/official_record"),
    title: safeText(candidate.title),
    summary: safeText(candidate.summary || candidate.short_description || candidate.explanation || candidate.title),
    observed_change: safeText(candidate.observed_change || candidate.summary || candidate.short_description || candidate.explanation || candidate.title),
    area: safeText(candidate.area || candidate.address || candidate.location_name || candidate.location?.address || candidate.affected_area?.label || candidate.site || candidate.title || candidate.city_id),
    latitude: point?.latitude,
    longitude: point?.longitude,
    source_ids: sourceIds,
    source_name: safeText(candidate.source_name || candidate.dataset_page_url || primarySourceId),
    publisher: safeText(candidate.publisher || candidate.source_publisher || "Source publisher not supplied in candidate."),
    source_url: sourceUrlFor(candidate),
    source_record_id: safeText(eventSourceRecordIdFor(candidate, sourceIds, date)),
    source_type: safeText(candidate.source_type || candidate.event_type || "official/public source record"),
    source_retrieved_at: candidate.accessed_at || candidate.source_retrieved_at || candidate.retrieved_at || candidate.provenance?.source_retrieved_at || retrievedAt,
    source_date_field: safeText(sourceDateFieldFor(candidate)),
    source_dataset_id: primarySourceId,
    confidence: candidate.confidence || "documented",
    architect: safeText(candidate.architect || "Source record does not name a project architect."),
    project_type: safeText(candidate.project_type || candidate.subcategory || candidate.event_type || "official architecture-related record"),
    geometry_source: safeText(candidate.geometry_source || candidate.provenance?.geometry_source || candidate.geometry?.source || candidate.location?.geometry_source || "Source candidate supplied official or cited approximate coordinates."),
    geometry_precision: safeText(candidate.geometry_precision || candidate.provenance?.geometry_precision || candidate.geometry?.precision || candidate.location?.geometry_precision || "source point for atlas navigation, not a measured project footprint"),
    license_or_terms_note: safeText(candidate.license_or_terms_note || candidate.license_terms_note || candidate.license || candidate.license_terms || candidate.terms_note || "Source terms retained in source audit; review publisher terms before bulk redistribution."),
    attribution: safeText(candidate.attribution || candidate.attribution_text || candidate.publisher || candidate.source_name || primarySourceId),
    limitations: safeText(limitationsFor(candidate)),
    transformation_method: safeText(`Round119 ${packName} candidate ${candidate.candidate_id || candidate.event_id || candidate.source_record_id || candidate.title}; normalized by scripts/append_architecture_batch_20260519_round119_official.js after source-ID canonicalization, duplicate screening, required-provenance checks, overclaim wording cleanup, current-date guard, and city coordinate-envelope validation.`)
  };
}

function auditText(audit, keys) {
  for (const key of keys) {
    if (audit && audit[key]) return safeText(audit[key]);
  }
  return "";
}

function auditRowsFromPack(pack) {
  if (!pack || Array.isArray(pack)) return [];
  if (Array.isArray(pack.source_audits)) return pack.source_audits;
  if (Array.isArray(pack.audits)) return pack.audits;
  if (Array.isArray(pack.sources)) return pack.sources;
  if (Array.isArray(pack.source_audit)) return pack.source_audit;
  return [];
}

function readSiblingAudits(candidateFile) {
  const auditPath = path.join(path.dirname(candidateFile), "source_audit.json");
  if (!fs.existsSync(auditPath)) return [];
  const auditPack = readJson(auditPath);
  return auditRowsFromPack(auditPack);
}

function sourceEntryFromAudit(sourceId, candidates, audits, existingSource) {
  if (existingSource) return existingSource;
  const audit = audits.find((item) => canonicalSourceId(item.source_id || item.source_dataset_id || item.dataset_id || "") === sourceId) || {};
  const sameSourceCandidates = candidates.filter((candidate) => sourceIdsFor(candidate).includes(sourceId));
  const first = sameSourceCandidates[0] || {};
  const cityIds = [...new Set(sameSourceCandidates.map((candidate) => candidate.city_id).filter(Boolean))];
  const dates = sameSourceCandidates.map(dateFrom).filter(Boolean).sort();
  const title = auditText(audit, ["title", "source_name", "name"]) || safeText(first.source_name || sourceId);
  const publisher = auditText(audit, ["publisher", "provider", "source_publisher"]) || safeText(first.publisher || first.source_publisher || "Public source publisher not supplied in candidate pack.");
  const accessUrl = auditText(audit, ["source_url", "url", "access_url", "api_endpoint", "base_url"]) || sourceUrlFor(first);
  const license = auditText(audit, ["license_or_terms_note", "licence", "license", "licence_or_terms", "license_and_attribution", "terms_note"]) || safeText(first.license_or_terms_note || first.license || "Factual metadata and source URLs retained; review publisher terms before bulk redistribution.");
  const coverageStart = Number((dates[0] || "2008").slice(0, 4)) || 2008;
  const coverageEnd = Number((dates[dates.length - 1] || "2026").slice(0, 4)) || 2026;
  const caveats = [
    auditText(audit, ["caveats", "required_caveats", "date_caveats", "geometry_caveats", "limitations"]),
    auditText(audit, ["coverage_note", "coverage", "coverage_used", "recommendation", "ingestion_recommendation"]),
    safeText(first.limitations || "")
  ].filter(Boolean).join(" ");

  return {
    source_id: sourceId,
    city_ids: cityIds.length ? cityIds : [first.city_id].filter(Boolean),
    title,
    publisher,
    bucket: safeText(first.bucket || first.category || "planning/development/architecture/official_record"),
    access_url: accessUrl,
    licence: license,
    licence_url: auditText(audit, ["licence_url", "license_url"]) || defaultLicenceUrl(publisher, accessUrl),
    coverage_years: { start: Math.max(2008, coverageStart), end: Math.min(2026, coverageEnd || 2026) },
    time_coverage: auditText(audit, ["coverage_years_checked", "time_coverage", "coverage_note", "coverage", "coverage_used"]) || `Selected records from ${Math.max(2008, coverageStart)}-${Math.min(2026, coverageEnd || 2026)} in the Round119 architecture corpus window.`,
    spatial_granularity: auditText(audit, ["geographic_scope", "geographic_coverage", "geography", "geometry_fields", "geometry_fields_observed", "geometry_caveats"]) || safeText(first.geometry_precision || first.provenance?.geometry_precision || "Project/site point from source row or cited address."),
    temporal_granularity: auditText(audit, ["date_fields", "date_fields_observed", "date_caveats", "key_fields", "key_fields_used"]) || safeText(first.source_date_field || "Source-stated event, decision, publication, or administrative milestone date."),
    update_frequency: auditText(audit, ["update_frequency", "frequency"]) || "Source-specific publication/update cadence",
    retrieved_at: retrievedAt,
    limitations: safeText(caveats || "Source records support observed administrative or project milestones only. They are not evidence of construction completion, occupancy, use, outcome effects, or causal relationships unless the source explicitly states that narrower milestone.")
  };
}

function defaultLicenceUrl(publisher, accessUrl) {
  const text = `${publisher} ${accessUrl}`.toLowerCase();
  if (text.includes("nyc.gov") || text.includes("cityofnewyork.us")) return "https://www.nyc.gov/home/terms-of-use.page";
  if (text.includes("planning.data.gov.uk") || text.includes("gov.uk")) return "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
  if (text.includes("belfastcity.gov.uk")) return "https://www.belfastcity.gov.uk/Copyright";
  return accessUrl || "";
}

function registryEntryFromSource(source) {
  const bucketFamily = String(source.bucket || "").split("/").filter(Boolean)[0];
  return {
    source_id: source.source_id,
    title: source.title,
    provider: source.publisher,
    source_family: source.source_family || bucketFamily || "planning",
    city_ids: source.city_ids,
    licence: source.licence,
    licence_url: source.licence_url,
    coverage_years: source.coverage_years,
    update_frequency: source.update_frequency,
    url: source.access_url,
    local_paths: source.local_paths || [],
    reliability: "usable_with_caveats",
    source_confidence: "documented",
    attribution_text: `Attribute ${source.publisher}.`,
    provenance_notes: `${source.time_coverage} ${source.temporal_granularity}`,
    caveats: [source.limitations]
  };
}

function sourceFamilyFor(cityId, sourceId, source) {
  const text = `${sourceId} ${source.title} ${source.publisher} ${source.bucket}`.toLowerCase();
  if (cityId === "nyc") {
    if (/dob|certificate.of.occupancy|job.application|permit/.test(text)) return "building_permits";
    if (/lpc|landmark|historic.preservation/.test(text)) return "historic_preservation";
    if (/zoning|zap|pluto|land.use|dcp/.test(text)) return "land_use_documents";
    if (/hpd|housing|affordable/.test(text)) return "housing_delivery";
    if (/parks?|playground|public.realm/.test(text)) return "parks_capital";
    return "public_facilities";
  }
  if (cityId === "belfast") {
    if (/transport|station|translink|dfi/.test(text)) return "transport";
    if (/planning|application|decision|committee|portal|dfc|hed|harni|heritage|listed/.test(text)) return "planning";
    return "civic_services";
  }
  if (cityId === "london") {
    if (/transport|station|tfl|rail|tube/.test(text)) return "transit";
    if (/housing|residential|homes/.test(text)) return "housing_delivery";
    return "planning";
  }
  throw new Error(`Unsupported city for source family: ${cityId}`);
}

function addSourceIdsToFamily(cityId, familyId, sourceIds) {
  const configPath = `config/cities/${cityId}.json`;
  const config = readJson(configPath);
  const family = config.source_families.find((item) => item.family_id === familyId);
  if (!family) throw new Error(`Missing ${cityId} ${familyId} source family`);
  const existing = new Set(family.source_ids);
  for (const sourceId of sourceIds) {
    if (!existing.has(sourceId)) {
      family.source_ids.push(sourceId);
      existing.add(sourceId);
    }
  }
  writeJson(configPath, config);
}

function upsertSources(doc, sourceEntries) {
  for (const sourceEntry of sourceEntries) {
    const index = doc.sources.findIndex((source) => source.source_id === sourceEntry.source_id);
    if (index >= 0) doc.sources[index] = { ...doc.sources[index], ...sourceEntry };
    else doc.sources.push(sourceEntry);
  }
}

function updateSourceRegistry(sourceEntries) {
  const registry = readJson(sourceRegistryPath);
  const indexById = new Map(registry.sources.map((source, index) => [source.source_id, index]));
  for (const source of sourceEntries) {
    const entry = registryEntryFromSource(source);
    const index = indexById.get(source.source_id);
    if (index === undefined) {
      registry.sources.push(entry);
      indexById.set(source.source_id, registry.sources.length - 1);
    } else {
      registry.sources[index] = { ...registry.sources[index], ...entry };
    }
  }
  registry.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));
  writeJson(sourceRegistryPath, registry);
}

function updateCityConfigs(sourceEntries) {
  const grouped = new Map();
  for (const source of sourceEntries) {
    for (const cityId of source.city_ids || []) {
      const familyId = sourceFamilyFor(cityId, source.source_id, source);
      const key = `${cityId}|${familyId}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(source.source_id);
    }
  }
  for (const [key, sourceIds] of grouped.entries()) {
    const [cityId, familyId] = key.split("|");
    addSourceIdsToFamily(cityId, familyId, [...new Set(sourceIds)]);
  }
}

function sourceToken(event) {
  const sourceId = event.source_dataset_id || (event.source_ids || [])[0] || "";
  const text = `${event.source_record_id || ""} ${event.source_url || ""} ${event.title || ""}`;
  if (/nyc-dob/.test(sourceId)) {
    const match = text.match(/\b(?:[A-Z]\d{8,}|\d{7,}|\d{2,}:\d{2,})\b/i);
    return match ? `${sourceId}:${match[0].toUpperCase()}` : text.toLowerCase();
  }
  if (/parks-capital/.test(sourceId)) {
    const match = text.match(/\b\d{3,}\b/);
    return match ? `${sourceId}:${match[0]}` : text.toLowerCase();
  }
  if (/zap|pluto|dcp/.test(sourceId)) {
    const match = text.match(/\b\d{4}[A-Z]\d{4}\b/i);
    return match ? `${sourceId}:${match[0].toUpperCase()}` : text.toLowerCase();
  }
  const planningRef = text.match(/\bLA04\/\d{4}\/\d{4}\/[A-Z]+\b/i)?.[0] ||
    text.match(/\bZ\/\d{4}\/\d{4}\/[A-Z]+\b/i)?.[0];
  if (planningRef) return `${sourceId}:${planningRef.toUpperCase()}`;
  const pld = text.match(/\bPLD:[^;\s]+/i)?.[0] || text.match(/\bPDU[-:]?\d{4,}\b/i)?.[0];
  if (pld) {
    const field = safeText(event.source_date_field || "");
    if (/actual_(commencement|completion)_date/i.test(field)) {
      return `${sourceId}:${pld.toUpperCase()}:${field.toLowerCase()}:${event.date}`;
    }
    return `${sourceId}:${pld.toUpperCase()}`;
  }
  if (sourceId.startsWith("planning-data-")) {
    const entity = text.match(/\bentity\s+(\d{6,})\b/i)?.[1] || text.match(/\/entity\/(\d{6,})\b/i)?.[1];
    if (entity) return `${sourceId}:${entity}`;
  }
  return `${sourceId}:${text.trim().toLowerCase()}`;
}

function buildExistingSourceTokens(events) {
  const bySource = new Map();
  for (const event of events) {
    const sourceIds = event.source_ids || [event.source_dataset_id].filter(Boolean);
    for (const rawSourceId of sourceIds) {
      const sourceId = canonicalSourceId(rawSourceId);
      const token = sourceToken({ ...event, source_dataset_id: sourceId });
      if (!token) continue;
      if (!bySource.has(sourceId)) bySource.set(sourceId, new Set());
      bySource.get(sourceId).add(token);
    }
  }
  return bySource;
}

function normalizeExistingPldLifecycleRecordIds(events) {
  for (const event of events) {
    const sourceIds = event.source_ids || [event.source_dataset_id].filter(Boolean);
    const sourceText = sourceIds.join(" ");
    const dateField = safeText(event.source_date_field || "");
    if (!/gla-planning-datahub-applications|london-planning-datahub-api\/core/i.test(sourceText)) continue;
    if (!/actual_(commencement|completion)_date/i.test(dateField)) continue;
    if (!event.source_record_id || /; DATE_FIELD:/.test(event.source_record_id)) continue;
    event.source_record_id = `${event.source_record_id}; DATE_FIELD:${dateField}; DATE:${event.date}`;
  }
}

function validateRecords(records, doc) {
  const knownSourceIds = new Set(doc.sources.map((source) => source.source_id));
  const requiredFields = [
    "city_id", "event_id", "date", "bucket", "title", "summary", "observed_change", "area",
    "latitude", "longitude", "source_ids", "source_name", "publisher", "source_url",
    "source_record_id", "source_type", "source_retrieved_at", "source_date_field",
    "source_dataset_id", "confidence", "architect", "project_type", "geometry_source",
    "geometry_precision", "license_or_terms_note", "attribution", "limitations",
    "transformation_method"
  ];
  const banned = /\b(caused|proves?|proof|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  const cityEnvelopes = {
    belfast: { minLon: -6.12, maxLon: -5.74, minLat: 54.45, maxLat: 54.75 },
    london: { minLon: -0.5103, maxLon: 0.334, minLat: 51.2868, maxLat: 51.6919 },
    nyc: { minLon: -74.2591, maxLon: -73.7004, minLat: 40.4774, maxLat: 40.9176 }
  };
  const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
  const earliestAllowedDate = new Date("2008-01-01T00:00:00Z");
  const batchIds = new Set();
  const batchSourceKeys = new Set();

  for (const event of records) {
    for (const field of requiredFields) {
      const value = event[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`Missing ${field} for ${event.event_id}`);
      }
    }
    if (event.city_id === "belfast" && !/^bfs_arch_/.test(event.event_id)) throw new Error(`Unexpected Belfast event_id prefix: ${event.event_id}`);
    if (event.city_id === "london" && !/^lon_arch_/.test(event.event_id)) throw new Error(`Unexpected London event_id prefix: ${event.event_id}`);
    if (event.city_id === "nyc" && !/^nyc_arch_/.test(event.event_id)) throw new Error(`Unexpected NYC event_id prefix: ${event.event_id}`);
    if (!String(event.source_url).startsWith("http")) throw new Error(`Invalid source URL for ${event.event_id}`);
    if (!["documented", "corroborated", "inferred", "disputed"].includes(event.confidence)) throw new Error(`Invalid confidence for ${event.event_id}: ${event.confidence}`);
    for (const sourceId of event.source_ids) {
      if (!knownSourceIds.has(sourceId)) throw new Error(`Unknown source_id ${sourceId} for ${event.event_id}`);
    }
    const checked = [event.title, event.summary, event.observed_change, event.limitations, event.transformation_method, event.source_date_field, event.project_type, event.geometry_precision].join(" ");
    if (banned.test(checked)) throw new Error(`Output record contains overclaim wording: ${event.event_id}`);
    const comparable = new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`);
    if (Number.isNaN(comparable.getTime())) throw new Error(`Invalid date for ${event.event_id}: ${event.date}`);
    if (comparable > latestAllowedDate) throw new Error(`Future-dated record: ${event.event_id}`);
    if (comparable < earliestAllowedDate) throw new Error(`Pre-window record: ${event.event_id}`);
    const envelope = cityEnvelopes[event.city_id];
    const longitude = Number(event.longitude);
    const latitude = Number(event.latitude);
    if (!envelope || !Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < envelope.minLon || longitude > envelope.maxLon || latitude < envelope.minLat || latitude > envelope.maxLat) {
      throw new Error(`Invalid or outside-${event.city_id}-envelope coordinates for ${event.event_id}`);
    }
    if (batchIds.has(event.event_id)) throw new Error(`Duplicate event_id inside batch: ${event.event_id}`);
    batchIds.add(event.event_id);
    const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
    if (batchSourceKeys.has(sourceKey)) throw new Error(`Duplicate source key inside batch: ${sourceKey}`);
    batchSourceKeys.add(sourceKey);
  }
}

function main() {
  const doc = readJson(corpusPath);
  normalizeExistingPldLifecycleRecordIds(doc.events);
  const allCandidates = [];
  const allAudits = [];
  const missingCandidatePacks = [];
  const packByCandidate = new Map();

  for (const [packName, file] of Object.entries(candidatePaths)) {
    if (!fs.existsSync(file)) {
      missingCandidatePacks.push(file);
      continue;
    }
    const pack = readJson(file);
    for (const audit of auditRowsFromPack(pack)) allAudits.push(audit);
    for (const audit of readSiblingAudits(file)) allAudits.push(audit);
    for (const candidate of Array.isArray(pack) ? pack : pack.candidates || pack.events || []) {
      allCandidates.push(candidate);
      packByCandidate.set(candidate, packName);
    }
  }

  const sourceIds = [...new Set(allCandidates.flatMap(sourceIdsFor))];
  const sourceEntries = sourceIds.map((sourceId) => sourceEntryFromAudit(
    sourceId,
    allCandidates,
    allAudits,
    doc.sources.find((source) => source.source_id === sourceId)
  ));
  upsertSources(doc, sourceEntries);

  const rows = [];
  const rejections = [];
  for (const candidate of allCandidates) {
    const event = normalizeCandidate(candidate, packByCandidate.get(candidate));
    if (!event.latitude || !event.longitude) {
      rejections.push({ id: candidate.candidate_id || candidate.event_id || candidate.source_record_id || candidate.title, reason: "Missing source geometry after candidate normalization." });
      continue;
    }
    rows.push(event);
  }

  const existingSourceTokens = buildExistingSourceTokens(doc.events);
  const existingTitleDateKeys = new Set(doc.events.map((event) => `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`));
  const existingIds = new Set(doc.events.map((event) => event.event_id));
  const existingSourceKeys = new Set(doc.events.map((event) => `${event.city_id}|${event.source_url}|${event.source_record_id}`));
  const batchSourceTokens = new Set();
  const records = [];
  const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
  const earliestAllowedDate = new Date("2008-01-01T00:00:00Z");

  for (const event of rows) {
    const titleDateKey = `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`;
    const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
    const token = sourceToken(event);
    const tokenKey = `${event.source_dataset_id}|${token}`;
    const comparableDate = new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`);
    if (!event.date || Number.isNaN(comparableDate.getTime())) {
      rejections.push({ id: event.event_id, reason: "Missing or invalid event date after candidate normalization." });
      continue;
    }
    if (comparableDate > latestAllowedDate) {
      rejections.push({ id: event.event_id, reason: `Future-dated event date after access date: ${event.date}` });
      continue;
    }
    if (comparableDate < earliestAllowedDate) {
      rejections.push({ id: event.event_id, reason: `Pre-window event date: ${event.date}` });
      continue;
    }
    if (existingIds.has(event.event_id)) {
      rejections.push({ id: event.event_id, reason: "Existing event_id." });
      continue;
    }
    if (existingSourceKeys.has(sourceKey)) {
      rejections.push({ id: event.event_id, reason: `Existing source key: ${sourceKey}` });
      continue;
    }
    if (existingTitleDateKeys.has(titleDateKey)) {
      rejections.push({ id: event.event_id, reason: `Existing title/date key: ${titleDateKey}` });
      continue;
    }
    if (existingSourceTokens.get(event.source_dataset_id)?.has(token)) {
      rejections.push({ id: event.event_id, reason: `Existing source token for ${event.source_dataset_id}: ${token}` });
      continue;
    }
    if (batchSourceTokens.has(tokenKey)) {
      rejections.push({ id: event.event_id, reason: `Duplicate source token inside batch for ${event.source_dataset_id}: ${token}` });
      continue;
    }
    batchSourceTokens.add(tokenKey);
    records.push(event);
  }

  validateRecords(records, doc);

  doc.events.push(...records);
  doc.events.sort((a, b) => (
    a.city_id.localeCompare(b.city_id) ||
    String(a.date).localeCompare(String(b.date)) ||
    a.event_id.localeCompare(b.event_id)
  ));
  doc.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));
  writeJson(corpusPath, doc);
  updateSourceRegistry(sourceEntries);
  updateCityConfigs(sourceEntries);

  const counts = doc.events.reduce((acc, event) => {
    acc[event.city_id] = (acc[event.city_id] || 0) + 1;
    return acc;
  }, {});
  const addedByCity = records.reduce((acc, event) => {
    acc[event.city_id] = (acc[event.city_id] || 0) + 1;
    return acc;
  }, {});
  const addedBySource = records.reduce((acc, event) => {
    acc[event.source_dataset_id] = (acc[event.source_dataset_id] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({
    added: records.length,
    rejected: rejections.length,
    missingCandidatePacks,
    sourceEntries: sourceEntries.length,
    addedByCity,
    addedBySource,
    counts,
    total: doc.events.length,
    rejections: rejections.slice(0, 120)
  }, null, 2));
}

main();
