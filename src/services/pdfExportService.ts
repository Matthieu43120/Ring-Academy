import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SessionAnalytics } from './sessionAnalytics';

interface SessionRecord {
  id: string;
  userId: string;
  target: string;
  difficulty: string;
  score: number;
  duration: number;
  feedback: string[];
  recommendations: string[];
  improvements: string[];
  detailedAnalysis: string | null;
  date: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  credits: number;
  simulationsLeft: number;
  organizationId: string | null;
  organizationRole: 'owner' | 'member' | null;
}

const COLORS = {
  primary: '#475569',
  secondary: '#94a3b8',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  dark: '#1e293b',
  light: '#f8fafc',
  border: '#e2e8f0'
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}min ${remainingSeconds}s`;
};

const getTargetLabel = (target: string): string => {
  const labels: { [key: string]: string } = {
    secretary: 'Secrétaire',
    hr: 'DRH',
    manager: 'Manager',
    sales: 'Commercial'
  };
  return labels[target] || target;
};

const getDifficultyLabel = (difficulty: string): string => {
  const labels: { [key: string]: string } = {
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile'
  };
  return labels[difficulty] || difficulty;
};

const addHeader = (doc: jsPDF, title: string, userName?: string) => {
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Ring Academy', 20, 18);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 20, 30);

  if (userName) {
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(12);
    doc.text(userName, pageWidth - 20, 25, { align: 'right' });
  }
};

const addFooter = (doc: jsPDF, pageNumber: number) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR')} - Ring Academy`,
    20,
    pageHeight - 10
  );
  doc.text(
    `Page ${pageNumber}`,
    pageWidth - 20,
    pageHeight - 10,
    { align: 'right' }
  );
};

const addSection = (doc: jsPDF, title: string, yPos: number): number => {
  doc.setFillColor(COLORS.light);
  doc.rect(15, yPos, doc.internal.pageSize.width - 30, 12, 'F');

  doc.setTextColor(COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, yPos + 8);

  return yPos + 18;
};

const addKeyValuePair = (doc: jsPDF, label: string, value: string, x: number, y: number) => {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(label + ':', x, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.primary);
  doc.text(value, x + 60, y);
};

const addBulletPoint = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number => {
  doc.setFontSize(10);
  doc.setTextColor(COLORS.primary);
  doc.text('•', x, y);

  doc.setTextColor(COLORS.dark);
  const lines = doc.splitTextToSize(text, maxWidth - 10);
  doc.text(lines, x + 6, y);

  return y + (lines.length * 5) + 2;
};

