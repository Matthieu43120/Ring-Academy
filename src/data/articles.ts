export interface Article {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  readTime: string;
  keywords: string[];
  featured?: boolean;
}

export const articles: Article[] = [
  {
    id: '2',
    slug: 'passer-barrage-secretaire-prospection-telephonique',
    title: 'Passer le barrage de la secrétaire en prospection téléphonique',
    metaTitle: 'Passer le barrage de la secrétaire en prospection téléphonique',
    metaDescription: 'Découvrez comment franchir efficacement le barrage d\'une secrétaire lors de vos appels de prospection B2B. Entraînez-vous avec Marie Dubois, la secrétaire IA de Ring Academy, et améliorez votre taux de réussite.',
    excerpt: 'Dans la prospection B2B, le premier contact avec un prospect est souvent filtré par une secrétaire ou assistante. Savoir passer ce barrage est crucial pour réussir vos appels et décrocher des rendez-vous qualifiés.',
    author: 'Équipe Ring Academy',
    publishedAt: '2025-10-16',
    category: 'Prospection',
    readTime: '6 min',
    keywords: [
      'barrage secrétaire',
      'prospection téléphonique',
      'formation commerciale',
      'prospection B2B',
      'prise de rendez-vous',
      'entraînement commercial',
      'simulation appel'
    ],
    featured: true,
    content: `
      <p>Dans la <strong>prospection B2B</strong>, le premier contact avec un prospect est souvent filtré par une secrétaire ou assistante. Savoir passer ce barrage est crucial pour réussir vos appels et décrocher des <strong>rendez-vous qualifiés</strong>.</p>

      <p>Pour aider les commerciaux, indépendants ou entreprises à se former efficacement, Ring Academy a créé <strong>Marie Dubois, la secrétaire IA</strong>, qui simule des situations réelles et vous permet de vous entraîner à la <strong>prospection téléphonique</strong> avant vos vrais appels.</p>

      <h2>Rencontre avec Marie Dubois, la secrétaire IA</h2>

      <blockquote style="border-left: 4px solid #2563eb; padding-left: 1rem; font-style: italic; color: #475569; margin: 1.5rem 0;">
        <p>« Je suis Marie Dubois, secrétaire chez Ring Academy.</p>
        <p>Je suis souvent le premier obstacle que rencontrent les commerciaux. Mon rôle ? Filtrer les appels et décider rapidement si je peux vous communiquer des informations ou vous transférer à mon responsable.</p>
        <p>Ici, vous pouvez vous entraîner à me convaincre, tester vos arguments et comprendre ce qui fait que je juge un appel intéressant et digne d'être transmis.</p>
        <p>Je ne suis pas facile à convaincre… mais si vous réussissez, c'est que vous avez franchi la première vraie étape d'un appel réussi. »</p>
      </blockquote>

      <h2>Pourquoi s'entraîner avec une secrétaire IA ?</h2>

      <ul>
        <li><strong>Permet de réaliser des erreurs sans conséquence</strong> et d'apprendre de vos échecs.</li>
        <li><strong>Développe la confiance et le ton</strong> avant les vrais appels B2B.</li>
        <li><strong>Idéal pour les formateurs et organismes de formation</strong> souhaitant enrichir leurs modules de <strong>prospection téléphonique</strong>.</li>
        <li><strong>Utile pour les indépendants ou entrepreneurs</strong> qui veulent améliorer leur taux de réussite sur la <strong>prise de rendez-vous</strong>.</li>
      </ul>

      <h2>5 bonnes pratiques pour passer le barrage d'une secrétaire</h2>

      <h3>1. Préparez votre appel</h3>
      <ul>
        <li>Connaissez le nom et le rôle du décideur.</li>
        <li>Formulez une phrase d'accroche claire et concise.</li>
        <li>Anticipez les objections classiques : "Il/elle est occupé(e)", "Je ne peux pas vous transférer".</li>
      </ul>

      <h3>2. Soyez professionnel et respectueux</h3>
      <ul>
        <li>La secrétaire est là pour protéger le temps du décideur, pas pour vous bloquer.</li>
        <li>Parlez avec confiance mais sans arrogance.</li>
        <li>Écoutez attentivement ses questions et répondez avec pertinence.</li>
      </ul>

      <h3>3. Apportez de la valeur immédiate</h3>
      <ul>
        <li>Montrez que vous avez fait vos recherches sur l'entreprise.</li>
        <li>Expliquez rapidement en quoi votre solution apporte un bénéfice concret.</li>
      </ul>

      <h3>4. Posez des questions ouvertes</h3>
      <p>Exemple :</p>
      <ul>
        <li>"Quand M. X serait-il disponible pour échanger ?"</li>
        <li>"Quelles informations seraient utiles pour que je présente ma proposition ?"</li>
      </ul>

      <h3>5. Entraînez-vous régulièrement</h3>
      <ul>
        <li>La répétition est clé pour maîtriser le timing et le ton.</li>
        <li><strong>Ring Academy</strong> vous permet de simuler des appels avec Marie Dubois, afin de progresser rapidement et efficacement.</li>
      </ul>

      <h2>Conclusion</h2>

      <p>Passer le barrage d'une secrétaire est souvent le premier vrai test de votre capacité à convaincre en <strong>prospection téléphonique</strong>. Avec un <strong>entraînement régulier sur Ring Academy</strong>, vous pourrez transformer ces obstacles en opportunités et améliorer votre taux de conversion, que vous soyez commercial, indépendant ou formateur souhaitant enrichir vos modules.</p>
    `
  },
  {
    id: '1',
    slug: 'ring-academy-formation-pratique-prospection-telephonique-ia',
    title: 'Ring Academy : la formation à la prospection téléphonique 100% pratique',
    metaTitle: 'Ring Academy : la première plateforme de formation pratique à la prospection téléphonique grâce à l\'IA',
    metaDescription: 'Découvrez Ring Academy, la plateforme innovante de formation commerciale qui utilise l\'IA pour simuler des appels de prospection téléphonique réalistes. Entraînez-vous à la prise de rendez-vous client et développez vos compétences en prospection.',
    excerpt: 'Après plusieurs mois de travail, Ring Academy voit le jour 🎉 Cette plateforme en ligne a été pensée pour répondre à un manque que tout commercial connaît : la pratique de la prospection téléphonique.',
    author: 'Équipe Ring Academy',
    publishedAt: '2025-10-08',
    category: 'Prospection',
    readTime: '5 min',
    keywords: [
      'formation prospection téléphonique',
      'formation commerciale',
      'entraînement commercial',
      'simulation d\'appel',
      'prise de rendez-vous client',
      'développement commercial',
      'plateforme IA prospection'
    ],
    featured: true,
    content: `
      <p>Après plusieurs mois de travail, Ring Academy voit le jour 🎉</p>

      <p>Cette plateforme en ligne a été pensée pour répondre à un manque que tout commercial connaît : <strong>la pratique de la prospection téléphonique</strong>.</p>

      <p>En tant que commercial depuis plusieurs années, j'ai suivi différentes <strong>formations commerciales</strong> et participé à de nombreux ateliers. Mais une chose m'a toujours frappé : on apprend la théorie, les techniques de vente et les scripts d'appel, sans jamais réellement s'entraîner à décrocher son téléphone.</p>

      <p>C'est de ce constat qu'est née <strong>Ring Academy</strong>, une plateforme de <strong>formation à la prospection téléphonique</strong> innovante qui permet de s'entraîner à la <strong>prise de rendez-vous</strong> de manière interactive.</p>

      <h2>Une IA qui vous fait pratiquer la vraie prospection commerciale</h2>

      <p>Ring Academy est une solution d'<strong>entraînement à la prospection téléphonique</strong> basée sur l'intelligence artificielle :</p>

      <ul>
        <li>📞 <strong>L'IA simule un vrai prospect</strong> et parle avec vous comme lors d'un appel réel.</li>
        <li>🙋 Elle réagit à vos phrases, oppose des objections, et adapte ses réponses selon votre ton et vos arguments.</li>
        <li>🎯 <strong>Votre mission</strong> : obtenir un rendez-vous, exactement comme dans la réalité.</li>
        <li>📊 À la fin de chaque <strong>simulation d'appel</strong>, vous recevez un rapport complet : score, points forts, axes d'amélioration.</li>
        <li>📈 Un tableau de bord vous permet de suivre votre progression et d'analyser vos performances au fil du temps.</li>
      </ul>

      <p>Grâce à cette approche, Ring Academy transforme la <strong>formation commerciale</strong> en une expérience pratique, vivante et mesurable.</p>

      <h2>Pour qui est faite Ring Academy ?</h2>

      <p>Ring Academy s'adresse à tous ceux qui veulent améliorer leurs compétences en <strong>prospection téléphonique</strong> :</p>

      <ul>
        <li><strong>Les indépendants</strong> → pour s'entraîner sans conséquence avant de contacter leurs prospects.</li>
        <li><strong>Les organismes de formation</strong> → pour ajouter une partie pratique à leurs parcours de <strong>formation commerciale</strong>.</li>
        <li><strong>Les formateurs et coachs commerciaux</strong> → pour offrir à leurs apprenants un outil concret et suivre leurs résultats en temps réel.</li>
        <li><strong>Les entreprises</strong> → pour former leurs nouveaux commerciaux, tester de nouveaux scripts ou entraîner leurs équipes de vente à grande échelle.</li>
      </ul>

      <p>Sur Ring Academy, vous pouvez créer votre organisation, inviter vos collaborateurs et suivre leurs progrès depuis un tableau de bord dédié.</p>

      <h2>Une première version, en constante amélioration</h2>

      <p>Ring Academy est actuellement disponible sur ordinateur (la version mobile arrive prochainement 📱).</p>

      <p>Il s'agit d'une première version développée seule, sans être expert en programmation.</p>

      <p>L'objectif est clair : aider les commerciaux, formateurs et entreprises à rendre la <strong>prospection téléphonique</strong> plus accessible, plus moderne et plus efficace.</p>

      <h3>Vos retours sont essentiels 🙌</h3>

      <p>N'hésitez pas à tester la <strong>plateforme IA prospection</strong> et à partager votre avis sur :</p>

      <ul>
        <li>l'idée 💡</li>
        <li>l'utilité 🎯</li>
        <li>l'expérience utilisateur 💬</li>
      </ul>
    `
  }
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find(article => article.slug === slug);
}

export function getAllArticles(): Article[] {
  return articles.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getFeaturedArticles(): Article[] {
  return articles.filter(article => article.featured);
}
