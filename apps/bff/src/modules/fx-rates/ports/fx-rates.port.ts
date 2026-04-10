// FxRatesPort — contract that all FX-rate adapters must implement.

import { FxRatesSnapshot, FxRate, FxConvertResult, SgdRate } from '@dxp/contracts';

export abstract class FxRatesPort {
  abstract getRates(base: string): Promise<FxRatesSnapshot>;
  abstract getApacRates(): Promise<FxRate[]>;
  abstract convert(from: string, to: string, amount: number): Promise<FxConvertResult>;
  abstract getSgdRates(): Promise<SgdRate[]>;
}
