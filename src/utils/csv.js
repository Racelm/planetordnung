export function exportCSV(name, rows, headers) {
  const lines = [headers.join(';')];
  rows.forEach(r => lines.push(headers.map(h => {
    const v = String(r[h] === undefined || r[h] === null ? '' : r[h]).replace(/"/g, '""');
    return v.includes(';') || v.includes('"') || v.includes('\n') ? `"${v}"` : v;
  }).join(';')));
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `PlanetOrdnung_${name}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}
