import { useEffect, useState } from 'react';
import { Assignment } from '@/types/assignment';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR71Z8tflSQ766x9J0dY1RCujrmPEKHPrH9q0uPmxF-CUq29W00jJuLc6jMpGMjoFhyKC4-KreB0J1j/pub?gid=1020515194&single=true&output=csv';

function parseCSV(csvText: string): Assignment[] {
  const lines = csvText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log('Total CSV lines:', lines.length);
  console.log('Line 1 preview:', lines[0]?.substring(0, 80));
  console.log('Line 2 preview:', lines[1]?.substring(0, 80));
  console.log('Line 3 preview:', lines[2]?.substring(0, 80));

  if (lines.length < 4) {
    console.error('CSV has insufficient lines (need at least 4)');
    return [];
  }

  // FIND THE REAL HEADER ROW - look for line containing 'date_pst'
  const headerRowIndex = lines.findIndex(line => 
    line.toLowerCase().includes('date_pst')
  );

  if (headerRowIndex === -1) {
    console.error('CRITICAL: Could not find header row containing "date_pst"');
    console.log('Available lines:', lines.slice(0, 5));
    return [];
  }

  console.log(`✅ Found header row at index ${headerRowIndex}:`, lines[headerRowIndex]);

  // Parse CSV line properly handling quoted values and commas inside quotes
  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  // Extract headers from the correct row
  const headers = parseCsvLine(lines[headerRowIndex])
    .map(h => h.toLowerCase().replace(/['"]+/g, '').trim());

  console.log('✅ Parsed headers:', headers);
  console.log('✅ Has script_content column:', headers.includes('script_content'));

  // Verify we have required headers
  if (!headers.includes('date_pst') || !headers.includes('creator_id')) {
    console.error('❌ Missing required headers! Found:', headers);
    return [];
  }

  // Parse data rows (everything AFTER the header row)
  const rows: Assignment[] = [];
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip completely empty rows
    if (line.replace(/,/g, '').trim().length === 0) {
      continue;
    }

    const values = parseCsvLine(line);
    const row: Assignment = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      // Clean up: remove quotes and extra whitespace
      value = value.replace(/^"|"$/g, '').replace(/[\r\n\t]+/g, '').trim();
      row[header] = value;
    });
    
    // Only include rows that have both date_pst and creator_id
    if (row['date_pst'] && row['creator_id']) {
      rows.push(row);
    }
  }

  console.log('✅ First parsed data row:', rows[0]);
  console.log('✅ Total valid data rows:', rows.length);
  
  return rows;
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

        const response = await fetch(CSV_URL);

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
