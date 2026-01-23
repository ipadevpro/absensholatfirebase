import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCoordinatorsByClass, getAllCoordinators, addCoordinator, deleteCoordinator } from './coordinators';
import { collection, getDocs, addDoc, deleteDoc, query, where, doc } from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getFirestore: vi.fn(),
  enableIndexedDbPersistence: vi.fn().mockResolvedValue(undefined),
}));

// Mock the db instance
vi.mock('@/lib/firebase/config', () => ({
  db: {}
}));

describe('Coordinators DB Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCoordinatorsByClass', () => {
    it('should query coordinators by classId', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ name: 'John', classId: 'class1' }) },
        { id: '2', data: () => ({ name: 'Jane', classId: 'class1' }) },
      ];
      (getDocs as any).mockResolvedValue({ docs: mockDocs });
      
      const result = await getCoordinatorsByClass('class1');
      
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('classId', '==', 'class1');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: '1', name: 'John', classId: 'class1' });
    });
  });

  describe('getAllCoordinators', () => {
    it('should fetch all coordinators', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ name: 'John' }) },
      ];
      (getDocs as any).mockResolvedValue({ docs: mockDocs });

      const result = await getAllCoordinators();

      expect(collection).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: '1', name: 'John' });
    });
  });

  describe('addCoordinator', () => {
    it('should add a coordinator with createdAt date', async () => {
      (addDoc as any).mockResolvedValue({ id: 'new-id' });
      
      const newCoord = {
        name: 'New Coord',
        uid: 'uid123',
        gender: 'ikhwan' as const,
        classId: 'class1'
      };

      const result = await addCoordinator(newCoord);

      expect(addDoc).toHaveBeenCalled();
      // Check if the second argument (data) contains createdAt
      const callArgs = (addDoc as any).mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        ...newCoord,
        createdAt: expect.any(Date)
      });
      expect(result).toBe('new-id');
    });
  });

  describe('deleteCoordinator', () => {
    it('should delete coordinator by id', async () => {
      await deleteCoordinator('coord-1');
      
      expect(doc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});
