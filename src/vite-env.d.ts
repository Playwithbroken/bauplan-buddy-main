/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_USE_API: string
  readonly VITE_USE_MOCK_BACKEND: string
  readonly VITE_QUOTE_SERVICE_URL: string
  readonly VITE_PROJECT_SERVICE_URL: string
  readonly VITE_DELIVERY_SERVICE_URL: string
  readonly VITE_INVOICE_SERVICE_URL: string
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
