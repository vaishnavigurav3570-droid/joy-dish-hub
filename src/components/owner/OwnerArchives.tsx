import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Archive, Download, FileText, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Order } from '@/types/order';

interface OwnerArchivesProps {
  archiveMonth: string;
  setArchiveMonth: (val: string) => void;
  archiveMonthOptions: { value: string; label: string }[];
  archiveLabel: string;
  archiveOrders: Order[];
  handleDownloadCSV: () => void;
  downloadingCSV: boolean;
  handleDownloadArchivePDF: () => void;
  downloadingArchivePDF: boolean;
  deleteConfirmStep: number;
  setDeleteConfirmStep: (step: number) => void;
  deletingMonth: boolean;
  handleDeleteMonthData: () => void;
}

export default function OwnerArchives({
  archiveMonth, setArchiveMonth, archiveMonthOptions, archiveLabel, archiveOrders,
  handleDownloadCSV, downloadingCSV,
  handleDownloadArchivePDF, downloadingArchivePDF,
  deleteConfirmStep, setDeleteConfirmStep,
  deletingMonth, handleDeleteMonthData
}: OwnerArchivesProps) {
  return (
    <>
      <div className="space-y-5 mt-6">
        <Card className="p-5 rounded-2xl space-y-5">
          <div>
            <h4 className="font-bold text-foreground text-base flex items-center gap-2 mb-1">
              <Archive className="h-4 w-4 text-primary" /> Monthly Archives
            </h4>
            <p className="text-sm text-muted-foreground">Download reports or manage historical order data</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Select Month</label>
            <Select value={archiveMonth} onValueChange={setArchiveMonth}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {archiveMonthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {archiveLabel}: <span className="font-bold text-foreground">{archiveOrders.length}</span> orders • ₹
              <span className="font-bold text-primary">
                {archiveOrders.filter(o => o.status === 'completed').reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}
              </span> revenue
            </p>
          </div>

          <Button
            onClick={handleDownloadCSV}
            disabled={downloadingCSV || archiveOrders.length === 0}
            className="w-full rounded-xl h-12 font-semibold gradient-cool text-accent-foreground"
          >
            {downloadingCSV ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download Detailed Bills (CSV)
          </Button>

          <Button
            onClick={handleDownloadArchivePDF}
            disabled={downloadingArchivePDF || archiveOrders.length === 0}
            className="w-full rounded-xl h-12 font-semibold gradient-warm text-primary-foreground"
          >
            {downloadingArchivePDF ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Download Monthly Summary (PDF)
          </Button>

          <div className="border-2 border-destructive/20 rounded-xl p-4 space-y-3 bg-destructive/5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm font-bold text-destructive">Danger Zone</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Permanently delete all <span className="font-bold text-foreground">{archiveOrders.length}</span> orders from {archiveLabel}. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              className="w-full rounded-xl h-11 font-semibold"
              disabled={archiveOrders.length === 0 || deletingMonth}
              onClick={() => setDeleteConfirmStep(1)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {archiveLabel} Data
            </Button>
          </div>
        </Card>
      </div>

      <AlertDialog open={deleteConfirmStep === 1} onOpenChange={(open) => !open && setDeleteConfirmStep(0)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete {archiveLabel} Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-bold">{archiveOrders.length} orders</span> from {archiveLabel}. 
              This action cannot be undone. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              onClick={(e) => { e.preventDefault(); setDeleteConfirmStep(2); }}
            >
              Yes, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmStep === 2} onOpenChange={(open) => !open && setDeleteConfirmStep(0)}>
        <AlertDialogContent className="rounded-2xl border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Are you ABSOLUTELY sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-bold text-destructive">⚠️ This cannot be undone.</p>
              <p>You are about to permanently delete <span className="font-bold">{archiveOrders.length} orders</span> and all associated items from <span className="font-bold">{archiveLabel}</span>.</p>
              <p>All revenue data, customer records, and bill history for this month will be lost forever.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={() => setDeleteConfirmStep(0)}>Go back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              disabled={deletingMonth}
              onClick={(e) => { e.preventDefault(); handleDeleteMonthData(); }}
            >
              {deletingMonth ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
