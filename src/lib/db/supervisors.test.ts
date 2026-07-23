import { vi, describe, it, expect } from 'vitest';
import { getAllSupervisors, addSupervisor, deleteSupervisor } from './supervisors';
import { getDocs, setDoc, deleteDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  const mockGetDocs = vi.fn(() => ({
    docs: [
      { id: '1', data: () => ({ name: 'Supervisor A', uid: 'uid-a' }) }
    ]
  }));
  const mockSetDoc = vi.fn();
  const mockDeleteDoc = vi.fn();

  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    getDocs: mockGetDocs,
    setDoc: mockSetDoc,
    deleteDoc: mockDeleteDoc,
    doc: vi.fn((db, col, id) => `doc-${id}` as any),
  };
});

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('Supervisor DB helpers', () => {
  it('should fetch all supervisors', async () => {
    const list = await getAllSupervisors();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Supervisor A');
    expect(getDocs).toHaveBeenCalled();
  });

  it('should add a supervisor', async () => {
    const uid = await addSupervisor({ name: 'Supervisor B', uid: 'uid-b' });
    expect(uid).toBe('uid-b');
    expect(setDoc).toHaveBeenCalled();
  });

  it('should delete a supervisor', async () => {
    await deleteSupervisor('uid-b');
    expect(deleteDoc).toHaveBeenCalled();
  });
});
