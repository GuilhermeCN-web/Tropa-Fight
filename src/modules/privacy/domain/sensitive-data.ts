export function sanitizeLogMessage(message: string): string {
  return message
    .replace(
      /\b([\w.-]*authorization[\w.-]*)\s*([=:])\s*(?:Bearer\s+)?(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      '$1$2[REDACTED]',
    )
    .replace(
      /\b([\w.-]*(?:password|passwd|token|secret|cookie|card(?:number)?|cvv|credential|private[_-]?key|api[_-]?key|database[_-]?url|connection[_-]?string)[\w.-]*)\s*([=:])\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      '$1$2[REDACTED]',
    )
}
