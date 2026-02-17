import { useEffect, useState } from 'react';
import { Assignment } from '@/types/assignment';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR71Z8tflSQ766x9J0dY1RCujrmPEKHPrH9q0uPmxF-CUq29W00jJuLc6jMpGMjoFhyKC4-KreB0J1j/pub?gid=1020515194&single=true&output=csv';

// Parse CSV text into rows, correctly handling multi-line quoted fields
function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  const fields: string[] = [];

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];

    if (char === '"') {
      if (inQuotes && i + 1 < csvText.length && csvText[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row
      if (char === '\r' && i + 1 < csvText.length && csvText[i + 1] === '\n') {
        i++; // skip \r\n pair
      }
      fields.push(current.trim());
      if (fields.some(f => f.length > 0)) {
        rows.push([...fields]);
      }
      fields.length = 0;
      current = '';
    } else {
      current += char;
    }
  }
  // Last row
  fields.push(current.trim());
  if (fields.some(f => f.length > 0)) {
    rows.push([...fields]);
  }

  return rows;
}

function parseCSV(csvText: string): Assignment[] {
  const rows = parseCSVRows(csvText);

  console.log('Total CSV rows:', rows.length);
  console.log('Row 1 preview:', rows[0]?.slice(0, 5));

  if (rows.length < 4) {
    console.error('CSV has insufficient rows (need at least 4)');
    return [];
  }

  // FIND THE REAL HEADER ROW - look for row containing 'date_pst'
  const headerRowIndex = rows.findIndex(row =>
    row.some(cell => cell.toLowerCase().includes('date_pst'))
  );

  if (headerRowIndex === -1) {
    console.error('CRITICAL: Could not find header row containing "date_pst"');
    return [];
  }

  const headers = rows[headerRowIndex].map(h => h.toLowerCase().replace(/['"]+/g, '').trim());

  console.log('✅ Parsed headers:', headers);
  console.log('✅ Has notes column:', headers.includes('notes'));

  // Verify we have required headers
  if (!headers.includes('date_pst') || !headers.includes('creator_id')) {
    console.error('❌ Missing required headers! Found:', headers);
    return [];
  }

  // Map data rows (everything AFTER the header row)
  const results: Assignment[] = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const values = rows[i];

    // Skip empty rows
    if (values.every(v => v.length === 0)) continue;

    const row: Assignment = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';
      value = value.replace(/^"|"$/g, '').replace(/[\r\n\t]+/g, '').trim();
      row[header] = value;
    });

    if (row['date_pst'] && row['creator_id']) {
      results.push(row);
    }
  }

  console.log('✅ First parsed data row:', results[0]);
  console.log('✅ Total valid data rows:', results.length);

  return results;
}

export function useAssignments(creatorId: string | null) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [yesterdayAssignments, setYesterdayAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    async function fetchAssignments() {
      setLoading(true);
      setError(null);

      try {
        console.log('=== ASSIGNMENT LOADING DEBUG ===');
        console.log('Creator ID:', creatorId);
        console.log('Fetching CSV from:', CSV_URL);

        const cacheBuster = `&_t=${Date.now()}`;
        const response = await fetch(CSV_URL + cacheBuster, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        console.log('CSV fetched successfully, length:', csvText.length);
        console.log('CSV preview:', csvText.substring(0, 200));

        const allRows = parseCSV(csvText);
        console.log('Total parsed rows:', allRows.length);
        console.log('First 3 rows:', allRows.slice(0, 3));

        // Get today's date in PST timezone (YYYY-MM-DD format)
        const todayPST = new Date().toLocaleDateString('en-CA', {
          timeZone: 'America/Los_Angeles'
        });
        
        // Get yesterday's date in PST timezone
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayPST = yesterdayDate.toLocaleDateString('en-CA', {
          timeZone: 'America/Los_Angeles'
        });
        
        console.log('Today in PST:', todayPST);
        console.log('Yesterday in PST:', yesterdayPST);

        // Normalize creator ID for comparison
        const normalizedCreatorId = (creatorId || '').trim().toLowerCase();
        console.log('Looking for creator:', normalizedCreatorId);

        const filterByDate = (rows: Assignment[], targetDate: string) => {
          return rows.filter(row => {
            const rowDate = String(row['date_pst'] || '').trim().replace(/[\r\n\t]+/g, '');
            const rowCreatorId = String(row['creator_id'] || '').trim().toLowerCase().replace(/[\r\n\t]+/g, '');
            const dateMatch = rowDate === targetDate;
            const creatorMatch = normalizedCreatorId === '' || rowCreatorId === normalizedCreatorId;
            return dateMatch && creatorMatch;
          });
        };

        const todaysAssignments = filterByDate(allRows, todayPST);
        const yesterdaysAssignments = filterByDate(allRows, yesterdayPST);

        console.log('Today assignments:', todaysAssignments.length);
        console.log('Yesterday assignments:', yesterdaysAssignments.length);

        setAssignments(todaysAssignments);
        setYesterdayAssignments(yesterdaysAssignments);
      } catch (err: any) {
        console.error('Error loading assignments:', err);
        setError(err.message || 'Failed to load assignments');
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, [creatorId, refreshKey]);

  return { assignments, yesterdayAssignments, loading, error, refetch };
}
