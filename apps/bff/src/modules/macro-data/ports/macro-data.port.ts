// MacroDataPort — contract that all macro-data adapters must implement.

import { CountryProfile, MacroIndicator, MacroFilters } from '@dxp/contracts';

export abstract class MacroDataPort {
  abstract getCountryProfiles(): Promise<CountryProfile[]>;
  abstract getMacroIndicators(countryCode: string, filters: MacroFilters): Promise<MacroIndicator[]>;
}
