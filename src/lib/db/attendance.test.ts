import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAttendance, markPresent, markAbsent } from './attendance';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const mockDocRef = { id: 'mock-doc-ref' };

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: 'mock-doc-ref' })),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  arrayUnion: vi.fn((...args) => args),
  arrayRemove: vi.fn((...args) => args),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('Attendance DB Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAttendance', () => {
    it('should return present students when document exists', async () => {
      const mockData = { presentStudents: ['student1', 'student2'] };
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => mockData,
      });

      const result = await getAttendance('2024-01-01', 'class1', 'ikhwan', 'zuhur');
      expect(result).toEqual(['student1', 'student2']);
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'attendance', '2024-01-01_class1_ikhwan_zuhur');
    });

    it('should return empty array when document does not exist', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => false,
      });

      const result = await getAttendance('2024-01-01', 'class1', 'ikhwan', 'zuhur');
      expect(result).toEqual([]);
    });
  });

  describe('markPresent', () => {
    it('should update existing document if it exists', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ presentStudents: [] }),
      });

      await markPresent('2024-01-01', 'class1', 'ikhwan', 'zuhur', 'student1');
      
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'attendance', '2024-01-01_class1_ikhwan_zuhur');
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
        presentStudents: expect.any(Array) // arrayUnion returns an array in our mock
      });
      expect(arrayUnion).toHaveBeenCalledWith('student1');
    });

    it('should create new document if it does not exist', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => false,
      });

      await markPresent('2024-01-01', 'class1', 'ikhwan', 'zuhur', 'student1');

      expect(setDoc).toHaveBeenCalledWith(expect.anything(), {
        date: '2024-01-01',
        classId: 'class1',
        gender: 'ikhwan',
        prayerType: 'zuhur',
        presentStudents: ['student1'],
      });
    });
  });

  describe('markAbsent', () => {
    it('should remove student from presentStudents', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => true,
      });

      await markAbsent('2024-01-01', 'class1', 'ikhwan', 'zuhur', 'student1');

      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
        presentStudents: expect.any(Array)
      });
      expect(arrayRemove).toHaveBeenCalledWith('student1');
    });
  });
});
