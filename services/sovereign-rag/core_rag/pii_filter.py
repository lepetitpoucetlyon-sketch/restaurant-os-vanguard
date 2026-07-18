import re
from typing import Dict, List, Tuple

class PIIFilter:
    """Detect and anonymize personally identifiable information (PII)"""
    
    PATTERNS = {
        'email': r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        'french_phone': r'(?:\+33|0)[1-9](?:[0-9]{8})',
        'french_ssn': r'\d{1,3}\s?\d{1,3}\s?\d{3}\s?\d{2}',
        'credit_card': r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
    }
    
    @staticmethod
    def detect(text: str) -> Dict[str, List[str]]:
        """Detect PII in text"""
        findings = {}
        for pii_type, pattern in PIIFilter.PATTERNS.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                findings[pii_type] = list(set(matches)) # Deduplicate
        return findings
    
    @staticmethod
    def anonymize(text: str) -> Tuple[str, Dict[str, List[str]]]:
        """Replace PII with placeholders and return both anonymized text and findings"""
        findings = PIIFilter.detect(text)
        anonymized = text
        
        anonymized = re.sub(
            PIIFilter.PATTERNS['email'], 
            '[EMAIL_REDACTED]', 
            anonymized, 
            flags=re.IGNORECASE
        )
        anonymized = re.sub(
            PIIFilter.PATTERNS['french_phone'], 
            '[PHONE_REDACTED]', 
            anonymized, 
            flags=re.IGNORECASE
        )
        anonymized = re.sub(
            PIIFilter.PATTERNS['french_ssn'], 
            '[SSN_REDACTED]', 
            anonymized, 
            flags=re.IGNORECASE
        )
        anonymized = re.sub(
            PIIFilter.PATTERNS['credit_card'], 
            '[CC_REDACTED]', 
            anonymized, 
            flags=re.IGNORECASE
        )
        
        return anonymized, findings
