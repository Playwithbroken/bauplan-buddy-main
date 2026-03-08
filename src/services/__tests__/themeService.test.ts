let themeService: typeof import('../themeService').default;

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const defineDocumentMocks = () => {
  Object.defineProperty(document, 'documentElement', {
    value: {
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
      },
      style: {},
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    },
    configurable: true,
    writable: true
  });

  jest.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
    if (selector === 'meta[name="theme-color"]') {
      return {
        setAttribute: jest.fn()
      } as unknown as Element;
    }
    if (selector === 'link[rel="icon"]') {
      return {
        setAttribute: jest.fn()
      } as unknown as Element;
    }
    return null;
  });
};

const defineWindowMocks = () => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('ThemeService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();

    defineWindowMocks();
    defineDocumentMocks();

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      themeService = require('../themeService').default;
    });
  });

  describe('Theme Management', () => {
    test('should get theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ theme: 'dark' }));

      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        themeService = require('../themeService').default;
      });

      const theme = themeService.getCurrentTheme();
      expect(theme).toBe('dark');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme-config');
    });

    test('should return system theme when no stored theme exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        themeService = require('../themeService').default;
      });

      const theme = themeService.getCurrentTheme();
      expect(theme).toBe('system');
    });

    test('should set theme', () => {
      themeService.setTheme('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'theme-config',
        expect.stringContaining('"theme":"dark"')
      );
    });
  });
});
