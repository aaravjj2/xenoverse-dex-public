import { NextResponse } from 'next/server';
import { getDiagnostics, isDatabaseAvailable } from '@/lib/db';
import { existsSync, statSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const REPO_ROOT = resolve(process.cwd(), '../../');


export async function GET() {
  const dbPath = join(process.cwd(), '../../out/dex.db');
  const exportPath = join(process.cwd(), '../../out');

  const diagnostics: any = {
    database: {
      available: isDatabaseAvailable(),
      path: dbPath,
      exists: existsSync(dbPath),
      size: existsSync(dbPath) ? Math.round(statSync(dbPath).size / 1024) + ' KB' : null,
    },
    exports: {
      path: exportPath,
      exists: existsSync(exportPath),
      files: [] as string[],
    },
    stats: null as any,
  };

  // Check export files
  const exportFiles = [
    'species.json', 'moves.json', 'types.json', 'abilities.json',
    'evolutions.json', 'learnsets.json', 'assets.json',
    'items.json', 'trainers.json', 'world_facts.json'
  ];
  for (const file of exportFiles) {
    const filePath = join(exportPath, file);
    if (existsSync(filePath)) {
      const stat = statSync(filePath);
      diagnostics.exports.files.push({
        name: file,
        size: Math.round(stat.size / 1024) + ' KB',
        modified: stat.mtime.toISOString(),
      });
    }
  }

  // Get database stats
  if (diagnostics.database.available) {
    diagnostics.stats = getDiagnostics();
  }

  // Validation Report
  const validationPath = join(exportPath, 'validation_report.json');
  if (existsSync(validationPath)) {
    try {
      const report = JSON.parse(require('fs').readFileSync(validationPath, 'utf8'));
      diagnostics.validation = {
        exists: true,
        summary: report.summary,
        timestamp: report.timestamp,
        breakdown: report.issues.reduce((acc: any, issue: any) => {
          if (issue.severity === 'warning') {
            acc[issue.code] = (acc[issue.code] || 0) + 1;
          }
          return acc;
        }, {})
      };
    } catch (e) {
      diagnostics.validation = { exists: true, error: "Failed to parse report" };
    }
  } else {
    diagnostics.validation = { exists: false };
  }

  // Check for latest changelog
  try {
    const buildsDir = join(REPO_ROOT, 'out/builds');
    if (existsSync(buildsDir)) {
      // Find latest diff folder
      const diffs = readdirSync(buildsDir)
        .filter(f => f.includes('__') && statSync(join(buildsDir, f)).isDirectory())
        .sort().reverse();

      if (diffs.length > 0) {
        diagnostics.latestDiff = {
          exists: true,
          path: join(buildsDir, diffs[0], 'changelog.md'),
          name: diffs[0]
        };
      }
    }
  } catch (e) { }

  return NextResponse.json(diagnostics);
}
