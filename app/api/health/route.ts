import { NextResponse } from 'next/server'
import {
  checkDatabase,
  healthReport,
} from '../../../src/infrastructure/database/database-health'

// Always evaluated per request; never cached.
export const dynamic = 'force-dynamic'

/** Public liveness/readiness probe without internal details (RNF-014). */
export async function GET() {
  const report = healthReport(await checkDatabase())
  return NextResponse.json(report, {
    status: report.database === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
