import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentList } from './StudentList';
import { Student } from '@/types';

describe('StudentList Component', () => {
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

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render student list with multiple students', () => {
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Daftar Siswa')).toBeInTheDocument();
    expect(screen.getByText('Ahmad Fauzi')).toBeInTheDocument();
    expect(screen.getByText('Siti Aminah')).toBeInTheDocument();
  });

  it('should show Ikhwan for male students', () => {
    render(
      <StudentList
        students={[mockStudents[0]]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Ikhwan')).toBeInTheDocument();
  });

  it('should show Akhwat for female students', () => {
    render(
      <StudentList
        students={[mockStudents[1]]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Akhwat')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockStudents[0]);
  });

  it('should call onDelete when delete button is clicked', () => {
    render(
      <StudentList
        students={mockStudents}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Hapus');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith('student-1');
  });

  it('should show empty state when no students', () => {
    render(
      <StudentList
        students={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(
      screen.getByText('Belum ada siswa di kelas ini')
    ).toBeInTheDocument();
  });
});