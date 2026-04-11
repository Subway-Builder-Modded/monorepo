/**
 * adds demand points based on user_data/boundaries and user_data/special_data
 * 
 * 1 point = 1 building, to be optimized later.
 */

import fs from 'fs';
import * as turf from '@turf/turf';
import { createParseStream } from 'big-json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// popweights and cell size stolen from old patcher scripts.
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

const processBuildingPopulation = (rawBuildings, rawBoundaries) => { 

  let calculatedBuildings = {};
  let finalBuildings = {};

  // estimates building pops and jobs
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

  //put buildings into a feature collection
  const buildingsAsFeatureCollection = turf.featureCollection(
    Object.values(calculatedBuildings).map((building) =>
      turf.point(building.buildingCenter, { buildingID: building.id, approxPop: building.approxPop, approxJobs:building.approxJobs})
    )
  );

  let finalAreaMembers = {}; // what buildings are in each area
  let finalAreaMetadata = {}; // additional info on population and job estimates in each area

  rawBoundaries.features.forEach((area) => {
    //find buildings within feature
    const buildingsWhichExistWithinFeature = turf.pointsWithinPolygon(buildingsAsFeatureCollection, area);
    finalAreaMembers[area.properties.id] = buildingsWhichExistWithinFeature.features;

    const finalFeature = { 
      ...feature.properties,
      totalPopulation: 0,
      totalJobs: 0,
      percentOfTotalPopulation: null,
      percentOfTotalJobs: null,
    };

    // sum estimated populations within each feature
    buildingsWhichExistWithinFeature.features.forEach((feature) => {
      const building = calculatedBuildings[feature.properties.buildingID];
      finalFeature.totalPopulation += (building.approxPop ?? 0);
      finalFeature.totalJobs += (building.approxJobs ?? 0);
    });

    //get percentages and correct data.
    buildingsWhichExistWithinFeature.features.forEach((feature) => {
      const building = calculatedBuildings[feature.properties.buildingID];
      finalFeature.percentOfTotalPopulation = building.approxPop / finalFeature.totalPopulation;
      finalFeature.percentOfTotalJobs = building.approxJobs / finalFeature.totalJobs;
      
      //adjusts population to be based off of input user data
      building.approxPop = area.properties.residents * finalFeature.percentOfTotalPopulation;
      building.approxJobs = area.properties.jobs * finalFeature.percentOfTotalJobs;
      finalBuildings[feature.properties.buildingID]
    });
    finalAreaMetadata[feature.id] = finalFeature;
  });

  //return buildings
  return buildingsAsFeatureCollection;

}

const processAllData = async (place) => {
  const readJsonFile = (filePath) => {
    return new Promise((resolve, reject) => {
      const parseStream = createParseStream();
      let jsonData;

      parseStream.on('data', (data) => {
        jsonData = data;
      });

      parseStream.on('end', () => {
        resolve(jsonData);
      });

      parseStream.on('error', (err) => {
        reject(err);
      });

      fs.createReadStream(filePath).pipe(parseStream);
    });
  };

  console.log('Reading raw data for', place.code);
  const rawBuildings = await readJsonFile(`${import.meta.dirname}/raw_data/${place.code}/buildings.json`);
  const rawBoundaries = await readJsonFile(`${import.meta.dirname}/user_data/${place.code}/regions_data_input.json`);

  console.log('Building Population Data for', place.code)
  const processedBuildingPopulation = processBuildingPopulation(rawBuildings, rawBoundaries);

  console.log('Writing finished data for', place.code)
  fs.writeFileSync(`${import.meta.dirname}/raw_data/${place.code}/pop_data.json`, JSON.stringify(processedBuildingPopulation), { encoding: 'utf8' });
};

if (!fs.existsSync(`${import.meta.dirname}/raw_data`)) fs.mkdirSync(`${import.meta.dirname}/raw_data`);
config.places.forEach((place) => {
  (async () => {
    if (fs.existsSync(`${import.meta.dirname}/raw_data/${place.code}`)) fs.rmSync(`${import.meta.dirname}/raw_data/${place.code}`, { recursive: true, force: true });
    fs.mkdirSync(`${import.meta.dirname}/raw_data/${place.code}`)
    await processAllData(place);
    console.log(`Finished processing ${place.code}.`);
  })();
});