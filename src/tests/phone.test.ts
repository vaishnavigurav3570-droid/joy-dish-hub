import { describe, it, expect } from 'vitest';
import { validateIndianPhone } from '../lib/phone';

describe('validateIndianPhone', () => {
  it('validates a standard 10 digit number', () => {
    const result = validateIndianPhone('9876543210');
    expect(result.valid).toBe(true);
    expect(result.cleaned).toBe('9876543210');
  });

  it('validates a number with +91 prefix', () => {
    const result = validateIndianPhone('+919876543210');
    expect(result.valid).toBe(true);
    expect(result.cleaned).toBe('9876543210');
  });

  it('validates a number with spaces and dashes', () => {
    const result = validateIndianPhone('+91 98765-43210');
    expect(result.valid).toBe(true);
    expect(result.cleaned).toBe('9876543210');
  });

  it('rejects an invalid number (wrong starting digit)', () => {
    const result = validateIndianPhone('5876543210');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a short number', () => {
    const result = validateIndianPhone('98765');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects non-numeric strings', () => {
    const result = validateIndianPhone('abcdefghij');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
