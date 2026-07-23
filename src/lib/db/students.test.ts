import { vi, describe, it, expect } from 'vitest';
import { deleteStudents } from './students';
import { writeBatch } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  const mockDelete = vi.fn();
  const mockCommit = vi.fn();
  const mockWriteBatch = vi.fn(() => ({
    delete: mockDelete,
    commit: mockCommit,
  }));
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn((db, col, id) => `doc-${id}` as any),
    query: vi.fn(),
    where: vi.fn(),
    writeBatch: mockWriteBatch,
  };
});

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('deleteStudents', () => {
  it('should use writeBatch to delete multiple student documents', async () => {
    const ids = ['id1', 'id2', 'id3'];
    await deleteStudents(ids);
    
    const batch = writeBatch({} as any);
    expect(writeBatch).toHaveBeenCalled();
    expect(batch.delete).toHaveBeenCalledTimes(3);
    expect(batch.commit).toHaveBeenCalled();
  });
});
