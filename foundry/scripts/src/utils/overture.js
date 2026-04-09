import duckdb, { DuckDBConnection } from '@duckdb/node-api';
// Overture DuckDB client

// NONE OF THIS IS WORKING RIGHT NOW - byteofbacon 4/8/26

// install duckdb_spatial extension for geospatial queries

export async function runQueryOverture(query) { 
  //create local instance in memory
  try {
    console.log(duckdb.version());
    const db = await DuckDBConnection.create();
    await db.run(`INSTALL spatial;`);
    await db.run(`LOAD spatial;`);
    await db.run(`INSTALL httpfs;`)
    await db.run(`SET s3_region='us-west-2';`); //change for your region
    const data = await db.runAndReadAll(query); //returns geoparquet
    if (!data) {
      throw new Error('No data returned from Overture query');
    }
    return data;
  } catch (err) {
    console.error('Error running Overture query:', query, err);
    throw err;
  }
}