import { useState, useEffect } from 'react';
import { Assignment } from '@/types/assignment';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1-Hmc7uhJTcPt5RPX4W3-B1sEgfjLjBdlrlaFkqktjL0/export?format=csv&gid=1020515194';

function parseCSV(text: string): Assignment[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj: Assignment = {} as Assignment;
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    // Ensure script_name is always a string (never undefined)
    obj.script_name = (obj.script_name ?? '').toString().trim();
    
    // Set script_required flag based on whether script_name has a value
    obj.script_required = obj.script_name.length > 0;
    
    return obj;
  });
}

function getTodayPST(): string {
  // IMPORTANT: Keep this as a plain string (YYYY-MM-DD) to avoid UTC/PST day shifts.
  // Do NOT parse sheet dates into Date objects.
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  return todayStr;
}

export function useAssignments(creatorId: string | null) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const url = `${CSV_URL}&t=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const text = await response.text();
        const allAssignments = parseCSV(text);

        // Required: use this exact code to get today's date string in PST.
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

        const selectedCreator = String(creatorId || '').trim().toLowerCase();

        const filtered = allAssignments.filter((row) => {
          // Required: treat sheet date as a plain string only (never Date(row.date_pst)).
          const rowDateStr = String(row.date_pst || '').trim();

          // Required: normalize creator IDs safely (trim + lowercase).
          const rowCreator = String(row.creator_id || '').trim().toLowerCase();

          // Existing requirement: only include active rows.
          const activeValue = String(row.active || '').trim().toUpperCase();
          const isActive = activeValue === 'TRUE';

          // Debug logging (requested)
          console.log('Today PST:', todayStr, 'Sheet Date:', rowDateStr, 'Creator:', rowCreator);

          const creatorMatch = selectedCreator ? rowCreator === selectedCreator : true;
          return rowDateStr === todayStr && creatorMatch && isActive;
        });
        
        setAssignments(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [creatorId]);

  return { assignments, loading, error };
}
