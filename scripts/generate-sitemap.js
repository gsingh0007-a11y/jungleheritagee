import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = "https://imlbvvxyxlknevvlbbpr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbGJ2dnh5eGxrbmV2dmxiYnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Mjg3NjYsImV4cCI6MjA4NTUwNDc2Nn0.kJ9LExD3-x0h5IwJ1TFwZtEyvwOnp5s9CpXV9CKajUA";

// Site configuration
const SITE_URL = "https://jungleheritage.in";
const TODAY = new Date().toISOString().split('T')[0];

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
];

async function generateSitemap() {
    console.log('Generating sitemap...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // Fetch dynamic routes
        const [rooms, experiences, blogs] = await Promise.all([
            supabase.from('room_categories').select('slug'),
            supabase.from('experiences').select('slug'),
            supabase.from('blogs').select('slug').eq('is_published', true)
        ]);

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Add static routes
        staticRoutes.forEach(route => {
            xml += `  <url>\n    <loc>${SITE_URL}${route.path}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <priority>${route.priority}</priority>\n  </url>\n`;
        });

        // Add rooms
        rooms.data?.forEach(room => {
            xml += `  <url>\n    <loc>${SITE_URL}/rooms/${room.slug}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <priority>0.7</priority>\n  </url>\n`;
        });

        // Add experiences
        experiences.data?.forEach(exp => {
            xml += `  <url>\n    <loc>${SITE_URL}/experiences/${exp.slug}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <priority>0.7</priority>\n  </url>\n`;
        });

        // Add blogs
        blogs.data?.forEach(blog => {
            xml += `  <url>\n    <loc>${SITE_URL}/blog/${blog.slug}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <priority>0.6</priority>\n  </url>\n`;
        });

        xml += '</urlset>';

        fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), xml);
        console.log('Sitemap generated successfully at public/sitemap.xml');

        // Update robots.txt
        const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
        let robotsContent = '';
        if (fs.existsSync(robotsPath)) {
            robotsContent = fs.readFileSync(robotsPath, 'utf8');
            if (!robotsContent.includes('Sitemap:')) {
                robotsContent += `\nSitemap: ${SITE_URL}/sitemap.xml\n`;
                fs.writeFileSync(robotsPath, robotsContent);
                console.log('Updated robots.txt with sitemap URL');
            }
        } else {
            robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
            fs.writeFileSync(robotsPath, robotsContent);
            console.log('Created robots.txt with sitemap URL');
        }

    } catch (error) {
        console.error('Error generating sitemap:', error);
    }
}

generateSitemap();
