import {
  cn as sharedCn,
  type ClassValue as SharedClassValue,
} from '@subway-builder-modded/shared-ui';

export type ClassValue = SharedClassValue;

export function cn(...inputs: ClassValue[]) {
  return sharedCn(...inputs);
}
