import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface PdfExportOptions {
  fileName?: string;
  reportTitle?: string;
  branchName?: string;
  weekStr?: string;
  backgroundColor?: string;
}

/**
 * Exports a DOM element as a high-resolution PDF preserving all Norseen styling,
 * fonts, colors, badges, and digital seals, supporting modern Tailwind CSS v4 oklch colors.
 */
export const exportElementToPdf = async (
  elementId: string,
  options: PdfExportOptions = {}
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    return false;
  }

  try {
    // 1. Capture element at high scale using html2canvas-pro (with oklch/lab support)
    const canvas = await html2canvas(element, {
      scale: 2, // 2x scale provides crisp typography without blowing memory
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: options.backgroundColor || '#ffffff',
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (el) => el.classList?.contains('no-print'),
      onclone: (clonedDoc) => {
        // Strip out non-printable UI controls (search bars, filter buttons, actions)
        clonedDoc.querySelectorAll('.no-print').forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });

        // Ensure cloned element is fully expanded and visible
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.display = 'block';
          clonedEl.style.visibility = 'visible';
          clonedEl.style.position = 'relative';
          clonedEl.style.width = '100%';
          clonedEl.style.margin = '0';
          clonedEl.style.boxShadow = 'none';
        }
      },
    });

    // 2. Setup A4 based on aspect ratio
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    if (!imgWidth || !imgHeight) {
      throw new Error('Canvas rendering produced zero dimensions');
    }

    const isLandscape = imgWidth > imgHeight;
    const orientation = isLandscape ? 'l' : 'p';
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Margin in mm
    const margin = 6;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    // Calculate height proportional to printable width
    const renderedHeight = (imgHeight * printableWidth) / imgWidth;

    // If fits on one page (or within 15% tolerance so it fits on a single A4 sheet)
    if (renderedHeight <= printableHeight) {
      const imgData = canvas.toDataURL('image/png', 0.95);
      pdf.addImage(imgData, 'PNG', margin, margin, printableWidth, renderedHeight, undefined, 'FAST');
    } else if (renderedHeight <= printableHeight * 1.2) {
      // Scale down slightly to fit on 1 single clean A4 page
      const scaleFactor = printableHeight / renderedHeight;
      const finalW = printableWidth * scaleFactor;
      const finalH = renderedHeight * scaleFactor;
      const offsetX = margin + (printableWidth - finalW) / 2;
      const imgData = canvas.toDataURL('image/png', 0.95);
      pdf.addImage(imgData, 'PNG', offsetX, margin, finalW, finalH, undefined, 'FAST');
    } else {
      // Multi-page slicing
      const imgData = canvas.toDataURL('image/png', 0.95);
      let heightLeft = renderedHeight;
      let position = margin;
      let pageNumber = 1;

      // First page
      pdf.addImage(imgData, 'PNG', margin, position, printableWidth, renderedHeight, undefined, 'FAST');
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        position = margin - (pageNumber * printableHeight);
        pdf.addPage('a4', orientation);
        pageNumber++;
        pdf.addImage(imgData, 'PNG', margin, position, printableWidth, renderedHeight, undefined, 'FAST');
        heightLeft -= printableHeight;
      }
    }

    // Default filename
    const safeBranch = (options.branchName || 'فرع_نورسين').replace(/[/\\?%*:|"<> ]/g, '_');
    const safeWeek = (options.weekStr || 'أسبوعي').replace(/[/\\?%*:|"<> ]/g, '_');
    const finalName = options.fileName || `التقرير_الأسبوعي_${safeBranch}_${safeWeek}.pdf`;

    pdf.save(finalName);
    return true;
  } catch (err) {
    console.error('Error generating PDF report:', err);
    return false;
  }
};
