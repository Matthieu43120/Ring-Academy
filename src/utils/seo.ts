export function updatePageTitle(title: string) {
  document.title = title;
}

export function updateMetaDescription(description: string) {
  let metaDescription = document.querySelector('meta[name="description"]');

  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }

  metaDescription.setAttribute('content', description);
}

export function updateMetaKeywords(keywords: string[]) {
  let metaKeywords = document.querySelector('meta[name="keywords"]');

  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }

  metaKeywords.setAttribute('content', keywords.join(', '));
}

export function updateCanonicalUrl(url: string) {
  let canonical = document.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }

  canonical.setAttribute('href', url);
}

export function updateOpenGraphTags(data: {
  title: string;
  description: string;
  url: string;
  type?: string;
  image?: string;
}) {
  const tags = [
    { property: 'og:title', content: data.title },
    { property: 'og:description', content: data.description },
    { property: 'og:url', content: data.url },
    { property: 'og:type', content: data.type || 'article' },
    { property: 'og:site_name', content: 'Ring Academy' }
  ];

  if (data.image) {
    tags.push({ property: 'og:image', content: data.image });
  }

  tags.forEach(tag => {
    let meta = document.querySelector(`meta[property="${tag.property}"]`);

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', tag.property);
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', tag.content);
  });
}

export function updateTwitterCardTags(data: {
  title: string;
  description: string;
  image?: string;
}) {
  const tags = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: data.title },
    { name: 'twitter:description', content: data.description }
  ];

  if (data.image) {
    tags.push({ name: 'twitter:image', content: data.image });
  }

  tags.forEach(tag => {
    let meta = document.querySelector(`meta[name="${tag.name}"]`);

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', tag.name);
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', tag.content);
  });
}

export function addStructuredData(data: object) {
  let script = document.querySelector('script[type="application/ld+json"]');

  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

export function generateArticleStructuredData(article: {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Organization',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ring Academy',
      logo: {
        '@type': 'ImageObject',
        url: `${window.location.origin}/Logo5.png`
      }
    },
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url
    }
  };
}
