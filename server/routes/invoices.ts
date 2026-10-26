import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';

const router = Router();

// Apply requireAuth to all invoice routes
router.use(requireAuth);

function parseJsonSafe(str: any, fallback: any = {}) {
  if (typeof str !== 'string') return str || fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

function rowToInvoice(row: any, items: any[] = []): any {
  return {
    id: row.id,
    userId: row.user_id,
    invoiceNumber: row.invoice_number,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    paymentTerms: row.payment_terms,
    poNumber: row.po_number || '',
    status: row.status,
    currency: row.currency,
    taxMode: row.tax_mode,
    business: parseJsonSafe(row.business_details, {
      name: '', ownerName: '', email: '', phone: '', address: '', gstin: '', logoUrl: ''
    }),
    client: parseJsonSafe(row.client_details, {
      name: '', contactPerson: '', email: '', phone: '', address: '', gstin: ''
    }),
    discountType: row.discount_type,
    discountValue: row.discount_value,
    subtotal: row.subtotal,
    taxTotal: row.tax_total,
    grandTotal: row.grand_total,
    amountPaid: row.amount_paid,
    amountDue: row.amount_due,
    paymentDetails: parseJsonSafe(row.payment_details, {}),
    termsAndConditions: row.terms_and_conditions || '',
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxRate: item.tax_rate,
      taxableAmount: item.taxable_amount,
      taxAmount: item.tax_amount,
      lineTotal: item.line_total,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to calculate totals server-side
function calculateServerTotals(items: any[], discountType: string = 'percentage', discountValue: number = 0, amountPaid: number = 0) {
  let subtotal = 0;
  let taxTotal = 0;

  const processedItems = items.map((item, idx) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const taxRate = Math.max(0, Math.min(100, Number(item.taxRate) || 0));

    const taxableAmount = Math.round((qty * unitPrice) * 100) / 100;
    const taxAmount = Math.round((taxableAmount * (taxRate / 100)) * 100) / 100;
    const lineTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

    subtotal += taxableAmount;
    taxTotal += taxAmount;

    return {
      id: item.id || crypto.randomUUID(),
      name: item.name || `Item ${idx + 1}`,
      description: item.description || '',
      quantity: qty,
      unitPrice,
      taxRate,
      taxableAmount,
      taxAmount,
      lineTotal,
      sortOrder: idx,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  taxTotal = Math.round(taxTotal * 100) / 100;

  let discountAmount = 0;
  const discVal = Number(discountValue) || 0;
  if (discVal > 0) {
    if (discountType === 'percentage') {
      discountAmount = Math.round((subtotal * (Math.min(100, discVal) / 100)) * 100) / 100;
    } else {
      discountAmount = Math.min(subtotal + taxTotal, Math.max(0, discVal));
    }
  }

  const grandTotal = Math.max(0, Math.round((subtotal + taxTotal - discountAmount) * 100) / 100);
  const paid = Math.max(0, Number(amountPaid) || 0);
  const amountDue = Math.max(0, Math.round((grandTotal - paid) * 100) / 100);

  return {
    items: processedItems,
    subtotal,
    taxTotal,
    discountAmount,
    grandTotal,
    amountPaid: paid,
    amountDue,
  };
}

// GET /api/invoices - List only invoices owned by the authenticated user
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const invoicesStmt = db.prepare(`
      SELECT * FROM invoices 
      WHERE user_id = ? 
      ORDER BY issue_date DESC, created_at DESC
    `);
    const invoiceRows = invoicesStmt.all(userId) as any[];

    if (invoiceRows.length === 0) {
      return res.status(200).json([]);
    }

    const itemsStmt = db.prepare(`
      SELECT * FROM invoice_items 
      WHERE invoice_id = ? 
      ORDER BY sort_order ASC
    `);

    const result = invoiceRows.map(row => {
      const items = itemsStmt.all(row.id) as any[];
      return rowToInvoice(row, items);
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ error: 'Failed to retrieve invoices.' });
  }
});

// GET /api/invoices/:id - Retrieve an invoice by ID (ownership verified)
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const invoiceId = req.params.id;

    // Strict ownership verification: WHERE id = ? AND user_id = ?
    const invoiceStmt = db.prepare(`
      SELECT * FROM invoices 
      WHERE id = ? AND user_id = ?
    `);
    const row = invoiceStmt.get(invoiceId, userId) as any;

    if (!row) {
      // 404 Not Found prevents leaking existence of other users' invoices
      return res.status(404).json({ error: 'Invoice not found or you do not have permission to view it.' });
    }

    const itemsStmt = db.prepare(`
      SELECT * FROM invoice_items 
      WHERE invoice_id = ? 
      ORDER BY sort_order ASC
    `);
    const items = itemsStmt.all(invoiceId) as any[];

    return res.status(200).json(rowToInvoice(row, items));
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({ error: 'Failed to retrieve invoice details.' });
  }
});

