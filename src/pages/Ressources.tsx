import React, { useEffect } from 'react';
import { BookOpen, Calendar, User, ArrowRight, Clock, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAllArticles } from '../data/articles';
import {
  updatePageTitle,
  updateMetaDescription,
  updateMetaKeywords,
  updateCanonicalUrl,
  updateOpenGraphTags
} from '../utils/seo';

function Ressources() {
  const articles = getAllArticles();

  useEffect(() => {
    const pageUrl = `${window.location.origin}/ressources`;

    updatePageTitle('Ressources & Articles - Ring Academy | Formation Prospection Téléphonique');
    updateMetaDescription('Découvrez nos articles sur la prospection téléphonique, la formation commerciale et le développement des compétences en vente. Conseils, stratégies et bonnes pratiques pour améliorer vos performances.');
    updateMetaKeywords([
      'formation prospection téléphonique',
      'formation commerciale',
      'articles prospection',
      'conseils vente',
      'techniques commerciales',
      'blog commercial'
    ]);
    updateCanonicalUrl(pageUrl);
    updateOpenGraphTags({
      title: 'Ressources & Articles - Ring Academy',
      description: 'Découvrez nos articles sur la prospection téléphonique, la formation commerciale et le développement des compétences en vente.',
      url: pageUrl,
      type: 'website'
    });

    return () => {
      updatePageTitle('Ring Academy - Formation à la prospection téléphonique par IA');
      updateMetaDescription('Entraînez-vous à la prospection téléphonique avec notre IA conversationnelle. Améliorez vos compétences commerciales grâce à des simulations d\'appels réalistes.');
    };
  }, []);

  const categoryColors: Record<string, string> = {
    'Prospection': 'bg-blue-100 text-blue-800',
    'Vente': 'bg-green-100 text-green-800',
    'Négociation': 'bg-amber-100 text-amber-800',
    'Management': 'bg-orange-100 text-orange-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary p-4 rounded-xl">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6 font-display">
            Ressources & Articles
          </h1>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
            Découvrez nos conseils, stratégies et bonnes pratiques pour améliorer vos performances commerciales
          </p>
        </div>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-xl shadow-soft border border-neutral-200 overflow-hidden hover:shadow-medium transition-all duration-300 hover:scale-105"
              >
                <div className="p-6">
                  {/* Category and Read Time */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      categoryColors[article.category] || 'bg-gray-100 text-gray-800'
                    }`}>
                      <Tag className="inline h-3 w-3 mr-1 -mt-0.5" />
                      {article.category}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-secondary-600">
                      <Clock className="h-3 w-3" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-secondary-900 mb-3 line-clamp-2 font-display">
                    {article.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-secondary-600 mb-4 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-secondary-500" />
                      <span className="text-sm text-secondary-600">{article.author}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-secondary-500" />
                      <time dateTime={article.publishedAt} className="text-sm text-secondary-600">
                        {new Date(article.publishedAt).toLocaleDateString('fr-FR')}
                      </time>
                    </div>
                  </div>

                  {/* Read More Button */}
                  <Link
                    to={`/ressources/${article.slug}`}
                    className="mt-4 w-full bg-primary-50 text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Lire l'article</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-soft border border-neutral-200 p-12 max-w-2xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="bg-neutral-100 p-4 rounded-xl">
                  <BookOpen className="h-12 w-12 text-neutral-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-4 font-display">
                Premiers articles en préparation
              </h2>
              <p className="text-secondary-600 mb-8 leading-relaxed">
                Nous préparons actuellement nos premiers articles et conseils pour vous aider à améliorer 
                vos performances commerciales. Revenez bientôt pour découvrir nos contenus exclusifs !
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Ressources;