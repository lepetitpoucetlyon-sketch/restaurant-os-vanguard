import re
import hashlib
from typing import Any
from decimal import Decimal

def tokenize_smart(text: str) -> list:
    """Tokeniseur intelligent qui détecte le script dominant pour BM25"""
    if not text:
        return []
    
    cjk = len(re.findall(r'[\u4e00-\u9fff\u3040-\u30ff]', text))
    arabic = len(re.findall(r'[\u0600-\u06ff]', text))
    cyrillic = len(re.findall(r'[\u0400-\u04ff]', text))
    latin = len(re.findall(r'[a-zA-ZÀ-ÿ]', text))
    
    dominant = max(
        ('cjk', cjk),
        ('arabic', arabic),
        ('cyrillic', cyrillic),
        ('latin', latin),
        key=lambda x: x[1]
    )[0] if (cjk + arabic + cyrillic + latin) > 0 else 'latin'
    
    if dominant == 'cjk':
        try:
            import jieba
            return list(jieba.cut(text))
        except ImportError:
            return list(text)
    elif dominant == 'arabic':
        text = re.sub(r'[\u064b-\u065f]', '', text)
        return text.split()
    elif dominant == 'cyrillic':
        return re.findall(r'[\u0400-\u04ff\w]+', text.lower())
    else:
        return re.findall(r'\b\w+\b', text.lower())

def format_float_precision(val: Any) -> str:
    if val is None:
        return "0"
    if isinstance(val, Decimal):
        d = val
    else:
        try:
            d = Decimal(str(val))
        except (ValueError, TypeError):
            try:
                d = Decimal(val)
            except Exception:
                return "0"
    s = format(d, 'f')
    if '.' in s:
        s = s.rstrip('0').rstrip('.')
    return s if s else "0"

def _normalize_separators(s: str) -> str:
    """Résout l'ambiguïté entre séparateurs de milliers et décimaux."""
    if '.' in s and ',' in s:
        dot_idx = s.find('.')
        comma_idx = s.find(',')
        if dot_idx < comma_idx:
            return s.replace('.', '').replace(',', '.')
        return s.replace(',', '')
    if ',' in s:
        parts = s.split(',')
        if len(parts) == 2 and len(parts[1]) == 3:
            try:
                if float(parts[0].replace('.', '')) >= 10:
                    return s.replace(',', '')
                return s.replace(',', '.')
            except ValueError:
                return s.replace(',', '.')
        return s.replace(',', '.')
    return s


def clean_amount(val: Any) -> str:
    if val is None:
        return "0"
    if isinstance(val, (int, float, Decimal)):
        return format_float_precision(val)

    s = str(val).replace("€", "").replace("EUR", "").strip()
    if not s:
        return "0"

    if 'e' in s.lower():
        try:
            return format_float_precision(Decimal(s))
        except ValueError:
            pass

    is_negative = s.startswith('-')
    s = _normalize_separators(re.sub(r'\s+', '', s))

    res = "".join(c for c in s if c.isdigit() or c == '.')
    if res.count('.') > 1:
        parts = res.split('.')
        res = "".join(parts[:-1]) + "." + parts[-1]

    if is_negative and res != "0":
        res = '-' + res
    return res if res else "0"

def create_ki_id(root_id: str, question: str, answer: str) -> str:
    """Crée un identifiant composite unique par document"""
    root_part = root_id[5:] if root_id.startswith("ROOT_") else root_id[:12]
    qa_hash = hashlib.sha256((question + answer).encode()).hexdigest()[:6]
    return f"KI_{root_part}_{qa_hash}"
