import { cn } from '../utils';

describe('cn utility function', () => {
  test('should merge class names correctly', () => {
    const result = cn('px-2 py-1', 'bg-blue-500', 'text-white');
    expect(result).toBe('px-2 py-1 bg-blue-500 text-white');
  });

  test('should handle conditional classes', () => {
    const isActive = true;
    const result = cn(
      'px-2 py-1',
      isActive ? 'bg-blue-500' : 'bg-gray-500',
      'text-white'
    );
    expect(result).toBe('px-2 py-1 bg-blue-500 text-white');
  });

  test('should merge conflicting Tailwind classes', () => {
    const result = cn('px-2 px-4', 'py-1 py-3');
    expect(result).toBe('px-4 py-3');
  });

  test('should handle undefined and null values', () => {
    const result = cn('px-2', undefined, null, 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  test('should handle empty strings', () => {
    const result = cn('px-2', '', 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  test('should work with arrays', () => {
    const result = cn(['px-2', 'py-1'], ['bg-blue-500', 'text-white']);
    expect(result).toBe('px-2 py-1 bg-blue-500 text-white');
  });

  test('should work with objects', () => {
    const result = cn({
      'px-2': true,
      'py-1': true,
      'bg-blue-500': true,
      'bg-red-500': false
    });
    expect(result).toBe('px-2 py-1 bg-blue-500');
  });

  test('should handle complex combinations', () => {
    const isError = false;
    const isDisabled = true;
    const size = 'large';
    
    const result = cn(
      'btn',
      {
        'btn-error': isError,
        'btn-disabled': isDisabled,
      },
      size === 'large' && 'btn-lg',
      ['text-white', 'font-medium']
    );
    
    expect(result).toBe('btn btn-disabled btn-lg text-white font-medium');
  });

  test('should return empty string for no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });
});