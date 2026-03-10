import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const headTagCache = new Map();

function getOrCreateMeta(attribute, value) {
    const cacheKey = `meta:${attribute}:${value}`;
    const cached = headTagCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    let tag = document.querySelector(`meta[${attribute}="${value}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, value);
        document.head.appendChild(tag);
    }

    headTagCache.set(cacheKey, tag);
    return tag;
}

function getOrCreateNamedMeta(name) {
    return getOrCreateMeta('name', name);
}

function getOrCreateCanonicalLink() {
    const cacheKey = 'link:canonical';
    const cached = headTagCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
    }

    headTagCache.set(cacheKey, link);
    return link;
}

function setContentIfChanged(element, value) {
    if (element.content !== value) {
        element.content = value;
    }
}

export default function SEO({ title, description, keywords }) {
    const location = useLocation();

    const defaultTitle = "Brian Dang - Software Engineer";
    const defaultDescription = "Software engineer specializing in gameplay systems, full-stack development, and creating unforgettable user experiences.";
    const defaultKeywords = "software engineer, gameplay engineer, full-stack developer, web development, system architecture";

    const pageTitle = title ? `${title} | Brian Dang` : defaultTitle;
    const pageDescription = description || defaultDescription;
    const pageKeywords = keywords || defaultKeywords;
    const canonicalUrl = `https://briandangdev.com${location.pathname}`;

    useEffect(() => {
        if (document.title !== pageTitle) {
            document.title = pageTitle;
        }

        setContentIfChanged(getOrCreateNamedMeta('description'), pageDescription);
        setContentIfChanged(getOrCreateNamedMeta('keywords'), pageKeywords);

        setContentIfChanged(getOrCreateMeta('property', 'og:title'), pageTitle);
        setContentIfChanged(getOrCreateMeta('property', 'og:description'), pageDescription);
        setContentIfChanged(getOrCreateMeta('property', 'og:url'), canonicalUrl);
        setContentIfChanged(getOrCreateMeta('property', 'og:type'), 'website');

        setContentIfChanged(getOrCreateNamedMeta('twitter:card'), 'summary_large_image');
        setContentIfChanged(getOrCreateNamedMeta('twitter:title'), pageTitle);
        setContentIfChanged(getOrCreateNamedMeta('twitter:description'), pageDescription);

        const canonical = getOrCreateCanonicalLink();
        if (canonical.href !== canonicalUrl) {
            canonical.href = canonicalUrl;
        }
    }, [pageTitle, pageDescription, pageKeywords, canonicalUrl]);

    return null;
}