export const generatePersonalDashboardPDF = (
  user: UserProfile,
  sessions: SessionRecord[],
  analytics: SessionAnalytics,
  selectedDifficulty: string
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 50;

  addHeader(doc, 'Rapport de Performance', `${user.firstName} ${user.lastName}`);

  yPos = addSection(doc, 'Informations Générales', yPos);
  addKeyValuePair(doc, 'Utilisateur', `${user.firstName} ${user.lastName}`, 20, yPos);
  yPos += 7;
  addKeyValuePair(doc, 'Email', user.email, 20, yPos);
  yPos += 7;
  addKeyValuePair(doc, 'Date du rapport', new Date().toLocaleDateString('fr-FR'), 20, yPos);
  yPos += 7;
  if (selectedDifficulty !== 'all') {
    addKeyValuePair(doc, 'Filtre de difficulté', getDifficultyLabel(selectedDifficulty), 20, yPos);
    yPos += 7;
  }
  yPos += 8;

  yPos = addSection(doc, 'Statistiques Globales', yPos);
  const stats = [
    ['Sessions totales', analytics.totalSessions.toString()],
    ['Score moyen', `${analytics.averageScore}/100`],
    ['Meilleur score', `${analytics.bestScore}/100`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Métrique', 'Valeur']],
    body: stats,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10
    },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  if (analytics.hasEnoughData) {
    yPos = addSection(doc, 'Progression', yPos);

    const trendIcon = analytics.progressionTrend.trend === 'up' ? '↑' :
                      analytics.progressionTrend.trend === 'down' ? '↓' : '→';
    const trendText = analytics.progressionTrend.trend === 'up' ?
      `En hausse de ${analytics.progressionTrend.percentage}%` :
      analytics.progressionTrend.trend === 'down' ?
      `En baisse de ${analytics.progressionTrend.percentage}%` :
      'Stable';

    addKeyValuePair(doc, 'Moyenne des 5 derniers', `${analytics.progressionTrend.current}/100`, 20, yPos);
    yPos += 7;
    addKeyValuePair(doc, 'Tendance', `${trendIcon} ${trendText}`, 20, yPos);
    yPos += 12;

    if (analytics.recurringStrengths.length > 0) {
      yPos = addSection(doc, 'Points Forts Récurrents', yPos);
      analytics.recurringStrengths.forEach(strength => {
        yPos = addBulletPoint(doc, strength, 20, yPos, pageWidth - 40);
      });
      yPos += 8;
    }

    if (analytics.recurringImprovements.length > 0) {
      yPos = addSection(doc, 'Axes d\'Amélioration Prioritaires', yPos);
      analytics.recurringImprovements.forEach(improvement => {
        yPos = addBulletPoint(doc, improvement, 20, yPos, pageWidth - 40);
      });
      yPos += 8;
    }

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSection(doc, 'Recommandation Prioritaire', yPos);
    doc.setFontSize(10);
    doc.setTextColor(COLORS.dark);
    const recLines = doc.splitTextToSize(analytics.topRecommendation, pageWidth - 40);
    doc.text(recLines, 20, yPos);
    yPos += recLines.length * 5 + 10;
  }

  if (sessions.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSection(doc, 'Historique des Sessions', yPos);

    const sessionData = sessions
      .slice()
      .reverse()
      .map(session => [
        formatDate(session.date),
        getTargetLabel(session.target),
        getDifficultyLabel(session.difficulty),
        `${session.score}/100`,
        formatDuration(session.duration)
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Prospect', 'Difficulté', 'Score', 'Durée']],
      body: sessionData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 }
      }
    });
  }

  addFooter(doc, 1);

  const fileName = `RingAcademy_Dashboard_${user.firstName}_${user.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateOrganizationOverviewPDF = (
  organizationName: string,
  members: UserProfile[],
  sessions: SessionRecord[],
  analytics: SessionAnalytics,
  selectedDifficulty: string
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 50;

  addHeader(doc, 'Rapport d\'Organisation', organizationName);

  yPos = addSection(doc, 'Informations Générales', yPos);
  addKeyValuePair(doc, 'Organisation', organizationName, 20, yPos);
  yPos += 7;
  addKeyValuePair(doc, 'Date du rapport', new Date().toLocaleDateString('fr-FR'), 20, yPos);
  yPos += 7;
  addKeyValuePair(doc, 'Nombre de membres', members.length.toString(), 20, yPos);
  yPos += 7;
  if (selectedDifficulty !== 'all') {
    addKeyValuePair(doc, 'Filtre de difficulté', getDifficultyLabel(selectedDifficulty), 20, yPos);
    yPos += 7;
  }
  yPos += 8;

  yPos = addSection(doc, 'Statistiques Globales', yPos);
  const stats = [
    ['Sessions totales', analytics.totalSessions.toString()],
    ['Score moyen global', `${analytics.averageScore}/100`],
    ['Meilleur score', `${analytics.bestScore}/100`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Métrique', 'Valeur']],
    body: stats,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10
    },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  if (analytics.hasEnoughData) {
    yPos = addSection(doc, 'Progression Globale', yPos);

    const trendIcon = analytics.progressionTrend.trend === 'up' ? '↑' :
                      analytics.progressionTrend.trend === 'down' ? '↓' : '→';
    const trendText = analytics.progressionTrend.trend === 'up' ?
      `En hausse de ${analytics.progressionTrend.percentage}%` :
      analytics.progressionTrend.trend === 'down' ?
      `En baisse de ${analytics.progressionTrend.percentage}%` :
      'Stable';

    addKeyValuePair(doc, 'Moyenne des 5 derniers', `${analytics.progressionTrend.current}/100`, 20, yPos);
    yPos += 7;
    addKeyValuePair(doc, 'Tendance', `${trendIcon} ${trendText}`, 20, yPos);
    yPos += 12;

    if (analytics.recurringStrengths.length > 0) {
      yPos = addSection(doc, 'Points Forts Récurrents de l\'Organisation', yPos);
      analytics.recurringStrengths.forEach(strength => {
        yPos = addBulletPoint(doc, strength, 20, yPos, pageWidth - 40);
      });
      yPos += 8;
    }

    if (analytics.recurringImprovements.length > 0) {
      yPos = addSection(doc, 'Axes d\'Amélioration de l\'Organisation', yPos);
      analytics.recurringImprovements.forEach(improvement => {
        yPos = addBulletPoint(doc, improvement, 20, yPos, pageWidth - 40);
      });
      yPos += 8;
    }

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSection(doc, 'Recommandation Prioritaire', yPos);
    doc.setFontSize(10);
    doc.setTextColor(COLORS.dark);
    const recLines = doc.splitTextToSize(analytics.topRecommendation, pageWidth - 40);
    doc.text(recLines, 20, yPos);
    yPos += recLines.length * 5 + 10;
  }

  if (members.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSection(doc, 'Performance par Membre', yPos);

    const memberData = members.map(member => {
      const memberSessions = sessions.filter(s => s.userId === member.id);
      const avgScore = memberSessions.length > 0
        ? Math.round(memberSessions.reduce((sum, s) => sum + s.score, 0) / memberSessions.length)
        : 0;

      return [
        `${member.firstName} ${member.lastName}`,
        memberSessions.length.toString(),
        memberSessions.length > 0 ? `${avgScore}/100` : '-',
        member.organizationRole === 'owner' ? 'Propriétaire' : 'Membre'
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Membre', 'Sessions', 'Score Moyen', 'Rôle']],
      body: memberData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      margin: { left: 20, right: 20 }
    });
  }

  addFooter(doc, 1);

  const fileName = `RingAcademy_Organisation_${organizationName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateMemberPDF = (
  member: UserProfile,
  organizationName: string,
  sessions: SessionRecord[],
  analytics: SessionAnalytics,
  selectedDifficulty: string
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 50;

  addHeader(doc, `Rapport Membre - ${organizationName}`, `${member.firstName} ${member.lastName}`);

  yPos = addSection(doc, 'Informations du Membre', yPos);
  addKeyValuePair(doc, 'Nom', `${member.firstName} ${member.lastName}`, 20, yPos);
  yPos += 7;
  addKeyValuePair(doc, 'Email', member.email, 20, yPos);
  yPos += 7;
  addKeyValuePair(doc, 'Organisation', organizationName, 20, yPos);
  yPos += 7;
  addKeyValuePair(doc, 'Rôle', member.organizationRole === 'owner' ? 'Propriétaire' : 'Membre', 20, yPos);
  yPos += 7;
  addKeyValuePair(doc, 'Date du rapport', new Date().toLocaleDateString('fr-FR'), 20, yPos);
  yPos += 7;
  if (selectedDifficulty !== 'all') {
    addKeyValuePair(doc, 'Filtre de difficulté', getDifficultyLabel(selectedDifficulty), 20, yPos);
    yPos += 7;
  }
  yPos += 8;

  yPos = addSection(doc, 'Statistiques', yPos);
  const stats = [
    ['Sessions totales', analytics.totalSessions.toString()],
    ['Score moyen', `${analytics.averageScore}/100`],
    ['Meilleur score', `${analytics.bestScore}/100`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Métrique', 'Valeur']],
    body: stats,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10
    },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  if (analytics.hasEnoughData) {
    yPos = addSection(doc, 'Progression', yPos);

    const trendIcon = analytics.progressionTrend.trend === 'up' ? '↑' :
                      analytics.progressionTrend.trend === 'down' ? '↓' : '→';
    const trendText = analytics.progressionTrend.trend === 'up' ?
      `En hausse de ${analytics.progressionTrend.percentage}%` :
      analytics.progressionTrend.trend === 'down' ?
      `En baisse de ${analytics.progressionTrend.percentage}%` :
      'Stable';

    addKeyValuePair(doc, 'Moyenne des 5 derniers', `${analytics.progressionTrend.current}/100`, 20, yPos);
    yPos += 7;
    addKeyValuePair(doc, 'Tendance', `${trendIcon} ${trendText}`, 20, yPos);
    yPos += 12;

    if (analytics.recurringStrengths.length > 0) {
      yPos = addSection(doc, 'Points Forts Récurrents', yPos);
      analytics.recurringStrengths.forEach(strength => {
        yPos = addBulletPoint(doc, strength, 20, yPos, pageWidth - 40);
      });
      yPos += 8;
    }

    if (analytics.recurringImprovements.length > 0) {
      yPos = addSection(doc, 'Axes d\'Amélioration Prioritaires', yPos);
      analytics.recurringImprovements.forEach(improvement => {
        yPos = addBulletPoint(doc, improvement, 20, yPos, pageWidth - 40);
      });
      yPos += 8;
    }

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSection(doc, 'Recommandation Prioritaire', yPos);
    doc.setFontSize(10);
    doc.setTextColor(COLORS.dark);
    const recLines = doc.splitTextToSize(analytics.topRecommendation, pageWidth - 40);
    doc.text(recLines, 20, yPos);
    yPos += recLines.length * 5 + 10;
  }

  if (sessions.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSection(doc, 'Historique des Sessions', yPos);

    const sessionData = sessions
      .slice()
      .reverse()
      .map(session => [
        formatDate(session.date),
        getTargetLabel(session.target),
        getDifficultyLabel(session.difficulty),
        `${session.score}/100`,
        formatDuration(session.duration)
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Prospect', 'Difficulté', 'Score', 'Durée']],
      body: sessionData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 }
      }
    });
  }

  addFooter(doc, 1);

  const fileName = `RingAcademy_Membre_${member.firstName}_${member.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
