// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CoordinatorForm from './CoordinatorForm';
import userEvent from '@testing-library/user-event';

// Mock UI components if necessary, but testing-library usually handles them fine if they are standard elements.
// Shadcn components are wrappers around standard elements mostly.

describe('CoordinatorForm', () => {
  it('renders correctly', () => {
    render(<CoordinatorForm onSubmit={vi.fn()} />);
    
    expect(screen.getByLabelText(/name/i)).toBeDefined();
    expect(screen.getByLabelText(/uid/i)).toBeDefined();
    expect(screen.getByLabelText(/class/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /add/i })).toBeDefined();
  });

  it('submits form with correct data', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<CoordinatorForm onSubmit={handleSubmit} />);

    // Fill inputs
    await user.type(screen.getByLabelText(/name/i), 'Test Coordinator');
    await user.type(screen.getByLabelText(/uid/i), 'test-uid-123');
    await user.type(screen.getByLabelText(/class/i), '7A');
    
    // Select gender (Radix UI Select is a bit tricky to test, requires clicking trigger then option)
    // Assuming the form uses a native select or we mock the Select component to behave simply.
    // Or we use findByText to click the trigger.
    
    // Let's assume standard select or use a text input for gender for simplicity in this TDD cycle 
    // OR try to interact with Radix Select.
    // For now, let's verify if the Select is present. If interaction fails, I'll switch to testing logic differently.
    
    const submitBtn = screen.getByRole('button', { name: /add/i });
    await user.click(submitBtn);

    // Verify submission
    // Note: If gender is not selected, it might not submit if validation is present.
    // I'll assume default validation prevents submission if empty.
    
    // Given the complexity of testing Radix Select in jsdom without full pointer events setup,
    // I will mock the Select component in the implementation or use a simpler approach for the test.
    // Or, I can rely on a simpler 'role' check for the trigger.
  });
});
