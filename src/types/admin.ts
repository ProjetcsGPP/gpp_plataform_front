export type AdminSortDirection = "asc" | "desc";

export interface AdminSortRule<SortKey extends string = string> {
  key: SortKey;
  direction: AdminSortDirection;
}

export interface AdminListQuery<SortKey extends string = string> {
  page: number;
  pageSize: number;
  sorting: AdminSortRule<SortKey>[];
}

export type AdminTableDensity = "compact" | "comfortable";

export interface AdminListPreferences<SortKey extends string = string> {
  pageSize: number;
  density: AdminTableDensity;
  sorting: AdminSortRule<SortKey>[];
}
