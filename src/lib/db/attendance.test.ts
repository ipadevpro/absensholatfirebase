import { vi, describe, it, expect } from 'vitest';
import { saveAttendanceRecord } from './attendance';
import { setDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  const mockSetDoc = vi.fn();
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn((db, col, id) => `doc-${id}` as any),
    setDoc: mockSetDoc,
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    onSnapshot: vi.fn(),
  };
});

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('saveAttendanceRecord', () => {
  it('should use setDoc to write the entire attendance statuses', async () => {
    const statuses = { 'student-1': 'hadir' as any };
    await saveAttendanceRecord('2025-02-14', '7a', 'ikhwan', 'zuhur', statuses);
    expect(setDoc).toHaveBeenCalled();
  });
});
