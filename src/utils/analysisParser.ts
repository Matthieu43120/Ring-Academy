export function cleanAnalyseGenerale(analyseGenerale: string | any): string {
  if (!analyseGenerale) {
    return 'Analyse générale non disponible.';
  }

  if (typeof analyseGenerale !== 'string') {
    return String(analyseGenerale);
  }

  let cleaned = analyseGenerale.trim();

  try {
    const parsed = JSON.parse(cleaned);

    if (typeof parsed === 'object' && parsed !== null) {
      if (parsed.analyse_generale && typeof parsed.analyse_generale === 'string') {
        return cleanAnalyseGenerale(parsed.analyse_generale);
      }

      let extractedText = '';

      if (parsed.score !== undefined) {
        extractedText += `Score global : ${parsed.score}/100\n\n`;
      }

      if (Array.isArray(parsed.strengths) && parsed.strengths.length > 0) {
        extractedText += 'Points forts :\n';
        parsed.strengths.forEach((strength: string) => {
          extractedText += `• ${strength}\n`;
        });
        extractedText += '\n';
      }

      if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
        extractedText += 'Recommandations :\n';
        parsed.recommendations.forEach((rec: string) => {
          extractedText += `• ${rec}\n`;
        });
        extractedText += '\n';
      }

      if (Array.isArray(parsed.improvements) && parsed.improvements.length > 0) {
        extractedText += 'Axes d\'amélioration :\n';
        parsed.improvements.forEach((imp: string) => {
          extractedText += `• ${imp}\n`;
        });
        extractedText += '\n';
      }

      if (parsed.detailedFeedback && typeof parsed.detailedFeedback === 'object') {
        const feedback = parsed.detailedFeedback;

        if (feedback.analyse_generale && typeof feedback.analyse_generale === 'string') {
          extractedText += feedback.analyse_generale;
        }
      }

      return extractedText.trim() || 'Analyse générale extraite avec succès.';
    }

    if (typeof parsed === 'string') {
      return cleanAnalyseGenerale(parsed);
    }

    return String(parsed);

  } catch (parseError) {
    cleaned = cleaned
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');

    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
      const jsonMatch = cleaned.match(/"analyse_generale"\s*:\s*"([^"]+)"/);
      if (jsonMatch && jsonMatch[1]) {
        return cleanAnalyseGenerale(jsonMatch[1]);
      }
    }

    return cleaned;
  }
}

