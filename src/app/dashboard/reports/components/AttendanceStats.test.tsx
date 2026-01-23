import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttendanceStats } from './AttendanceStats';
import { AttendanceStats as StatsType } from '@/types';

// Mock UI components to avoid dependency issues in test environment
// if they are not easily testable. But they are just divs/tables.
// We'll rely on shallow rendering or just normal rendering if environment supports it.

const mockStats: StatsType[] = [
  { studentId: '1', studentName: 'Student A', totalPrayers: 10, attended: 10, percentage: 100 }, // A
  { studentId: '2', studentName: 'Student B', totalPrayers: 10, attended: 8, percentage: 80 },   // B
  { studentId: '3', studentName: 'Student C', totalPrayers: 10, attended: 7, percentage: 70 },   // C
  { studentId: '4', studentName: 'Student D', totalPrayers: 10, attended: 6, percentage: 60 },   // D
  { studentId: '5', studentName: 'Student E', totalPrayers: 10, attended: 4, percentage: 40 },   // E
];

describe('AttendanceStats Component', () => {
  it('renders student names and correct grades', () => {
    render(<AttendanceStats stats={mockStats} />);

    expect(screen.getByText('Student A')).toBeDefined();
    // We expect to find 'A' associated with Student A row.
    // For now just checking if 'A' is in the document is a loose check.
    // A stricter check would be better but requires more setup.
    
    // Let's assume the table has a "Grade" column.
    
    // Check for presence of grades
    expect(screen.getAllByText('A')).toHaveLength(1); // One A
    expect(screen.getAllByText('B')).toHaveLength(1);
    expect(screen.getAllByText('C')).toHaveLength(1);
    expect(screen.getAllByText('D')).toHaveLength(1);
    expect(screen.getAllByText('E')).toHaveLength(1);
  });
});
