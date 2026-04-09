import type { AssetType } from './asset-types';

/** The shared filter state shape used by both the website and the Railyard app.
 *  Uses Railyard's canonical field names (sourceQuality, not dataQuality). */
export interface SharedFilterState {
  type: AssetType;
  mod: {
    tags: string[];
  };
  map: {
    locations: string[];
    sourceQuality: string[];
    levelOfDetail: string[];
    specialDemand: string[];
  };
}
