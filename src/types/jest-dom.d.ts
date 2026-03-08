import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeChecked(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveAttribute(name: string, value?: string): R;
      toHaveValue(value: string | number): R;
      toHaveTextContent(content: string | RegExp): R;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
      toBePartiallyChecked(): R;
      toHaveDescription(description?: string | RegExp): R;
      toHaveAccessibleDescription(description?: string | RegExp): R;
      toHaveAccessibleName(name?: string | RegExp): R;
      toBeRequired(): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toHaveStyle(css: string | object): R;
      toHaveFocus(): R;
      toHaveFormValues(values: Record<string, unknown>): R;
      toBeEmptyDOMElement(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toHaveErrorMessage(message?: string | RegExp): R;
    }
  }
}