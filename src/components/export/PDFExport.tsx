'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MaintenanceLog {
  id: string;
  maintenance_item: string;
  date: string;
  description?: string;
  cost?: number;
  currency?: string;
  hours_at_service?: number;
  notes?: string;
  component_name?: string;
}

interface Component {
  id: string;
  name: string;
  type: string;
  make?: string;
  model?: string;
  serial_number?: string;
  current_hours?: number;
  last_service_date?: string;
}

interface Document {
  id: string;
  name: string;
  document_type: string;
  expiry_date?: string;
}

interface BoatData {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  registration_number?: string;
  hin?: string;
  length_ft?: number;
  beam_ft?: number;
  draft_ft?: number;
  port_engine_make?: string;
  port_engine_model?: string;
  starboard_engine_make?: string;
  starboard_engine_model?: string;
}

interface PDFExportProps {
  boat: BoatData;
  components: Component[];
  logs: MaintenanceLog[];
  documents: Document[];
}

export function PDFExport({ boat, components, logs, documents }: PDFExportProps) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(24);
      doc.setTextColor(13, 148, 136); // Teal
      doc.text("Captain's Log", pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('Service History Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Boat Info Section
      doc.setFontSize(14);
      doc.setTextColor(13, 148, 136);
      doc.text('Vessel Information', 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      const boatInfo = [
        ['Name', boat.name || '-'],
        ['Make / Model', `${boat.make || '-'} ${boat.model || ''}`],
        ['Year', boat.year?.toString() || '-'],
        ['Registration', boat.registration_number || '-'],
        ['HIN', boat.hin || '-'],
        ['Length', boat.length_ft ? `${boat.length_ft} ft` : '-'],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: boatInfo,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 100 },
        },
        margin: { left: 14 },
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

      // Engine Info
      if (boat.port_engine_make || boat.starboard_engine_make) {
        doc.setFontSize(14);
        doc.setTextColor(13, 148, 136);
        doc.text('Propulsion', 14, yPos);
        yPos += 8;

        const engineInfo = [];
        if (boat.port_engine_make) {
          engineInfo.push(['Port Engine', `${boat.port_engine_make} ${boat.port_engine_model || ''}`]);
        }
        if (boat.starboard_engine_make) {
          engineInfo.push(['Starboard Engine', `${boat.starboard_engine_make} ${boat.starboard_engine_model || ''}`]);
        }

        autoTable(doc, {
          startY: yPos,
          head: [],
          body: engineInfo,
          theme: 'plain',
          styles: { fontSize: 10, cellPadding: 2 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40 },
            1: { cellWidth: 100 },
          },
          margin: { left: 14 },
        });

        yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // Components Summary
      if (components.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(13, 148, 136);
        doc.text('Components', 14, yPos);
        yPos += 8;

        const componentData = components.map(c => [
          c.name,
          c.type.replace(/_/g, ' '),
          c.make && c.model ? `${c.make} ${c.model}` : c.make || '-',
          c.serial_number || '-',
          c.current_hours?.toLocaleString() || '-',
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Name', 'Type', 'Make/Model', 'Serial #', 'Hours']],
          body: componentData,
          theme: 'striped',
          headStyles: { fillColor: [13, 148, 136], fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 3 },
          margin: { left: 14, right: 14 },
        });

        yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Maintenance History
      if (logs.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(13, 148, 136);
        doc.text('Maintenance History', 14, yPos);
        yPos += 8;

        const logData = logs.map(log => [
          new Date(log.date).toLocaleDateString('en-GB'),
          log.component_name || '-',
          log.maintenance_item.replace(/_/g, ' '),
          log.cost ? `${log.currency || 'AED'} ${log.cost.toLocaleString()}` : '-',
          log.hours_at_service?.toLocaleString() || '-',
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Component', 'Service', 'Cost', 'Hours']],
          body: logData,
          theme: 'striped',
          headStyles: { fillColor: [13, 148, 136], fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 3 },
          margin: { left: 14, right: 14 },
        });

        yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Documents
      if (documents.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(13, 148, 136);
        doc.text('Documents', 14, yPos);
        yPos += 8;

        const docData = documents.map(d => [
          d.name,
          d.document_type.replace(/_/g, ' '),
          d.expiry_date ? new Date(d.expiry_date).toLocaleDateString('en-GB') : '-',
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Document', 'Type', 'Expiry']],
          body: docData,
          theme: 'striped',
          headStyles: { fillColor: [13, 148, 136], fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 3 },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated by Captain's Log • ${new Date().toLocaleDateString('en-GB')} • Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Calculate total cost
      const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
      
      // Save the PDF
      const fileName = `${boat.name.replace(/[^a-zA-Z0-9]/g, '_')}_Service_History_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={generating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {generating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      {generating ? 'Generating...' : 'Export PDF'}
    </Button>
  );
}
