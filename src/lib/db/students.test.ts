import { vi, describe, it, expect } from 'vitest';
import { deleteStudents, getStudentsByClass } from './students';
import { writeBatch, getDocs } from 'firebase/firestore';

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

describe('getStudentsByClass', () => {
  it('should fetch students for a class and sort them alphabetically by name', async () => {
    const mockDocs = [
      { id: '1', data: () => ({ name: 'Budi', classId: '7a', gender: 'ikhwan' }) },
      { id: '2', data: () => ({ name: 'Ahmad', classId: '7a', gender: 'ikhwan' }) },
      { id: '3', data: () => ({ name: 'Cici', classId: '7a', gender: 'akhwat' }) },
    ];
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: mockDocs,
    } as any);

    const result = await getStudentsByClass('7a');

    expect(getDocs).toHaveBeenCalled();
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Ahmad');
    expect(result[1].name).toBe('Budi');
    expect(result[2].name).toBe('Cici');
  });
});
