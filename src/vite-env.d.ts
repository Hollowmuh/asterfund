/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FUND_MANAGER_CONTRACT_ADDRESS: string
    readonly VITE_USDT_CONTRACT_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}