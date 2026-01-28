import { useEffect, useState } from 'react';
import { Assignment } from '@/types/assignment';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR71Z8tflSQ766x9J0dY1RCujrmPEKHPrH9q0uPmxF-CUq29W00jJuLc6jMpGMjoFhyKC4-KreB0J1j/pub?gid=1020515194&single=true&output=csv';

function parseCSV(csvText: string): Assignment[] {
  const lines = csvText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) return [];

  // Get headers and normalize them
  const headers = lines[0]
    .split(',')
    .map(header => header.replace(/"/g, '').trim().toLowerCase());

  // Parse data rows
  const rows: Assignment[] = lines.slice(1).map(line => {
    const values = line
      .split(',')
      .map(value => value.replace(/"/g, '').replace(/[\r\n\t]+/g, '').trim());

    const row: Assignment = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    return row;
  });

  return rows;
}

export function useAssignments(creatorId: string | null) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.log('Today in PST:', todayPST);

        // Normalize creator ID for comparison
        const normalizedCreatorId = (creatorId || '').trim().toLowerCase();
        console.log('Looking for creator:', normalizedCreatorId);

        // Filter assignments for today and this creator
        const todaysAssignments = allRows.filter(row => {
          const rowDate = String(row['date_pst'] || '')
            .trim()
            .replace(/[\r\n\t]+/g, '');

          const rowCreatorId = String(row['creator_id'] || '')
            .trim()
            .toLowerCase()
            .replace(/[\r\n\t]+/g, '');

          const dateMatch = rowDate === todayPST;
          const creatorMatch = normalizedCreatorId === '' || rowCreatorId === normalizedCreatorId;

          console.log(`Row check: date="${rowDate}" creator="${rowCreatorId}" → dateMatch=${dateMatch} creatorMatch=${creatorMatch}`);

          return dateMatch && creatorMatch;
        });

        console.log('Filtered assignments count:', todaysAssignments.length);
        console.log('Final assignments:', todaysAssignments);

        setAssignments(todaysAssignments);
      } catch (err: any) {
        console.error('Error loading assignments:', err);
        setError(err.message || 'Failed to load assignments');
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, [creatorId]);

  return { assignments, loading, error };
}
