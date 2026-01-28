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
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
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
        const today = getTodayPST();
        
        const normalizedCreatorId = creatorId ? creatorId.trim().toLowerCase() : null;
        
        const filtered = allAssignments.filter(assignment => {
          const dateMatch = assignment.date_pst === today;
          const creator = (assignment.creator_id || "").trim().toLowerCase();
          const creatorMatch = normalizedCreatorId ? creator === normalizedCreatorId : true;
          const activeValue = (assignment.active || "").toString().trim().toUpperCase();
          const isActive = activeValue === "TRUE";
          return dateMatch && creatorMatch && isActive;
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
