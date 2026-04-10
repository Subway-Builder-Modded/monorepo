//

This project aims to create a set of scripts and gui tools that make it easier to turn high-quality census data into subway-builder maps.

Scripts:

Scripts/utils:
    file.js - File Handling Functons.
    overpass.js - Functions for Overpass queries.
    overture.js - Functions for Overture queries.

Step 1: pmtiles.js: Creates pmtiles.

Step 2: data scraping
roads.js: Creates roads.
runways-taxiways.js: Creates airport infrastructure.
buildings.js: Gets building data from Overture/Overpass and stores it in raw/building_data.json. 

Step 3: user data input (generate regions_data_input.json and special_data_input.json)

Step 4: processing

    buildingPopData.js - Takes in regions_data_input, special_data_input, and building_data.json.


routes.js: Gets points from optimized_pop_data, splits pops and routes them. Outputs demand_data.json

User Data Schemas (Must create these yourself from census data. In the future, these can be inputted through the Foundry GUI)

    regions_data_input.json - featureCollection of administrative boundary areas, along with residents and jobs.
        {
            type: "FeatureCollection",
            bbox,
            features: [{
                type: "Feature"
                geometry: {Polygon},
                properties: {
                    id,
                    name,
                    admin_level,
                    residents,
                    jobs
                }
            }],
            map_code,
            generated_at,
        };
    
    special_data_input.json
        {
            country,
            map_code,
            data[{id, location{lat,lon}, type, residents, jobs}]
        }
    
    type.schema.json // defines a schema for types.

Raw Data Schemas:

    building_data.json // list of buildings
    pop_data.json // population data by individual building
        {
            type: "FeatureCollection",
            bbox,
            features: [{
                type: "Feature"
                geometry: {Point},
                properties: {
                    id,
                    residents,
                    jobs
                }
            }],
            map_code,
            generated_at,
        }
    optimized_pop_data // population points, optimize

Final Data Schemas:

   demand_data.json - demand points for the game 
   buildingsIndex.json - buildings layer
   roads.geojson - roads layer
   runwaysTaxiways.json - runways and taxiways layer
   oceanDepthIndex.json - oceanDepth layer
   special_data.json - Special Data layer for Special Data mod.
   pmtiles 