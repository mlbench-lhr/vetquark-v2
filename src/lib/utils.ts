import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type PaginationArgs = {
  page: number
  pageSize: number
  total: number
}

export type PaginationMeta = PaginationArgs & {
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function parsePagination(
  searchParams: URLSearchParams,
  options?: { defaultPage?: number; defaultPageSize?: number; maxPageSize?: number },
) {
  const defaultPage = options?.defaultPage ?? 1
  const defaultPageSize = options?.defaultPageSize ?? 50
  const maxPageSize = options?.maxPageSize ?? 100

  const rawPage = (searchParams.get("page") ?? searchParams.get("p") ?? "").trim()
  const rawPageSize = (
    searchParams.get("pageSize") ??
    searchParams.get("perPage") ??
    searchParams.get("limit") ??
    ""
  ).trim()

  const parsedPage = Number.parseInt(rawPage, 10)
  const parsedPageSize = Number.parseInt(rawPageSize, 10)

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : defaultPage
  const unclampedPageSize =
    Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : defaultPageSize
  const pageSize = Math.min(unclampedPageSize, maxPageSize)

  const skip = (page - 1) * pageSize
  return { page, pageSize, skip, limit: pageSize }
}

export function toPaginationMeta({ page, pageSize, total }: PaginationArgs): PaginationMeta {
  const totalPages = total <= 0 ? 0 : Math.ceil(total / pageSize)
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPrevPage: page > 1 && total > 0,
    hasNextPage: totalPages > 0 && page < totalPages,
  }
}

export function asNonEmptyTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function asOptionalTrimmedString(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.trim()
}

export function isMongoObjectId(value: unknown): value is string {
  if (typeof value !== "string") return false
  const trimmed = value.trim()
  return /^[a-fA-F0-9]{24}$/.test(trimmed)
}

export function isPushEnabledForUser(user: any, type: string): boolean {
  try {
    const settings = user && typeof user === "object" ? (user as any).notificationSettings : null
    const push = settings && typeof settings === "object" ? (settings as any).push : null
    const value = push && typeof push === "object" ? (push as any)[type] : undefined
    if (typeof value === "boolean") return value
    return true
  } catch {
    return true
  }
}
