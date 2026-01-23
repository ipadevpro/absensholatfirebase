import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import {
  getStudentsByClass,
  addStudent,
  updateStudent,
  deleteStudent,
} from './students';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { Student } from '@/types';

// Mock Firebase Firestore
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    collection: vi.fn(() => 'mockCollection'),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(() => 'mockDocRef'),
    query: vi.fn(() => 'mockQuery'),
    where: vi.fn(() => 'mockWhereClause'),
    getFirestore: vi.fn(() => ({})),
    enableIndexedDbPersistence: vi.fn(() => Promise.reject(new Error('Mock persistence error'))),
  };
});

// Mock Firebase config module
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

// Create a mock db object
const mockDb = {};

describe('Students DB Functions', () => {
  const mockStudents: Student[] = [
    {
      id: 'student-1',
      name: 'Ahmad Fauzi',
      gender: 'ikhwan',
      classId: 'class-1',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'student-2',
      name: 'Siti Aminah',
      gender: 'akhwat',
      classId: 'class-1',
      createdAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStudentsByClass', () => {
    it('should return students filtered by classId', async () => {
      const mockQuerySnapshot = {
        docs: mockStudents.map((student) => ({
          id: student.id,
          data: () => student,
        })),
      };

      (getDocs as unknown as Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await getStudentsByClass('class-1');

      expect(collection).toHaveBeenCalledWith(mockDb, 'students');
      expect(where).toHaveBeenCalledWith('classId', '==', 'class-1');
      expect(query).toHaveBeenCalledWith('mockCollection', 'mockWhereClause');
      expect(getDocs).toHaveBeenCalledWith('mockQuery');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('student-1');
      expect(result[1].id).toBe('student-2');
    });

    it('should return empty array when no students found', async () => {
      const mockQuerySnapshot = {
        docs: [],
      };

      (where as unknown as Mock).mockReturnValue('mockWhereClause');
      (query as unknown as Mock).mockReturnValue('mockQuery');
      (getDocs as unknown as Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await getStudentsByClass('non-existent-class');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('addStudent', () => {
    it('should add a new student and return the document ID', async () => {
      const newStudent = {
        name: 'New Student',
        gender: 'ikhwan' as const,
        classId: 'class-1',
      };

      (addDoc as unknown as Mock).mockResolvedValue({ id: 'new-student-id' });

      const result = await addStudent(newStudent);

      expect(addDoc).toHaveBeenCalledWith(
        'mockCollection',
        expect.objectContaining({
          name: 'New Student',
          gender: 'ikhwan',
          classId: 'class-1',
          createdAt: expect.any(Date),
        })
      );
      expect(result).toBe('new-student-id');
    });
  });

  describe('updateStudent', () => {
    it('should update an existing student', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      (updateDoc as unknown as Mock).mockResolvedValue(undefined);

      await updateStudent('student-1', updateData);

      expect(doc).toHaveBeenCalledWith(mockDb, 'students', 'student-1');
      expect(updateDoc).toHaveBeenCalledWith('mockDocRef', updateData);
    });
  });

  describe('deleteStudent', () => {
    it('should delete a student by ID', async () => {
      (deleteDoc as unknown as Mock).mockResolvedValue(undefined);

      await deleteStudent('student-1');

      expect(doc).toHaveBeenCalledWith(mockDb, 'students', 'student-1');
      expect(deleteDoc).toHaveBeenCalledWith('mockDocRef');
    });
  });
});