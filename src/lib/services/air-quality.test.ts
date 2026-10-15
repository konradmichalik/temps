import { describe, expect, it } from 'vitest';
import { toAirQuality } from './air-quality';

describe('toAirQuality', () => {
  it('names the leading pollutant from the European sub-indices', () => {
    const air = toAirQuality({
      european_aqi: 26,
      pm2_5: 6.1,
      european_aqi_pm2_5: 26,
      european_aqi_pm10: 14,
      european_aqi_nitrogen_dioxide: 18,
      european_aqi_ozone: 15,
      european_aqi_sulphur_dioxide: 2,
      grass_pollen: 3,
    });
    expect(air.aqi).toBe(26);
    expect(air.leading).toBe('pm2_5');
    expect(air.pollen).toEqual([{ species: 'grass_pollen', value: 3 }]);
  });

  it('has no leading pollutant without sub-indices', () => {
    expect(toAirQuality({ european_aqi: 12 }).leading).toBeNull();
  });
});
