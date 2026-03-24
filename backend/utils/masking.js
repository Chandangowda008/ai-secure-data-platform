/**
 * Data Masking Utility
 *
 * Replaces sensitive values found by the scanner with masked equivalents.
 */

const maskingStrategies = {
  email(value) {
    const atIndex = value.indexOf("@");
    if (atIndex <= 0) return "***";
    return `***${value.slice(atIndex)}`;
  },

  api_key(value) {
    const dashIndex = value.indexOf("-");
    if (dashIndex >= 0) {
      return `${value.slice(0, dashIndex + 1)}****`;
    }
    return value.slice(0, 4) + "****";
  },

  password(value) {
    const sepMatch = value.match(/^(.*?[:=]\s*["']?)/);
    if (sepMatch) {
      return `${sepMatch[1]}****`;
    }
    return "****";
  },

  token(value) {
    const sepMatch = value.match(/^(.*?[:=]\s*["']?)/);
    if (sepMatch) {
      return `${sepMatch[1]}****`;
    }
    return "****";
  },

  phone_number() {
    return "***-***-****";
  },

  credential_pair() {
    return "****:****";
  },

  private_key_material() {
    return "-----REDACTED PRIVATE KEY-----";
  },
};

function defaultMask(value) {
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}${"*".repeat(Math.min(value.length - 2, 8))}`;
}

/**
 * Mask sensitive matches inside the raw text.
 *
 * @param {string} text  – The original raw input text.
 * @param {Array}  findings – Array of finding objects with `type` and `match`.
 * @returns {string} The text with sensitive matches replaced.
 */
export function maskSensitiveData(text, findings = []) {
  if (!text || findings.length === 0) return text;

  let masked = text;

  const sortedFindings = [...findings].sort(
    (a, b) => (b.match?.length || 0) - (a.match?.length || 0)
  );

  for (const finding of sortedFindings) {
    if (!finding.match) continue;

    const strategy = maskingStrategies[finding.type] || defaultMask;
    const replacement = strategy(finding.match);

    masked = masked.replaceAll(finding.match, replacement);
  }

  return masked;
}

/**
 * Mask the `match` field inside each finding object.
 *
 * @param {Array} findings – Array of finding objects.
 * @returns {Array} New array with masked `match` values.
 */
export function maskFindings(findings = []) {
  return findings.map((finding) => {
    if (!finding.match) return { ...finding };

    const strategy = maskingStrategies[finding.type] || defaultMask;
    return {
      ...finding,
      match: strategy(finding.match),
    };
  });
}
