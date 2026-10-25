import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const WEEKS_DIR = path.resolve(DATA_DIR, 'weeks');
const CONFIG_FILE = path.resolve(DATA_DIR, 'config.json');

async function syncAllWeeks() {
  console.log('Reading config file...');
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('Config file not found.');
    return;
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  const scriptUrl = config.scriptUrl;

  if (!scriptUrl || !scriptUrl.trim()) {
    console.error('scriptUrl is empty in config.json');
    return;
  }

  console.log(`Using scriptUrl: ${scriptUrl}`);

  let totalUpdatedWeeks = 0;
  let totalFetchedEntries = 0;

  for (let w = 1; w <= 35; w++) {
    try {
      const urlObj = new URL(scriptUrl.trim());
      urlObj.searchParams.set('action', 'getWeek');
      urlObj.searchParams.set('week', String(w));

      console.log(`Fetching Week ${w}...`);
      const res = await fetch(urlObj.toString(), {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        console.warn(`Week ${w} HTTP error: ${res.status}`);
        continue;
      }

      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        const sheetsEntries = json.data;
        console.log(`Week ${w}: Received ${sheetsEntries.length} entries from Google Sheets.`);

        const weekFile = path.resolve(WEEKS_DIR, `week_${w}.json`);
        let localEntries: any[] = [];
        if (fs.existsSync(weekFile)) {
          try {
            localEntries = JSON.parse(fs.readFileSync(weekFile, 'utf-8'));
          } catch {}
        }

        // Merge logic
        const map = new Map<string, any>();
        const getKey = (e: any) => `d${e.dayOfWeek}_c${e.clusterIndex || 1}_p${e.period}`;
        const hasContent = (e: any) =>
          Boolean(
            (e.subject && e.subject.trim()) ||
            (e.lessonTitle && e.lessonTitle.trim()) ||
            (e.teacherSignature && e.teacherSignature.trim()) ||
            (e.ppctLesson && e.ppctLesson.trim()) ||
            (e.absentCount && e.absentCount > 0)
          );

        for (const e of localEntries) {
          map.set(getKey(e), e);
        }

        let updatedCount = 0;
        for (const e of sheetsEntries) {
          const key = getKey(e);
          const existing = map.get(key);
          if (!existing) {
            map.set(key, e);
            updatedCount++;
          } else if (hasContent(e)) {
            map.set(key, { ...existing, ...e });
            updatedCount++;
          }
        }

        const merged = Array.from(map.values()).sort((a, b) => {
          if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
          if ((a.clusterIndex || 1) !== (b.clusterIndex || 1)) return (a.clusterIndex || 1) - (b.clusterIndex || 1);
          return a.period - b.period;
        });

        fs.writeFileSync(weekFile, JSON.stringify(merged, null, 2), 'utf-8');
        totalUpdatedWeeks++;
        totalFetchedEntries += sheetsEntries.length;
        console.log(`Week ${w} updated successfully.`);
      } else {
        console.log(`Week ${w}: No data returned or empty.`);
      }
    } catch (err) {
      console.warn(`Error syncing Week ${w}:`, err);
    }
  }

  console.log(`Sync complete! Updated ${totalUpdatedWeeks} weeks with ${totalFetchedEntries} entries.`);
}

syncAllWeeks();
