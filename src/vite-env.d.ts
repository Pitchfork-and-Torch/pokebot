/// <reference types="vite/client" />

declare module "*.md?raw" {
  const src: string;
  export default src;
}

declare module "*.tsx?raw" {
  const src: string;
  export default src;
}

declare module "*.html?raw" {
  const src: string;
  export default src;
}
