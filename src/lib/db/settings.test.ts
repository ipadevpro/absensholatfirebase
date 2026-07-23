import { vi, describe, it, expect } from 'vitest';
import { getAttendanceStartDate, updateAttendanceStartDate } from './settings';
import { getDoc, setDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  const mockGetDoc = vi.fn(() => ({
    exists: () => true,
    data: () => ({ startDate: '2025-02-10' })
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
});
