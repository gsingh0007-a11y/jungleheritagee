
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SITE_URL = "https://jungleheritage.in"
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ""
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ""

const staticRoutes = [
    { path: '/', priority: '1.0' },
    { path: '/rooms', priority: '0.8' },
    { path: '/experiences', priority: '0.8' },
    { path: '/amenities', priority: '0.7' },
    { path: '/packages', priority: '0.7' },
    { path: '/gallery', priority: '0.6' },
    { path: '/contact', priority: '0.7' },
    { path: '/about', priority: '0.7' },
    { path: '/careers', priority: '0.5' },
    { path: '/blog', priority: '0.8' },
    { path: '/privacy', priority: '0.3' },
    { path: '/terms', priority: '0.3' }
]

serve(async (req) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const today = new Date().toISOString().split('T')[0]

    try {
        // Fetch dynamic content
        const [rooms, experiences, blogs] = await Promise.all([
            supabase.from('room_categories').select('slug'),
            supabase.from('experiences').select('slug'),
            supabase.from('blogs').select('slug').eq('is_published', true)
        ])

        let xml = '<?xml version="1.0" encoding="UTF-8"?>'
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

        // Add static routes
        staticRoutes.forEach(route => {
            xml += `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <priority>${route.priority}</priority>
  </url>`
        })

        // Add rooms
        rooms.data?.forEach(room => {
            xml += `
  <url>
    <loc>${SITE_URL}/rooms/${room.slug}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
  </url>`
        })

        // Add experiences
        experiences.data?.forEach(exp => {
            xml += `
  <url>
    <loc>${SITE_URL}/experiences/${exp.slug}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
  </url>`
        })

        // Add blogs
        blogs.data?.forEach(blog => {
            xml += `
  <url>
    <loc>${SITE_URL}/blog/${blog.slug}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.6</priority>
  </url>`
        })

        xml += '\n</urlset>'

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            }
        })

    } catch (error) {
        console.error('Sitemap error:', error)
        return new Response('Error generating sitemap', { status: 500 })
    }
})
