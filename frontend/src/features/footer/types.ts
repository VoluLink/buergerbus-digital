export type FooterLinkType = 1 | 2

export interface PublicFooterLink {
  label: string
  url: string
  isExternal: boolean
  openInNewTab: boolean
  sortOrder: number
}

export interface PublicFooterResponse {
  links: PublicFooterLink[]
}

export interface AdminFooterLink {
  id: string
  label: string
  linkType: FooterLinkType
  sitePageId: string | null
  sitePageSlug: string | null
  externalUrl: string | null
  sortOrder: number
  isActive: boolean
  openInNewTab: boolean
  createdAt: string
  updatedAt: string
  updatedByUserId: string | null
}

export interface CreateFooterLinkRequest {
  label: string
  linkType: FooterLinkType
  sitePageId: string | null
  externalUrl: string | null
  sortOrder: number
  isActive: boolean
  openInNewTab: boolean
}

export interface UpdateFooterLinkRequest extends CreateFooterLinkRequest {}