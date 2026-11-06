/** Generic error shape returned by Tauri commands */
export interface ApiError {
  message: string;
  code?: string;
}

/** Result wrapper for Tauri invoke calls */
export type InvokeResult<T> = T;

/** Sort direction */
export type SortDirection = "asc" | "desc";

/** Common list query parameters */
export interface ListParams {
  search?: string;
  sort_by?: string;
  sort_direction?: SortDirection;
  page?: number;
  per_page?: number;
}
