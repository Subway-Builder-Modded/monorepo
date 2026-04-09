import type { MapManifest, ModManifest } from '../types/manifest';

export type InstalledTaggedItem =
  | {
      type: 'mod';
      item: ModManifest;
      installedVersion: string;
      installedSizeBytes: number;
      isLocal: boolean;
    }
  | {
      type: 'map';
      item: MapManifest;
      installedVersion: string;
      installedSizeBytes: number;
      isLocal: boolean;
    };
