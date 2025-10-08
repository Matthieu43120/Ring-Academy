import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Tag } from 'lucide-react';
import { getArticleBySlug } from '../data/articles';
import {
  updatePageTitle,
  updateMetaDescription,
  updateMetaKeywords,
  updateCanonicalUrl,
  updateOpenGraphTags,
  updateTwitterCardTags,
  addStructuredData,
  generateArticleStructuredData
} from '../utils/seo';

function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  useEffect(() => {
    if (article) {
      const articleUrl = `${window.location.origin}/ressources/${article.slug}`;

      updatePageTitle(article.metaTitle);
      updateMetaDescription(article.metaDescription);
      updateMetaKeywords(article.keywords);
      updateCanonicalUrl(articleUrl);

      updateOpenGraphTags({
        title: article.metaTitle,
        description: article.metaDescription,
        url: articleUrl,
        type: 'article'
      });

      updateTwitterCardTags({
        title: article.metaTitle,
        description: article.metaDescription
      });

      addStructuredData(generateArticleStructuredData({
        title: article.title,
        description: article.metaDescription,
        author: article.author,
        publishedAt: article.publishedAt,
        url: articleUrl
      }));
    }

    return () => {
      updatePageTitle('Ring Academy - Formation à la prospection téléphonique par IA');
      updateMetaDescription('Entraînez-vous à la prospection téléphonique avec notre IA conversationnelle. Améliorez vos compétences commerciales grâce à des simulations d\'appels réalistes.');
    };
  }, [article]);

  if (!article) {
    return <Navigate to="/ressources" replace />;
  }

  const categoryColors: Record<string, string> = {
    'Prospection': 'bg-blue-100 text-blue-800',
    'Vente': 'bg-green-100 text-green-800',
    'Négociation': 'bg-amber-100 text-amber-800',
    'Management': 'bg-orange-100 text-orange-800'
  };

  return (
    <article className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/ressources"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-8 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Retour aux ressources</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="flex items-center space-x-4 mb-6">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  categoryColors[article.category] || 'bg-gray-100 text-gray-800'
                }`}>
                  <Tag className="inline h-4 w-4 mr-1 -mt-0.5" />
                  {article.category}
                </span>
                <div className="flex items-center space-x-2 text-sm text-secondary-600">
                  <Clock className="h-4 w-4" />
                  <span>{article.readTime}</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6 font-display leading-tight">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-neutral-200">
                <div className="flex items-center space-x-2 text-secondary-600">
                  <User className="h-5 w-5" />
                  <span className="font-medium">{article.author}</span>
                </div>
                <div className="flex items-center space-x-2 text-secondary-600">
                  <Calendar className="h-5 w-5" />
                  <time dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </div>

              <div
                className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-secondary-900 prose-p:text-secondary-700 prose-p:leading-relaxed prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-secondary-900 prose-strong:font-semibold prose-ul:text-secondary-700 prose-li:my-2"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              <div className="mt-12 pt-8 border-t border-neutral-200">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-secondary-900 mb-4 font-display">
                    🚀 Découvrez Ring Academy
                  </h3>
                  <p className="text-secondary-700 mb-6 leading-relaxed">
                    Entraînez-vous à la prospection téléphonique dès aujourd'hui et faites passer vos performances commerciales à un niveau supérieur.
                  </p>
                  <Link
                    to="/training"
                    className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                  >
                    Accéder à la zone d'entraînement
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {article.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-neutral-100 text-secondary-600 text-sm rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export default ArticleDetail;