// POST /api/invoices - Create new invoice owned by the authenticated user
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const body = req.body;

    // Validation
    if (!body.invoiceNumber || !body.invoiceNumber.trim()) {
      return res.status(400).json({ error: 'Invoice number is required.' });
    }
    if (!body.business?.name || !body.business.name.trim()) {
      return res.status(400).json({ error: 'Business name is required.' });
    }
    if (!body.client?.name || !body.client.name.trim()) {
      return res.status(400).json({ error: 'Client name is required.' });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required.' });
    }

    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const totals = calculateServerTotals(
      body.items,
      body.discountType || 'percentage',
      body.discountValue || 0,
      body.amountPaid || 0
    );

    const insertInvoice = db.prepare(`
      INSERT INTO invoices (
        id, user_id, invoice_number, issue_date, due_date, payment_terms, po_number,
        status, currency, tax_mode, business_details, client_details,
        discount_type, discount_value, subtotal, tax_total, grand_total,
        amount_paid, amount_due, payment_details, terms_and_conditions,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `);

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (
        id, invoice_id, name, description, quantity, unit_price,
        tax_rate, taxable_amount, tax_amount, line_total, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Execute atomically inside a transaction
    const saveTransaction = db.transaction(() => {
      insertInvoice.run(
        id,
        userId,
        body.invoiceNumber.trim(),
        body.issueDate || now.split('T')[0],
        body.dueDate || now.split('T')[0],
        body.paymentTerms || 'Net 15',
        body.poNumber || '',
        body.status || 'Draft',
        body.currency || 'INR',
        body.taxMode || 'cgst_sgst',
        JSON.stringify(body.business || {}),
        JSON.stringify(body.client || {}),
        body.discountType || 'percentage',
        Number(body.discountValue) || 0,
        totals.subtotal,
        totals.taxTotal,
        totals.grandTotal,
        totals.amountPaid,
        totals.amountDue,
        JSON.stringify(body.paymentDetails || {}),
        body.termsAndConditions || '',
        now,
        now
      );

      totals.items.forEach(item => {
        insertItem.run(
          item.id,
          id,
          item.name,
          item.description,
          item.quantity,
          item.unitPrice,
          item.taxRate,
          item.taxableAmount,
          item.taxAmount,
          item.lineTotal,
          item.sortOrder
        );
      });
    });

    saveTransaction();

    // Fetch freshly saved record
    const savedRow = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as any;
    const savedItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC').all(id) as any[];

    return res.status(201).json(rowToInvoice(savedRow, savedItems));
  } catch (error: any) {
    console.error('Error saving invoice:', error);
    return res.status(500).json({ error: 'Failed to save invoice to database.' });
  }
});

// PUT /api/invoices/:id - Update existing invoice (ownership verified)
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const invoiceId = req.params.id;
    const body = req.body;

    // Verify ownership first
    const existing = db.prepare('SELECT id, created_at FROM invoices WHERE id = ? AND user_id = ?').get(invoiceId, userId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found or you do not have permission to update it.' });
    }

    if (!body.invoiceNumber || !body.invoiceNumber.trim()) {
      return res.status(400).json({ error: 'Invoice number is required.' });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required.' });
    }

    const now = new Date().toISOString();

    const totals = calculateServerTotals(
      body.items,
      body.discountType || 'percentage',
      body.discountValue || 0,
      body.amountPaid || 0
    );

    const updateInvoice = db.prepare(`
      UPDATE invoices SET
        invoice_number = ?,
        issue_date = ?,
        due_date = ?,
        payment_terms = ?,
        po_number = ?,
        status = ?,
        currency = ?,
        tax_mode = ?,
        business_details = ?,
        client_details = ?,
        discount_type = ?,
        discount_value = ?,
        subtotal = ?,
        tax_total = ?,
        grand_total = ?,
        amount_paid = ?,
        amount_due = ?,
        payment_details = ?,
        terms_and_conditions = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `);

    const deleteOldItems = db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?');

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (
        id, invoice_id, name, description, quantity, unit_price,
        tax_rate, taxable_amount, tax_amount, line_total, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateTransaction = db.transaction(() => {
      updateInvoice.run(
        body.invoiceNumber.trim(),
        body.issueDate,
        body.dueDate,
        body.paymentTerms || 'Net 15',
        body.poNumber || '',
        body.status || 'Draft',
        body.currency || 'INR',
        body.taxMode || 'cgst_sgst',
        JSON.stringify(body.business || {}),
        JSON.stringify(body.client || {}),
        body.discountType || 'percentage',
        Number(body.discountValue) || 0,
        totals.subtotal,
        totals.taxTotal,
        totals.grandTotal,
        totals.amountPaid,
        totals.amountDue,
        JSON.stringify(body.paymentDetails || {}),
        body.termsAndConditions || '',
        now,
        invoiceId,
        userId
      );

      deleteOldItems.run(invoiceId);

      totals.items.forEach(item => {
        insertItem.run(
          item.id,
          invoiceId,
          item.name,
          item.description,
          item.quantity,
          item.unitPrice,
          item.taxRate,
          item.taxableAmount,
          item.taxAmount,
          item.lineTotal,
          item.sortOrder
        );
      });
    });

    updateTransaction();

    const updatedRow = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;
    const updatedItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC').all(invoiceId) as any[];

    return res.status(200).json(rowToInvoice(updatedRow, updatedItems));
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return res.status(500).json({ error: 'Failed to update invoice in database.' });
  }
});

