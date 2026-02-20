import { calculatePay, PAY_RATES } from '../../src/services/payroll.service';

function makeDate(hour: number, minute = 0): Date {
  const d = new Date('2026-02-13T00:00:00.000Z');
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

describe('calculatePay', () => {
  it('returns Rs 1000 + Rs 0 OT for 09:00–16:00 (fully within regular hours)', () => {
    const result = calculatePay(makeDate(9), makeDate(16));
    expect(result.regularPay).toBe(PAY_RATES.REGULAR_DAY_RATE);
    expect(result.overtimePay).toBe(0);
    expect(result.totalPay).toBe(1000);
  });

  it('returns Rs 1000 + Rs 80 morning + Rs 160 evening for 07:30–18:00', () => {
    const result = calculatePay(makeDate(7, 30), makeDate(18));
    expect(result.regularPay).toBe(1000);
    // 0.5 hr morning OT = Rs 80
    expect(result.overtimeHoursMorning).toBe(0.5);
    // 1 hr evening OT = Rs 160
    expect(result.overtimeHoursEvening).toBe(1);
    expect(result.overtimePay).toBe(240);   // 1.5 hrs × Rs 160
    expect(result.totalPay).toBe(1240);
  });

  it('returns Rs 0 regular + overtime-only for work entirely before 08:00', () => {
    // 06:00–07:30 — entirely before regular hours
    const result = calculatePay(makeDate(6), makeDate(7, 30));
    expect(result.regularPay).toBe(0);
    expect(result.regularHours).toBe(0);
    // 1.5 hrs OT rounded to nearest 30 min = 1.5 hrs = Rs 240
    expect(result.overtimePay).toBeCloseTo(240, 0);
  });

  it('calculates correctly for exact regular hours 08:00–17:00', () => {
    const result = calculatePay(makeDate(8), makeDate(17));
    expect(result.regularPay).toBe(1000);
    expect(result.overtimePay).toBe(0);
    expect(result.overtimeHoursMorning).toBe(0);
    expect(result.overtimeHoursEvening).toBe(0);
  });

  it('rounds overtime to nearest 30 minutes', () => {
    // 07:45–17:15 → 15 min morning (rounds to 0) + 15 min evening (rounds to 0)
    const result = calculatePay(makeDate(7, 45), makeDate(17, 15));
    expect(result.overtimeHoursMorning + result.overtimeHoursEvening).toBeLessThanOrEqual(0.5);
  });
});
