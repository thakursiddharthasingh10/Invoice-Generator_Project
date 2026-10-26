import { Invoice } from '../types/invoice';
import { calculateInvoiceSummary } from './invoiceCalculations';
import { getCurrencyConfig } from './currencyFormatter';

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen'
];

const TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
];

export function numberToWordsEnglish(n: number): string {
  const num = Math.floor(Math.abs(n));
  if (num === 0) return 'zero';

  function convertHundreds(val: number): string {
    let str = '';
    if (val >= 100) {
      str += ONES[Math.floor(val / 100)] + ' hundred ';
      val %= 100;
    }
    if (val >= 20) {
      str += TENS[Math.floor(val / 10)] + (val % 10 !== 0 ? '-' + ONES[val % 10] : '') + ' ';
    } else if (val > 0) {
      str += ONES[val] + ' ';
    }
    return str.trim();
  }

  // Indian numbering system for high numbers or international fallback
  // Crore (1,00,00,000), Lakh (1,00,000), Thousand (1,000), Hundreds
  let parts: string[] = [];

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;

  if (crore > 0) {
    parts.push(`${convertHundreds(crore)} crore`);
  }
  if (lakh > 0) {
    parts.push(`${convertHundreds(lakh)} lakh`);
  }
  if (thousand > 0) {
    parts.push(`${convertHundreds(thousand)} thousand`);
  }
  if (remainder > 0) {
    parts.push(convertHundreds(remainder));
  }

  return parts.join(' ').trim();
}

const HINDI_ONES: Record<number, string> = {
  0: 'शून्य', 1: 'एक', 2: 'दो', 3: 'तीन', 4: 'चार', 5: 'पाँच', 6: 'छह', 7: 'सात', 8: 'आठ', 9: 'नौ',
  10: 'दस', 11: 'ग्यारह', 12: 'बारह', 13: 'तेरह', 14: 'चौदह', 15: 'पंद्रह', 16: 'सोलह', 17: 'सत्रह',
  18: 'अठारह', 19: 'उन्नीस', 20: 'बीस', 25: 'पच्चीस', 30: 'तीस', 40: 'चालीस', 50: 'पचास',
  60: 'साठ', 70: 'सत्तर', 80: 'अस्सी', 90: 'नब्बे', 100: 'सौ'
};

export function numberToWordsHindi(n: number): string {
  const num = Math.floor(Math.abs(n));
  if (num === 0) return 'शून्य';

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const remainder = num % 100;

  const parts: string[] = [];

  if (crore > 0) parts.push(`${numberToWordsHindi(crore)} करोड़`);
  if (lakh > 0) parts.push(`${numberToWordsHindi(lakh)} लाख`);
  if (thousand > 0) parts.push(`${numberToWordsHindi(thousand)} हज़ार`);
  if (hundred > 0) parts.push(`${HINDI_ONES[hundred] || hundred} सौ`);
  if (remainder > 0) parts.push(HINDI_ONES[remainder] || remainder.toString());

  return parts.join(' ');
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const HINDI_MONTHS = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
];

const ORDINAL_DAYS = [
  '', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth',
  'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth', 'thirty-first'
];

export function formatDateSpokenEnglish(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  const ordinal = ORDINAL_DAYS[day] || `${day}th`;
  
  // Format year in spoken English: 2026 -> twenty twenty-six
  let yearSpoken = year.toString();
  if (year >= 2000 && year < 2100) {
    const lastTwo = year % 100;
    if (lastTwo === 0) {
      yearSpoken = 'two thousand';
    } else if (lastTwo < 10) {
      yearSpoken = `twenty oh-${ONES[lastTwo]}`;
    } else {
      yearSpoken = `twenty ${numberToWordsEnglish(lastTwo)}`;
    }
  }

  return `the ${ordinal} of ${month}, ${yearSpoken}`;
}

