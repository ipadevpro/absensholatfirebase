import { vi, describe, it, expect } from 'vitest';
import { getAttendanceStartDate, updateAttendanceStartDate, getHolidays, updateHolidays, isHoliday } from './settings';
import { getDoc, setDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  const mockGetDoc = vi.fn(() => ({
    exists: () => true,
    data: () => ({
      startDate: '2025-02-10',
      holidays: [
        { id: '1', startDate: '2025-03-31', endDate: '2025-04-05', description: 'Idul Fitri' },
        { id: '2', startDate: '2025-05-01', endDate: '2025-05-01', description: 'Hari Buruh' }
      ]
    })
  }));
  const mockSetDoc = vi.fn();
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn((db, col, id) => `doc-${id}` as any),
    getDoc: mockGetDoc,
    setDoc: mockSetDoc,
  };
});

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('Settings DB helpers', () => {
  it('should fetch start date setting', async () => {
    const date = await getAttendanceStartDate();
    expect(date).toBe('2025-02-10');
    expect(getDoc).toHaveBeenCalled();
  });

  it('should update start date setting', async () => {
    await updateAttendanceStartDate('2025-02-15');
    expect(setDoc).toHaveBeenCalled();
  });

  it('should fetch holidays', async () => {
    const holidays = await getHolidays();
    expect(holidays).toHaveLength(2);
    expect(holidays[0].description).toBe('Idul Fitri');
  });

  it('should update holidays', async () => {
    await updateHolidays([{ id: '3', startDate: '2025-08-17', endDate: '2025-08-17', description: 'HUT RI' }]);
    expect(setDoc).toHaveBeenCalled();
  });

  describe('isHoliday', () => {
    const holidays = [
      { id: '1', startDate: '2025-03-31', endDate: '2025-04-05', description: 'Idul Fitri' },
      { id: '2', startDate: '2025-05-01', endDate: '2025-05-01', description: 'Hari Buruh' }
    ];

    it('should correctly identify dates within range as holiday', () => {
      expect(isHoliday('2025-03-31', holidays)?.description).toBe('Idul Fitri');
      expect(isHoliday('2025-04-02', holidays)?.description).toBe('Idul Fitri');
      expect(isHoliday('2025-04-05', holidays)?.description).toBe('Idul Fitri');
    });

    it('should correctly identify single day holiday', () => {
      expect(isHoliday('2025-05-01', holidays)?.description).toBe('Hari Buruh');
    });

    it('should return undefined for non-holidays', () => {
      expect(isHoliday('2025-03-30', holidays)).toBeUndefined();
      expect(isHoliday('2025-04-06', holidays)).toBeUndefined();
      expect(isHoliday('2025-05-02', holidays)).toBeUndefined();
    });
  });
});

