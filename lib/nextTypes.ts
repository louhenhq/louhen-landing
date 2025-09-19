/** Standard type for Next App Router page props (server components). */
export type SearchParams = Record<string, string | string[] | undefined>;

export type PageProps<T extends SearchParams = SearchParams> = {
  params?: Record<string, string | undefined>;
  searchParams?: T;
};
