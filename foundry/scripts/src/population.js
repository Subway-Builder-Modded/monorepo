/**
 * adds demand points based on either:
 * 
 * LOW QUALITY:
 * kroniker's old estimation by sqft area of the building
 * (processPlaceConnectionsOld)
 * 
 * MEDIUM(ish) QUALITY:
 * 
 * using a GeoJSON with subdivision boundaries and 
 * 
 */

import fs from 'fs';
import * as turf from '@turf/turf';
import { createParseStream } from 'big-json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// stolen from the old process_data.js scripts
const squareFeetPerPopulation = {
  yes: 600, // most likely a SFH
  apartments: 240,
  barracks: 100, // google said 70-90, but imma bump it up a bit tbh
  bungalow: 600, // sfh
  cabin: 600, // sfh
  detached: 600, // sfh
  annexe: 240, // kinda like apartments
  dormitory: 125, // good lord
  farm: 600, // sfh
  ger: 240, // technically sfh, but generally usually smaller and more compact. honorary apartment. TIL "ger" is mongolian for the english word "yurt"
  hotel: 240, // gonna count these as apartments because hotel guests use transit too
  house: 600, // sfh
  houseboat: 600, // interdasting
  residential: 600, // could be anything, but im assuimg sfh here
  semidetached_house: 400, // duplex
  static_caravan: 500,
  stilt_house: 600,
  terrace: 500, // townhome
  tree_house: 240, // fuck it
  trullo: 240, // there is nothing scientific here, its all fucking vibes
};

const squareFeetPerJob = {
  commercial: 150, // non specific, restaraunts i guess?
  industrial: 500, // vibes vibes vibes vibes!!!!!,
  kiosk: 50, // its all vibes baby
  office: 150, // all of my vibes are 100% meat created
  retail: 300,
  supermarket: 300,
  warehouse: 500,
  // the following are all religious and im assuming ~100 square feet, not for job purposes, 
  // but for the fact that people go to religious institutions
  // might use a similar trick for sports stadiums
  religious: 100,
  cathedral: 100,
  chapel: 100,
  church: 100,
  kingdom_hall: 100,
  monastery: 100,
  mosque: 100,
  presbytery: 100,
  shrine: 100,
  synagogue: 100,
  temple: 100,
  // end of religious
  bakehouse: 300,
  college: 250, // collge/uni is a job
  fire_station: 500,
  government: 150,
  gatehouse: 150,
  hospital: 150,
  kindergarten: 100,
  museum: 300,
  public: 300,
  school: 100,
  train_station: 1000,
  transportation: 1000,
  university: 250,
  // sports time! im going to treat these like offices because i said so.
  // i think itll end up creating demand thats on average what stadiums see traffic wise. not sure
  grandstand: 150,
  pavilion: 150,
  riding_hall: 150,
  sports_hall: 150,
  sports_centre: 150,
  stadium: 150,
};

