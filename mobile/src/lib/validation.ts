export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || year > 9999) return false;
  const date = new Date(0); date.setUTCFullYear(year, month - 1, day); date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export function calendarDate(date: Date) {
  return String(date.getFullYear()).padStart(4, '0') + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}
export function formatDate(value: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value.length === 10 ? value + 'T12:00:00' : value));
}
export function passwordError(password: string, confirm: string) {
  if (password !== confirm) return 'Your passwords don’t match. Please enter them again.';
  if (password.length < 8 || !password.trim()) return 'Choose a password with at least 8 characters.';
  if (utf8Length(password) > 72) return 'This password is too long. Please choose a shorter one.';
  return '';
}

export function utf8Length(value: string) { let bytes = 0; for (const character of value) { const point = character.codePointAt(0)!; bytes += point <= 127 ? 1 : point <= 2047 ? 2 : point <= 65535 ? 3 : 4; } return bytes; }
