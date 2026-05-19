import { describe, expect, it } from 'vitest'
import { buildAssetUrl, buildUploadObjectKey, extractBucketName, resolveUploadTarget } from '@/src/lib/upload-targets'

describe('upload-targets', () => {
  it('extracts the bucket name from tenant URLs', () => {
    expect(extractBucketName('https://acme.agilecdn.com.br')).toBe('acme.agilecdn.com.br')
    expect(extractBucketName('acme.agilecdn.com.br')).toBe('acme.agilecdn.com.br')
  })

  it('builds public asset URLs safely', () => {
    expect(buildAssetUrl('https://acme.agilecdn.com.br/', 'banners/banner.png')).toBe('https://acme.agilecdn.com.br/banners/banner.png')
  })

  it('builds upload object keys with slug and timestamp', () => {
    const key = buildUploadObjectKey('banners', 'Meu Banner Final.png')
    expect(key).toMatch(/^banners\/Meu-Banner-Final-\d+\.png$/i)
  })

  it('resolves the tenant public banners target from tenant bucket URL', () => {
    expect(resolveUploadTarget({
      profileId: 'tenant-public-images',
      tenantBucketUrl: 'https://acme.agilecdn.com.br',
      folder: 'banners',
      privateBucket: 'agileecommerce-files',
    })).toEqual({
      bucket: 'acme.agilecdn.com.br',
      baseUrl: 'https://acme.agilecdn.com.br',
      keyPrefix: 'banners',
      acl: 'public-read',
      isPublic: true,
    })
  })
  it('allows public CDN uploads to use a feature-specific folder', () => {
    expect(resolveUploadTarget({
      profileId: 'public-cdn-components',
      folder: 'notificacoes/email',
    })).toEqual({
      bucket: 'assets.agilecdn.com.br',
      baseUrl: 'https://assets.agilecdn.com.br',
      keyPrefix: 'notificacoes/email',
      acl: 'public-read',
      isPublic: true,
    })
  })
})
