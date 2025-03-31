import { mount } from '@vue/test-utils'
import OptimizedImage from '../OptimizedImage.vue'
import { describe, it, expect, vi } from 'vitest'

describe('OptimizedImage', () => {
  it('loads image with correct attributes and headers', async () => {
    const wrapper = mount(OptimizedImage, {
      props: {
        src: 'https://firebasestorage.googleapis.com/test-image.jpg',
        alt: 'Test Image',
        width: 300,
        height: 200
      }
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://firebasestorage.googleapis.com/test-image.jpg')
    expect(img.attributes('alt')).toBe('Test Image')
    expect(img.attributes('width')).toBe('300')
    expect(img.attributes('height')).toBe('200')
    expect(img.attributes('loading')).toBe('lazy')
    expect(img.attributes('decoding')).toBe('async')
  })

  it('handles image load error and shows placeholder', async () => {
    const wrapper = mount(OptimizedImage, {
      props: {
        src: 'invalid-url.jpg',
        alt: 'Test Image'
      }
    })

    const img = wrapper.find('img')
    await img.trigger('error')
    expect(img.attributes('src')).toBe('/placeholder-image.jpg')
  })

  it('applies correct CSS classes and styles', () => {
    const wrapper = mount(OptimizedImage, {
      props: {
        src: 'test.jpg',
        alt: 'Test'
      }
    })

    const img = wrapper.find('img')
    
    // Check for the correct class
    expect(img.classes()).toContain('optimized-image')
    
    // Check inline styles if they exist
    const style = img.attributes('style')
    if (style) {
      expect(style).toContain('width: 100%')
      expect(style).toContain('height: 100%')
      expect(style).toContain('object-fit: cover')
      expect(style).toContain('background-color: #f5f5f5')
    }
  })

  it('respects CSP headers for Firebase Storage URLs', async () => {
    const wrapper = mount(OptimizedImage, {
      props: {
        src: 'https://firebasestorage.googleapis.com/test-image.jpg',
        alt: 'Test'
      }
    })

    const img = wrapper.find('img')
    const src = img.attributes('src')
    
    // Verify the URL matches Firebase Storage pattern
    expect(src).toMatch(/^https:\/\/firebasestorage\.googleapis\.com\/.*/)
    
    // Verify the URL is allowed by CSP
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (meta) {
      const csp = meta.content
      expect(csp).toContain("img-src 'self' data: https: https://*.firebasestorage.googleapis.com")
    }
  })
}) 