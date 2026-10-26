import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { db } from '../db';

describe('Authentication & Strict Invoice Ownership Security', () => {
  let userAToken = '';
  let userBToken = '';
  let userAInvoiceId = '';

  const userACreds = {
    fullName: 'Alice Walker',
    email: 'alice@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const userBCreds = {
    fullName: 'Bob Smith',
    email: 'bob@example.com',
    password: 'Password456!',
    confirmPassword: 'Password456!',
  };

  it('1. Rejects registration when passwords do not match', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Charlie Test',
        email: 'charlie@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword!',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/passwords do not match/i);
  });

  it('2. Registers User A successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userACreds);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(userACreds.email);
    userAToken = res.body.token;
  });

  it('3. Rejects duplicate registration for the same email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userACreds);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('4. Rejects sign in with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userACreds.email,
        password: 'WrongPassword999',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it('5. Signs in User A with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userACreds.email,
        password: userACreds.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(userACreds.email);
    userAToken = res.body.token;
  });

  it('6. Registers User B successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userBCreds);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    userBToken = res.body.token;
  });

  it('7. Rejects access to protected endpoints without a token', async () => {
    const res = await request(app).get('/api/invoices');
    expect(res.status).toBe(401);
  });

  it('8. Validates session with GET /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(userACreds.email);
    expect(res.body.user.fullName).toBe(userACreds.fullName);
  });

  it('9. User A creates and persists an invoice in the database', async () => {
    const invoiceData = {
      invoiceNumber: 'INV-2026-A01',
      issueDate: '2026-10-26',
      dueDate: '2026-11-10',
      paymentTerms: 'Net 15',
      poNumber: 'PO-ALICE-1',
      status: 'Pending',
      currency: 'INR',
      taxMode: 'cgst_sgst',
      business: {
        name: 'Alice Solutions Ltd',
        ownerName: 'Alice Walker',
        email: 'alice@alicesolutions.com',
        phone: '+91 99999 11111',
        address: '123 Tech Park, Bengaluru',
        gstin: '29ABCDE1234F1Z5',
      },
      client: {
        name: 'Client Alpha Corp',
        contactPerson: 'David Brown',
        email: 'david@clientalpha.com',
        phone: '+91 88888 22222',
        address: '456 Business Tower, Mumbai',
      },
      items: [
        {
          name: 'Full Stack Development',
          description: 'React + Node backend architecture',
          quantity: 2,
          unitPrice: 50000,
          taxRate: 18,
        },
      ],
      discountType: 'percentage',
      discountValue: 0,
      amountPaid: 0,
    };

    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${userAToken}`)
      .send(invoiceData);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.invoiceNumber).toBe('INV-2026-A01');
    expect(res.body.grandTotal).toBe(118000); // 100k + 18k GST
    expect(res.body.items.length).toBe(1);

    userAInvoiceId = res.body.id;
  });

  it('10. User A can retrieve their own saved invoice', async () => {
    const res = await request(app)
      .get(`/api/invoices/${userAInvoiceId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userAInvoiceId);
    expect(res.body.client.name).toBe('Client Alpha Corp');
  });

  it('11. SECURITY CHECK: User B CANNOT retrieve User A invoice by changing ID (returns 404)', async () => {
    const res = await request(app)
      .get(`/api/invoices/${userAInvoiceId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    // Must return 404 (or 403), never leaking User A's data!
    expect(res.status).toBe(404);
    expect(res.body.client).toBeUndefined();
  });

  it('12. SECURITY CHECK: User B CANNOT update User A invoice (returns 404)', async () => {
    const res = await request(app)
      .put(`/api/invoices/${userAInvoiceId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        invoiceNumber: 'HACKED-NUMBER',
        items: [{ name: 'Hacked Item', quantity: 1, unitPrice: 1, taxRate: 0 }],
      });

    expect(res.status).toBe(404);

    // Verify User A invoice was untouched
    const checkRes = await request(app)
      .get(`/api/invoices/${userAInvoiceId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(checkRes.body.invoiceNumber).toBe('INV-2026-A01');
  });

  it('13. SECURITY CHECK: User B CANNOT delete User A invoice (returns 404)', async () => {
    const res = await request(app)
      .delete(`/api/invoices/${userAInvoiceId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);

    // Verify still exists for User A
    const checkRes = await request(app)
      .get(`/api/invoices/${userAInvoiceId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(checkRes.status).toBe(200);
  });

  it('14. User B invoice list does NOT contain User A invoices', async () => {
    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]); // User B has created 0 invoices
  });

  it('15. User A can duplicate their invoice', async () => {
    const res = await request(app)
      .post(`/api/invoices/${userAInvoiceId}/duplicate`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(201);
    expect(res.body.id).not.toBe(userAInvoiceId);
    expect(res.body.status).toBe('Draft');
  });

  it('16. User A can delete their invoice', async () => {
    const res = await request(app)
      .delete(`/api/invoices/${userAInvoiceId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it is gone
    const checkRes = await request(app)
      .get(`/api/invoices/${userAInvoiceId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(checkRes.status).toBe(404);
  });
});
