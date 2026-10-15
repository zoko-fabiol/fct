/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Tests Unitaires Espace Client Multi-Onglets
 * Franchise Conseils Trading - Douala, Cameroun
 */

import { describe, it, expect } from 'vitest';
import {
  buildClientTimeline,
  getBookingStatusInfo,
  ClientProfile,
  ClientDocument,
  ClientRentalRecord,
  ClientSaleRecord,
  ClientInvoiceRecord,
} from '../website/src/services/clientPortalService.ts';

describe('Espace Client Multi-Onglets FCT Automobile', () => {
  const mockProfile: ClientProfile = {
    id: 'cust_jean_paul',
    fullName: 'Jean-Paul MBIIDA',
    email: 'jp.mbiida@example.com',
    phone: '+237 699 11 22 33',
    whatsappPhone: '+237 699 11 22 33',
    type: 'INDIVIDUAL',
    taxNumber: 'M051812345678A',
    address: 'Carrefour Santa Barbara, Bonamoussadi',
    city: 'Douala',
    createdAt: '2026-01-10T08:30:00Z',
  };

  const mockDocs: ClientDocument[] = [
    {
      id: 'doc_cni_1',
      title: 'CNI Recto/Verso',
      category: 'ID_CARD',
      fileUrl: 'https://res.cloudinary.com/c58pcgcp/image/upload/v1/cni.jpg',
      uploadedAt: '2026-01-11T10:00:00Z',
      relatedCustomerId: 'cust_jean_paul',
      status: 'VERIFIED',
    },
    {
      id: 'doc_permis_1',
      title: 'Permis de Conduire B',
      category: 'DRIVING_LICENSE',
      fileUrl: 'https://res.cloudinary.com/c58pcgcp/image/upload/v1/permis.jpg',
      uploadedAt: '2026-01-12T14:00:00Z',
      relatedCustomerId: 'cust_jean_paul',
      status: 'VERIFIED',
    },
  ];

  const mockRentals: ClientRentalRecord[] = [
    {
      id: 'ctr_prado_1',
      contractNumber: 'CTR-2026-0042',
      vehicleName: 'Toyota Land Cruiser Prado TX-L',
      startDate: '2026-02-01',
      endDate: '2026-02-05',
      durationDays: 4,
      totalAmountXAF: 340000,
      paidAmountXAF: 340000,
      remainingAmountXAF: 0,
      status: 'RETURNED',
    },
  ];

  const mockSales: ClientSaleRecord[] = [
    {
      id: 'sale_hilux_1',
      orderNumber: 'CMD-2026-0012',
      vehicleName: 'Toyota Hilux Revo Double Cabine',
      stage: 'COMMANDE_VALIDÉE',
      negotiatedPriceXAF: 28000000,
      paidAmountXAF: 10000000,
      balanceXAF: 18000000,
      orderDate: '2026-03-01',
    },
  ];

  const mockInvoices: ClientInvoiceRecord[] = [
    {
      id: 'inv_101',
      invoiceNumber: 'FAC-2026-0089',
      issueDate: '2026-02-01',
      totalAmountXAF: 340000,
      paidAmountXAF: 340000,
      balanceXAF: 0,
      status: 'PAID',
    },
  ];

  it('devrait construire une timeline chronologique descendante reliant tous les événements du client', () => {
    const timeline = buildClientTimeline({
      profile: mockProfile,
      docs: mockDocs,
      rentals: mockRentals,
      sales: mockSales,
      invoices: mockInvoices,
    });

    expect(timeline.length).toBe(6); // 1 compte + 2 docs + 1 location + 1 vente + 1 facture
    // L'événement le plus récent (vente en mars 2026) doit être en premier
    expect(timeline[0].type).toBe('SALE');
    expect(timeline[0].title).toContain('Toyota Hilux Revo');

    // L'événement le plus ancien (création compte en janvier 2026) doit être en dernier
    expect(timeline[timeline.length - 1].type).toBe('ACCOUNT');
  });

  it('devrait attribuer les bons libellés et couleurs de statut pour les locations', () => {
    const activeStatus = getBookingStatusInfo('ACTIVE');
    expect(activeStatus.label).toBe('Location en cours');
    expect(activeStatus.color).toContain('#059669');

    const confirmedStatus = getBookingStatusInfo('CONFIRMED');
    expect(confirmedStatus.label).toBe('Dossier Confirmé');

    const pendingStatus = getBookingStatusInfo('PENDING');
    expect(pendingStatus.label).toBe('En attente de validation agence');

    const returnedStatus = getBookingStatusInfo('RETURNED');
    expect(returnedStatus.label).toBe('Véhicule Restitué');
  });
});
