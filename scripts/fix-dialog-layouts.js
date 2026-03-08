#!/usr/bin/env node
/**
 * Dialog Layout Fix Script
 * Automatically applies the professional dialog pattern to all dialog components
 * 
 * Pattern Applied:
 * - DialogContent: max-h-[90vh] flex flex-col
 * - TabsList/Header: flex-shrink-0
 * - ScrollArea: flex-1 pr-4
 * - DialogFooter: flex-shrink-0 border-t pt-4 mt-4
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIALOG_FILES = [
  // Procurement Dialogs
  'src/components/procurement/BudgetTrackingDialog.tsx',
  'src/components/procurement/GoodsReceiptDialog.tsx',
  'src/components/procurement/InventoryItemDialog.tsx',
  'src/components/procurement/PurchaseOrderDialog.tsx',
  'src/components/procurement/PurchaseOrderApprovalDialog.tsx',
  'src/components/procurement/SupplierPerformanceDialog.tsx',
  
  // Teams & Resources
  'src/components/teams/EmployeeProfileDialog.tsx',
  'src/components/resources/EquipmentProfileDialog.tsx',
  'src/components/resources/MaintenanceScheduleDialog.tsx',
  
  // Documents
  'src/components/documents/ReviewWorkflowDialog.tsx',
  
  // Invoice & Delivery
  'src/components/invoice/InvoiceManagementDashboard.tsx',
  'src/components/delivery/DeliveryNoteDialog.tsx',
  
  // Other Dialogs
  'src/components/NotificationSettingsDialog.tsx',
  'src/components/AppointmentDialog.tsx',
  'src/components/AppointmentViewDialog.tsx',
  'src/components/AppointmentExportDialog.tsx',
  'src/components/RecurrenceEditDialog.tsx',
  'src/components/AdvancedFilterDialog.tsx',
  'src/components/settings/SettingsDialog.tsx',
  'src/components/dialogs/IncomingInvoiceDialog.tsx',
  'src/components/dialogs/IntegrationSettingsDialog.tsx',
  'src/components/dialogs/InvoiceGenerationDialog.tsx',
  'src/components/dialogs/OrderConfirmationDialog.tsx',
  'src/components/dialogs/PaymentTrackingDialog.tsx',
  'src/components/dialogs/PositionEditDialog.tsx',
  'src/components/dialogs/TemplateUploadDialog.tsx',
];

function fixDialogLayout(filePath) {
  const fullPath = path.join(path.dirname(__dirname), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Fix 1: DialogContent with flex layout
  const dialogContentRegex = /<DialogContent className="([^"]*max-w-[^"]*?)(?:\s+max-h-\[90vh\])?(?:\s+max-h-\[80vh\])?(?:\s+max-h-\[85vh\])?([^"]*)"/g;
  
  if (content.match(dialogContentRegex)) {
    content = content.replace(
      dialogContentRegex,
      (match, before, after) => {
        if (!match.includes('flex flex-col')) {
          modified = true;
          return `<DialogContent className="${before} max-h-[90vh] flex flex-col${after}"`;
        }
        return match;
      }
    );
  }
  
  // Fix 2: ScrollArea with flex-1
  const scrollAreaRegex = /<ScrollArea className="([^"]*?)(?:max-h-\[calc\(90vh-200px\)\]|h-\[600px\])([^"]*)"/g;
  
  if (content.match(scrollAreaRegex)) {
    content = content.replace(
      scrollAreaRegex,
      (match, before, after) => {
        if (!match.includes('flex-1')) {
          modified = true;
          // Keep pr-4 if it exists, add flex-1
          const hasPr4 = match.includes('pr-4');
          return `<ScrollArea className="${before.trim()}${before.trim() ? ' ' : ''}flex-1${hasPr4 ? '' : ' pr-4'}${after}"`;
        }
        return match;
      }
    );
  }
  
  // Fix 3: DialogFooter with border
  const dialogFooterRegex = /<DialogFooter(?:\s+className="([^"]*)")?>/g;
  
  if (content.match(dialogFooterRegex)) {
    content = content.replace(
      dialogFooterRegex,
      (match, className) => {
        const classes = className || '';
        if (!classes.includes('flex-shrink-0')) {
          modified = true;
          const newClasses = [classes, 'flex-shrink-0', 'border-t', 'pt-4', 'mt-4']
            .filter(c => c && c.trim())
            .join(' ');
          return `<DialogFooter className="${newClasses}">`;
        }
        return match;
      }
    );
  }
  
  // Fix 4: Form with flex layout (if inside dialog)
  const formInDialogRegex = /<form[^>]+className="([^"]*?)"/g;
  const matches = content.matchAll(formInDialogRegex);
  
  for (const match of matches) {
    const formClassName = match[1];
    // Check if this form is inside a DialogContent (rough heuristic)
    const contextBefore = content.substring(Math.max(0, match.index - 500), match.index);
    if (contextBefore.includes('<DialogContent') && !formClassName.includes('flex-col')) {
      content = content.replace(
        match[0],
        match[0].replace(
          formClassName,
          `${formClassName} flex flex-col flex-1 overflow-hidden`
        )
      );
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  Skipped (already fixed or no changes needed): ${filePath}`);
    return false;
  }
}

function main() {
  console.log('🎨 Dialog Layout Fix Script');
  console.log('============================\n');
  
  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  DIALOG_FILES.forEach(file => {
    try {
      const result = fixDialogLayout(file);
      if (result) {
        fixedCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.log(`❌ Error processing ${file}: ${error.message}`);
      errorCount++;
    }
  });
  
  console.log('\n============================');
  console.log('Summary:');
  console.log(`✅ Fixed: ${fixedCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${DIALOG_FILES.length}`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 Dialog layouts have been improved!');
    console.log('💡 Next: Review changes and test the dialogs');
  }
}

main();