const processPlaceConnectionsOld = (place, rawBuildings, rawPlaces) => {
  let neighborhoods = {};
  let centersOfNeighborhoods = {};
  let calculatedBuildings = {};

  // finding areas of neighborhoods
  rawPlaces.forEach((place) => {
    if (place.tags.place && (place.tags.place == 'quarter' || place.tags.place == 'neighbourhood') || (place.tags.aeroway && place.tags.aeroway == 'terminal') || (place.tags.amenity && place.tags.amenity == 'university')) {
      neighborhoods[place.id] = place;
      if (place.type == 'node') {
        centersOfNeighborhoods[place.id] = [place.lon, place.lat];
      } else if (place.type == 'way' || place.type == 'relation') {
        const center = [(place.bounds.minlon + place.bounds.maxlon) / 2, (place.bounds.minlat + place.bounds.maxlat) / 2];
        centersOfNeighborhoods[place.id] = center;
      }
    }
  });

  const centersOfNeighborhoodsFeatureCollection = turf.featureCollection(
    Object.keys(centersOfNeighborhoods).map((placeID) =>
      turf.point(centersOfNeighborhoods[placeID], {
        placeID,
        name: neighborhoods[placeID].tags.name
      })
    )
  );

  // splitting everything into areas
  const voronoi = turf.voronoi(centersOfNeighborhoodsFeatureCollection, {
    bbox: place.bbox,
  })
  voronoi.features = voronoi.features.filter((feature) => feature);

  // sorting buildings between residential and commercial
  rawBuildings.forEach((building) => {
    if (building.tags.building) { // should always be true, but why not
      const __coords = building.geometry.map((point) => [point.lon, point.lat]);
      if (__coords[0][0] !== __coords[__coords.length - 1][0] || __coords[0][1] !== __coords[__coords.length - 1][1]) __coords.push(__coords[0]);
      if (__coords.length < 4) return;
      const buildingGeometry = turf.polygon([__coords]);
      let buildingAreaMultiplier = Math.max(Number(building.tags['building:levels']), 1); // assuming a single story if no level data
      if (isNaN(buildingAreaMultiplier)) buildingAreaMultiplier = 1;
      const buildingArea = turf.area(buildingGeometry) * buildingAreaMultiplier * 10.7639; // that magic number converts from square meters to square feet
      const buildingCenter = [(building.bounds.minlon + building.bounds.maxlon) / 2, (building.bounds.minlat + building.bounds.maxlat) / 2];

      if (squareFeetPerPopulation[building.tags.building]) { // residential
        const approxPop = Math.floor(buildingArea / squareFeetPerPopulation[building.tags.building]);
        calculatedBuildings[building.id] = {
          ...building,
          approxPop,
          buildingCenter,
        };
      } else if (squareFeetPerJob[building.tags.building]) { // commercial/jobs
        let approxJobs = Math.floor(buildingArea / squareFeetPerJob[building.tags.building]);

        if(building.tags.aeroway && building.tags.aeroway == 'terminal')
          approxJobs *= 20;

        calculatedBuildings[building.id] = {
          ...building,
          approxJobs,
          buildingCenter,
        };
      }
    }
  });

  // so we can do like, stuff with it
  const buildingsAsFeatureCollection = turf.featureCollection(
    Object.values(calculatedBuildings).map((building) =>
      turf.point(building.buildingCenter, { buildingID: building.id })
    )
  );

  let totalPopulation = 0;
  let totalJobs = 0;
  let finalVoronoiMembers = {}; // what buildings are in each voronoi
  let finalVoronoiMetadata = {}; // additional info on population and jobs

  voronoi.features.forEach((feature) => {
    const buildingsWhichExistWithinFeature = turf.pointsWithinPolygon(buildingsAsFeatureCollection, feature);
    finalVoronoiMembers[feature.properties.placeID] = buildingsWhichExistWithinFeature.features;

    const finalFeature = {
      ...feature.properties,
      totalPopulation: 0,
      totalJobs: 0,
      percentOfTotalPopulation: null,
      percentOfTotalJobs: null,
    };

    buildingsWhichExistWithinFeature.features.forEach((feature) => {
      const building = calculatedBuildings[feature.properties.buildingID];
      finalFeature.totalPopulation += (building.approxPop ?? 0);
      finalFeature.totalJobs += (building.approxJobs ?? 0);
      totalPopulation += (building.approxPop ?? 0);
      totalJobs += (building.approxJobs ?? 0);
    });

    finalVoronoiMetadata[feature.properties.placeID] = finalFeature;
  });

  let finalNeighborhoods = {};
  let neighborhoodConnections = [];

  // creating total percents and setting up final dicts
  Object.values(finalVoronoiMetadata).forEach((place) => {
    finalVoronoiMetadata[place.placeID].percentOfTotalPopulation = place.totalPopulation / totalPopulation;
    finalVoronoiMetadata[place.placeID].percentOfTotalJobs = place.totalJobs / totalJobs;

    let id = place.placeID;

    if(neighborhoods[id] && neighborhoods[id].tags && neighborhoods[id].tags.aeroway && neighborhoods[id].tags.aeroway == 'terminal'){
      id = "AIR_Terminal_" + terminalTicker;
      terminalTicker++;
      console.log("New terminal added:", id);
    }
    else if(neighborhoods[id] && neighborhoods[id].tags && neighborhoods[id].tags.amenity && neighborhoods[id].tags.amenity == 'university'){
      id = "UNI_" + uniTicker;
      uniTicker++;
      console.log("New university added:", id);
    }


    finalNeighborhoods[place.placeID] = {
      id: id,
      location: centersOfNeighborhoods[place.placeID],
      jobs: place.totalJobs,
      residents: place.totalPopulation,
      popIds: [],
    }
  });

  Object.values(finalVoronoiMetadata).forEach((outerPlace) => {
    // trust the process bro
    Object.values(finalVoronoiMetadata).forEach((innerPlace) => {
      //const connectionSizeBasedOnResidencePercent = outerPlace.percentOfTotalPopulation * innerPlace.totalJobs;
      let connectionSizeBasedOnJobsPercent = innerPlace.percentOfTotalJobs * outerPlace.totalPopulation;
      // prevent excessive no. of pops
      if(connectionSizeBasedOnJobsPercent <= 50){
        connectionSizeBasedOnJobsPercent = 0;
      }
      const connectionDistance = turf.length(turf.lineString([
        centersOfNeighborhoods[outerPlace.placeID],
        centersOfNeighborhoods[innerPlace.placeID],
      ]), { units: 'meters' });
      const conncetionSeconds = connectionDistance * 0.12; // very scientific (hey, this is something i got from the subwaybuilder data)

      // prevents excessively large pops, causing impossible-to-fit-in-metro groups
      let totalSize = Math.round(connectionSizeBasedOnJobsPercent);
      let splits = Math.ceil(totalSize / 400)

      for(let i = 0; i < splits; i++){
        neighborhoodConnections.push({
          residenceId: outerPlace.placeID,
          jobId: innerPlace.placeID,
          size: Math.round(totalSize / splits),
          drivingDistance: Math.round(connectionDistance),
          drivingSeconds: Math.round(conncetionSeconds),
        })
      }
    });
  });

  // need to populate popIds within finalNeighborhoods
  neighborhoodConnections = neighborhoodConnections
    .filter((connection) => {
      return connection.size > 0;
    })
    .map((connection, i) => {
      const id = i.toString();
      finalNeighborhoods[connection.jobId].popIds.push(id);
      finalNeighborhoods[connection.residenceId].popIds.push(id);
      return {
        ...connection,
        id,
      }
    });

    // handle airport terminals
  neighborhoodConnections.forEach((connection) =>{
    connection.residenceId = finalNeighborhoods[connection.residenceId].id;
    connection.jobId = finalNeighborhoods[connection.jobId].id;
  });

  return {
    points: Object.values(finalNeighborhoods),
    pops: neighborhoodConnections,
  }
};

