export interface PublicPage {
  slug: string
  title: string
  content: string
}

export interface AdminPage {
  id: string
  slug: string
  title: string
  content: string
  isPublished: boolean
  showInFooter: boolean
  footerSortOrder: number | null
  createdAt: string
  updatedAt: string
  updatedByUserId: string | null
}

export interface CreatePageRequest {
  slug: string
  title: string
  content: string
  isPublished: boolean
  showInFooter: boolean
  footerSortOrder: number | null
}

export interface UpdatePageRequest extends CreatePageRequest {}