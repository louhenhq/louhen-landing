// Minimal shims so local tsc works without installed zustand types.
declare module 'zustand' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function create(): (initializer: any) => any;
}
declare module 'zustand/middleware' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function persist(initializer: any, options: any): any;
}