// ─── Entry ───────────────────────────────────────────────────────────────────

async function run(placeCode) {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
  const places = placeCode
    ? config.places.filter((p) => p.code === placeCode)
    : config.places;

  if (!places.length) {
    console.error(`[buildings] No place found with code "${placeCode}"`);
    process.exit(1);
  }

  fs.mkdirSync(path.join(ROOT, 'raw_data'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'processed_data'), { recursive: true });

  for (const place of places) {
    fs.mkdirSync(path.join(ROOT, 'raw_data', place.code), { recursive: true });
    fs.mkdirSync(path.join(ROOT, 'processed_data', place.code), { recursive: true });

    // Fetch already generated buildings
    const rawBuildingsPath = path.join(ROOT, 'raw_data', place.code, 'buildings.json');
    if (fs.existsSync(rawPath)) {
        // Process
        console.log(`[population] Getting subdivision data for ${place.code}…`);
        console.time(`[population] subdivision process ${place.code}`);
        const index = processBuildings(rawBuildings);
        console.timeEnd(`[population] subdivision process ${place.code}`);

        const outPath = path.join(ROOT, 'processed_data', place.code, 'demand_data.json');
        console.log(`[population] Writing demand_data.json for ${place.code}…`);
        await writeJsonFile(outPath, index);
        console.log(`[population] Done: ${place.code} — ${index.stats.count} demand points.`);
    } else {
        console.error(`buildings.json does not exist! Have you run buildings.js yet for "${placeCode}" ?`);
    }
  }
}

if (!fs.existsSync(`${import.meta.dirname}/processed_data`)) fs.mkdirSync(`${import.meta.dirname}/processed_data`);
config.places.forEach((place) => {
  (async () => {
    if (fs.existsSync(`${import.meta.dirname}/processed_data/${place.code}`)) fs.rmSync(`${import.meta.dirname}/processed_data/${place.code}`, { recursive: true, force: true });
    fs.mkdirSync(`${import.meta.dirname}/processed_data/${place.code}`)
    await processAllData(place);
    console.log(`Finished processing ${place.code}.`);
  })();
});