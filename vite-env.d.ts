/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the FitOS API, e.g. http://localhost:5139. Required: there is no built-in default. */
  readonly VITE_API_URL?: string;
  /** Apex domain in production (e.g. fitos.com): the gym is then taken from the sub-domain instead of typed. */
  readonly VITE_BASE_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