export function formatDateSpokenHindi(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const day = d.getDate();
  const month = HINDI_MONTHS[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month}, ${year}`;
}

/**
 * Builds the narration script for an invoice in English.
 */
export function generateEnglishNarration(invoice: Invoice): string {
  const summary = calculateInvoiceSummary(invoice);
  const currencyConfig = getCurrencyConfig(invoice.currency);
  const unit = currencyConfig.narrationUnit;

  const businessName = invoice.business.name.trim() || 'the issuing company';
  const clientName = invoice.client.name.trim() || 'the client';
  const invNumber = invoice.invoiceNumber.trim() || 'draft';

  let script = `Invoice number ${invNumber}, issued by ${businessName} to ${clientName}. `;

  if (invoice.items && invoice.items.length > 0) {
    const validItems = invoice.items.filter(i => i.name && i.name.trim());
    if (validItems.length === 1) {
      const item = validItems[0];
      const qtyWords = numberToWordsEnglish(item.quantity);
      const priceWords = numberToWordsEnglish(item.unitPrice);
      script += `The invoice contains ${item.name}, quantity ${qtyWords}, at ${priceWords} ${unit} per unit. `;
    } else if (validItems.length > 1) {
      const itemDescriptions = validItems.map(item => {
        const qtyWords = numberToWordsEnglish(item.quantity);
        const priceWords = numberToWordsEnglish(item.unitPrice);
        return `${item.name}, quantity ${qtyWords}, at ${priceWords} ${unit}`;
      });
      if (itemDescriptions.length <= 3) {
        script += `The invoice items include: ${itemDescriptions.join('; and ')}. `;
      } else {
        script += `The invoice contains ${numberToWordsEnglish(validItems.length)} items, including ${itemDescriptions[0]} and ${itemDescriptions[1]}. `;
      }
    }
  }

  const subtotalWords = numberToWordsEnglish(Math.round(summary.subtotal));
  script += `The subtotal is ${subtotalWords} ${unit}. `;

  if (summary.discountAmount > 0) {
    const discountWords = numberToWordsEnglish(Math.round(summary.discountAmount));
    script += `A discount of ${discountWords} ${unit} has been applied. `;
  }

  if (summary.totalTax > 0) {
    const taxWords = numberToWordsEnglish(Math.round(summary.totalTax));
    if (invoice.taxMode === 'cgst_sgst') {
      const cgstWords = numberToWordsEnglish(Math.round(summary.cgstAmount));
      const sgstWords = numberToWordsEnglish(Math.round(summary.sgstAmount));
      script += `Applicable taxes include CGST of ${cgstWords} ${unit} and SGST of ${sgstWords} ${unit}, totaling ${taxWords} ${unit}. `;
    } else {
      script += `The applicable tax amounts to ${taxWords} ${unit}. `;
    }
  }

  const grandTotalWords = numberToWordsEnglish(Math.round(summary.grandTotal));
  script += `The grand total is ${grandTotalWords} ${unit}. `;

  if (summary.amountPaid > 0) {
    const paidWords = numberToWordsEnglish(Math.round(summary.amountPaid));
    script += `${paidWords} ${unit} has been paid. `;
    if (summary.amountDue > 0) {
      const dueWords = numberToWordsEnglish(Math.round(summary.amountDue));
      script += `The remaining balance due is ${dueWords} ${unit}. `;
    } else {
      script += `This invoice has been fully paid. `;
    }
  }

  if (invoice.dueDate && summary.amountDue > 0) {
    const spokenDue = formatDateSpokenEnglish(invoice.dueDate);
    script += `Payment is due on ${spokenDue}.`;
  }

  return script;
}

/**
 * Builds the narration script for an invoice in Hindi.
 */
export function generateHindiNarration(invoice: Invoice): string {
  const summary = calculateInvoiceSummary(invoice);
  const businessName = invoice.business.name.trim() || 'कंपनी';
  const clientName = invoice.client.name.trim() || 'ग्राहक';
  const invNumber = invoice.invoiceNumber.trim() || 'ड्राफ्ट';

  let script = `चालान संख्या ${invNumber}, ${businessName} द्वारा ${clientName} को जारी किया गया है। `;

  if (invoice.items && invoice.items.length > 0) {
    const validItems = invoice.items.filter(i => i.name && i.name.trim());
    if (validItems.length > 0) {
      const first = validItems[0];
      script += `इसमें ${first.name}, मात्रा ${numberToWordsHindi(first.quantity)}, दर ${numberToWordsHindi(first.unitPrice)} रुपये प्रति इकाई शामिल है। `;
    }
  }

  script += `उपयोग कुल योग ${numberToWordsHindi(Math.round(summary.subtotal))} रुपये है। `;

  if (summary.totalTax > 0) {
    script += `लागू कर राशि ${numberToWordsHindi(Math.round(summary.totalTax))} रुपये है। `;
  }

  script += `कुल राशि ${numberToWordsHindi(Math.round(summary.grandTotal))} रुपये है। `;

  if (summary.amountDue > 0 && invoice.dueDate) {
    const dueStr = formatDateSpokenHindi(invoice.dueDate);
    script += `भुगतान की अंतिम तिथि ${dueStr} है।`;
  } else if (summary.amountPaid >= summary.grandTotal && summary.grandTotal > 0) {
    script += `इस चालान का पूर्ण भुगतान हो चुका है।`;
  }

  return script;
}
