import {
  getDateString,
  setTimeOnDate,
  roundToHalfHour,
  msToHours,
  maxDate,
  minDate,
} from '../../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('getDateString', () => {
    it('formats date as YYYY-MM-DD', () => {
      expect(getDateString(new Date('2026-02-13T15:30:00Z'))).toBe('2026-02-13');
    });
  });

  describe('setTimeOnDate', () => {
    it('sets UTC hours and minutes on a date', () => {
      const base = new Date('2026-02-13T12:00:00Z');
      const result = setTimeOnDate(base, 8, 0);
      expect(result.getUTCHours()).toBe(8);
      expect(result.getUTCMinutes()).toBe(0);
    });
  });

  describe('roundToHalfHour', () => {
    it('rounds 45 minutes up to 60', () => expect(roundToHalfHour(45)).toBe(60));
    it('rounds 14 minutes down to 0', () => expect(roundToHalfHour(14)).toBe(0));
    it('rounds 15 minutes up to 30', () => expect(roundToHalfHour(15)).toBe(30));
    it('keeps 30 minutes as 30', () => expect(roundToHalfHour(30)).toBe(30));
  });

  describe('msToHours', () => {
    it('converts 3600000ms to 1 hour', () => expect(msToHours(3_600_000)).toBe(1));
    it('converts 1800000ms to 0.5 hour', () => expect(msToHours(1_800_000)).toBe(0.5));
  });

  describe('maxDate / minDate', () => {
    const a = new Date('2026-01-01T08:00:00Z');
    const b = new Date('2026-01-01T17:00:00Z');
    it('maxDate returns the later date', () => expect(maxDate(a, b)).toBe(b));
    it('minDate returns the earlier date', () => expect(minDate(a, b)).toBe(a));
  });
});
