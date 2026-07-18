"""
DocumentPrefilter - Nettoie le document AVANT envoi au LLM.

Supprime le bruit (lignes vides multiples, headers répétés, numéros de page,
séparateurs, artefacts OCR) pour réduire le volume de tokens envoyés au LLM
et améliorer la qualité d'extraction des KIs.

Gain moyen observé : 20-50% de caractères en moins selon le type de document.
"""

import re
from collections import Counter


class DocumentPrefilter:

    def clean(self, text: str) -> str:
        """Pipeline de nettoyage complet. Ordre important."""
        text = self._remove_multiple_newlines(text)
        text = self._remove_page_numbers(text)
        text = self._remove_repeated_headers(text)
        text = self._remove_separator_lines(text)
        text = self._normalize_spaces(text)
        text = self._remove_ocr_artifacts(text)
        text = self._normalize_numbers(text)
        return text.strip()

    def _remove_multiple_newlines(self, text: str) -> str:
        """\\n\\n\\n\\n → \\n\\n (garde un seul saut entre paragraphes)"""
        return re.sub(r'\n{3,}', '\n\n', text)

    def _remove_page_numbers(self, text: str) -> str:
        """Supprime 'Page 1/5', '- 1 -', '1 of 5', etc."""
        patterns = [
            r'\n\s*[Pp]age\s+\d+\s*/\s*\d+\s*\n',
            r'\n\s*[Pp]age\s+\d+\s*\n',
            r'\n\s*-\s*\d+\s*-\s*\n',
            r'\n\s*\d+\s+of\s+\d+\s*\n',
            r'\n\s*\d+\s*\n(?=\s*\n)',
        ]
        for pattern in patterns:
            text = re.sub(pattern, '\n', text)
        return text

    def _remove_repeated_headers(self, text: str) -> str:
        """Supprime les lignes qui apparaissent 3+ fois (headers/footers de page)."""
        lines = text.split('\n')
        line_count = Counter(l.strip() for l in lines)

        seen_repeated = set()
        result = []

        for line in lines:
            stripped = line.strip()
            # Ligne vide → toujours garder
            if not stripped:
                result.append(line)
                continue
            # Ligne répétée 3+ fois ET courte (typique d'un header)
            if line_count.get(stripped, 0) >= 3 and len(stripped) < 100:
                if stripped not in seen_repeated:
                    seen_repeated.add(stripped)
                    result.append(line)  # Garde la première occurrence
                # Les suivantes sont silencieusement supprimées
            else:
                result.append(line)

        return '\n'.join(result)

    def _remove_separator_lines(self, text: str) -> str:
        """Supprime '________', '========', '- - - - -', '.........'"""
        return re.sub(r'\n\s*[-=_.*]{5,}\s*\n', '\n', text)

    def _normalize_spaces(self, text: str) -> str:
        """'Client:    Mairie' → 'Client: Mairie' (espaces multiples → 1) et formate les tableaux."""
        lines = text.split('\n')
        result = []
        for line in lines:
            stripped = line.lstrip()
            indent = line[:len(line) - len(stripped)]
            # Détection de ligne de tableau : si elle contient des blocs de texte séparés par 2+ espaces
            if re.search(r'\w+\s{2,}\w+', stripped):
                # Remplacer les multi-espaces par des pipes pour marquer le tableau
                normalized = re.sub(r'\s{2,}', ' | ', stripped)
                result.append(indent + "| " + normalized + " |")
            else:
                normalized = re.sub(r' {2,}', ' ', stripped)
                result.append(indent + normalized)
        return '\n'.join(result)

    def _remove_ocr_artifacts(self, text: str) -> str:
        """Supprime caractères non-imprimables, lignes de tableau cassées, etc."""
        # Caractères non-imprimables (sauf newline, tab, espace)
        text = re.sub(r'[^\x09\x0A\x0D\x20-\x7E\x80-\xFF]', '', text)
        # Lignes de pipes (tableaux OCR cassés)
        text = re.sub(r'\n[|]{3,}\n', '\n', text)
        # Points excessifs
        text = re.sub(r'\.{4,}', '...', text)
        return text

    def _normalize_numbers(self, text: str) -> str:
        """'5 000,00 EUR' → '5000 EUR' (nettoyage pour la Balance Engine Rust)"""
        # Espace dans les nombres français: "5 000" → "5000"
        text = re.sub(r'(\d)\s(\d{3})', r'\1\2', text)
        # Virgule décimale ,00 inutile: "5000,00" → "5000"
        text = re.sub(r'(\d+),00\b', r'\1', text)
        return text

    def get_stats(self, original: str, cleaned: str) -> dict:
        """Retourne les stats de compression pour logging."""
        original_len = len(original)
        cleaned_len = len(cleaned)
        gain = ((original_len - cleaned_len) / original_len * 100) if original_len > 0 else 0
        return {
            "original_chars": original_len,
            "cleaned_chars": cleaned_len,
            "gain_percent": round(gain, 1),
            "tokens_saved_estimate": int((original_len - cleaned_len) / 4),
        }