// POST /api/invoices/:id/duplicate - Duplicate an invoice (ownership verified)
router.post('/:id/duplicate', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const invoiceId = req.params.id;

    // Verify ownership
    const sourceInvoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND user_id = ?').get(invoiceId, userId) as any;
    if (!sourceInvoice) {
      return res.status(404).json({ error: 'Invoice not found or you do not have permission to duplicate it.' });
    }

    const sourceItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC').all(invoiceId) as any[];

    // Calculate next sequential invoice number for this user
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    const userInvoices = db.prepare('SELECT invoice_number FROM invoices WHERE user_id = ? AND invoice_number LIKE ?').all(userId, `${prefix}%`) as any[];
    
    let maxSeq = 0;
    userInvoices.forEach(inv => {
      const parts = inv.invoice_number.split('-');
      if (parts.length >= 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
    const newInvoiceNumber = `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Compute due date (+15 days)
    const due = new Date();
    due.setDate(due.getDate() + 15);
    const dueDate = due.toISOString().split('T')[0];

    const insertInvoice = db.prepare(`
      INSERT INTO invoices (
        id, user_id, invoice_number, issue_date, due_date, payment_terms, po_number,
        status, currency, tax_mode, business_details, client_details,
        discount_type, discount_value, subtotal, tax_total, grand_total,
        amount_paid, amount_due, payment_details, terms_and_conditions,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        'Draft', ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        0, ?, ?, ?,
        ?, ?
      )
    `);

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (
        id, invoice_id, name, description, quantity, unit_price,
        tax_rate, taxable_amount, tax_amount, line_total, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const duplicateTransaction = db.transaction(() => {
      insertInvoice.run(
        newId,
        userId,
        newInvoiceNumber,
        today,
        dueDate,
        sourceInvoice.payment_terms || 'Net 15',
        sourceInvoice.po_number || '',
        sourceInvoice.currency,
        sourceInvoice.tax_mode,
        sourceInvoice.business_details,
        sourceInvoice.client_details,
        sourceInvoice.discount_type,
        sourceInvoice.discount_value,
        sourceInvoice.subtotal,
        sourceInvoice.tax_total,
        sourceInvoice.grand_total,
        sourceInvoice.grand_total, // full amount due
        sourceInvoice.payment_details,
        sourceInvoice.terms_and_conditions,
        now,
        now
      );

      sourceItems.forEach((item, idx) => {
        insertItem.run(
          crypto.randomUUID(),
          newId,
          item.name,
          item.description,
          item.quantity,
          item.unit_price,
          item.tax_rate,
          item.taxable_amount,
          item.tax_amount,
          item.line_total,
          idx
        );
      });
    });

    duplicateTransaction();

    const duplicatedRow = db.prepare('SELECT * FROM invoices WHERE id = ?').get(newId) as any;
    const duplicatedItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC').all(newId) as any[];

    return res.status(201).json(rowToInvoice(duplicatedRow, duplicatedItems));
  } catch (error) {
    console.error('Error duplicating invoice:', error);
    return res.status(500).json({ error: 'Failed to duplicate invoice.' });
  }
});

// DELETE /api/invoices/:id - Delete an invoice (ownership verified)
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const invoiceId = req.params.id;

    // Verify ownership
    const existing = db.prepare('SELECT id FROM invoices WHERE id = ? AND user_id = ?').get(invoiceId, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found or you do not have permission to delete it.' });
    }

    // Delete invoice (foreign key cascade deletes items)
    db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').run(invoiceId, userId);

    return res.status(200).json({ success: true, message: 'Invoice deleted successfully.' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return res.status(500).json({ error: 'Failed to delete invoice.' });
  }
});

export default router;
