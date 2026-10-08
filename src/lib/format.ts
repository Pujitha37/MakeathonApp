// Date/number formatting helpers, ported 1:1 from finprofile.html.

export const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
export const WD = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export const fmt = (n: number): string => '₹' + Math.round(n).toLocaleString('en-IN');

// yyyy-mm-dd, local
export const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// parse yyyy-mm-dd -> local Date
export const pd = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// "8 Oct" style
export const fd = (s: string | Date): string => {
  const d = typeof s === 'string' ? pd(s) : s;
  return d.getDate() + ' ' + MON[d.getMonth()];
};

export const daysIn = (y: number, m: number): number => new Date(y, m + 1, 0).getDate();

export const minD = (...a: Date[]): Date => new Date(Math.min(...a.map(Number)));

export const ord = (n: number): string =>
  n + ((n % 10 === 1 && n % 100 !== 11) ? 'st'
    : (n % 10 === 2 && n % 100 !== 12) ? 'nd'
    : (n % 10 === 3 && n % 100 !== 13) ? 'rd' : 'th');

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
