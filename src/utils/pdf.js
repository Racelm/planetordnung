// Professionelle PDF-Engine ohne externe Libraries
const safe = s => String(s || '').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')
  .replace(/Ä/g,'Ae').replace(/Ö/g,'Oe').replace(/Ü/g,'Ue').replace(/ß/g,'ss')
  .replace(/€/g,'EUR').replace(/[^\x20-\xFF]/g,'?');
const esc = s => String(s || '').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');

export function createPDF() {
  const pages = [];
  let p = null;
  const np = () => { p = { ops: [], w: 595.28, h: 841.89 }; pages.push(p); };
  np();
  const op = s => p.ops.push(s);

  return {
    newPage: np,
    font: (bold, size) => op(`/${bold ? 'Hb' : 'Hr'} ${size} Tf`),
    color: (r, g, b) => op(`${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} rg`),
    text: (txt, x, y) => op(`BT /${p.ops.find(o=>o.includes('Tf'))||'Hr 9 Tf'} ${x} ${p.h-y} Td (${esc(safe(txt))}) Tj ET`),
    hLine: (x1, y1, x2, y2, r, g, b, w) => op(`${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} RG ${w||.5} w ${x1} ${p.h-y1} m ${x2} ${p.h-y2} l S`),
    fillRect: (x, y, w, h, r, g, bb) => op(`${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(bb/255).toFixed(3)} rg ${x} ${p.h-y-h} ${w} ${h} re f`),

    build: () => {
      const helvetica = '<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n/Encoding /WinAnsiEncoding\n>>';
      const helveticaBold = '<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica-Bold\n/Encoding /WinAnsiEncoding\n>>';

      let objs = [];
      let offsets = [];
      const addObj = content => { offsets.push(null); objs.push(content); return objs.length; };

      // Obj 1: Catalog, 2: Pages, 3+: Page content, fonts
      const fontR = addObj(helvetica);   // 1
      const fontB = addObj(helveticaBold); // 2

      const pageObjs = pages.map((pg, i) => {
        // Fix font references in ops
        const fixedOps = pg.ops.map(op => {
          if (op.startsWith('/Hr ') || op.startsWith('/Hb ')) {
            return op.replace('/Hr ', '/Hr ').replace('/Hb ', '/Hb ');
          }
          // Fix BT blocks
          return op.replace(/BT \/Hr (\d+\.?\d*) Tf/, 'BT /Hr $1 Tf').replace(/BT \/Hb (\d+\.?\d*) Tf/, 'BT /Hb $1 Tf');
        });
        const stream = fixedOps.join('\n');
        const contentObj = addObj(`<<\n/Length ${stream.length}\n>>\nstream\n${stream}\nendstream`);
        const pageObj = addObj(`<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 ${pg.w} ${pg.h}]\n/Contents ${contentObj} 0 R\n/Resources <<\n  /Font << /Hr ${fontR} 0 R /Hb ${fontB} 0 R >>\n>>\n>>`);
        return pageObj;
      });

      const pagesObj = 2; // Will be replaced
      const catalog = addObj(`<<\n/Type /Catalog\n/Pages ${objs.length + 1} 0 R\n>>`);
      const pagesContent = `<<\n/Type /Pages\n/Kids [${pageObjs.map(o=>`${o} 0 R`).join(' ')}]\n/Count ${pages.length}\n>>`;
      addObj(pagesContent);

      // Build PDF
      let pdf = '%PDF-1.4\n';
      const startOffsets = [];
      objs.forEach((content, i) => {
        startOffsets.push(pdf.length);
        pdf += `${i+1} 0 obj\n${content}\nendobj\n`;
      });

      const xrefOffset = pdf.length;
      pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
      startOffsets.forEach(o => { pdf += `${String(o).padStart(10,'0')} 00000 n \n`; });
      pdf += `trailer\n<<\n/Size ${objs.length + 1}\n/Root ${catalog} 0 R\n>>\nstartxref\n${xrefOffset}\n%%EOF`;

      return pdf;
    },

    toDataURL: function() {
      const content = this.build();
      const bytes = new Uint8Array(content.length);
      for (let i = 0; i < content.length; i++) bytes[i] = content.charCodeAt(i) & 0xff;
      const b64 = btoa(String.fromCharCode(...bytes));
      return 'data:application/pdf;base64,' + b64;
    }
  };
}

export function downloadPDF(dataUrl, filename) {
  const blob = dataURLtoBlob(dataUrl);
  if (navigator.share && navigator.canShare({ files: [new File([blob], filename, { type: 'application/pdf' })] })) {
    navigator.share({ files: [new File([blob], filename, { type: 'application/pdf' })] });
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }
}

function dataURLtoBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}
