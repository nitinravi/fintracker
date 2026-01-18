import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import yahooFinance from 'yahoo-finance2';

export const updateSIPPrices = onSchedule(
  {
    schedule: '0 9 * * 1-5',
    timeZone: 'Asia/Kolkata',
  },
  async (event) => {
    const db = admin.firestore();
    
    try {
      // Get all investments
      const investmentsSnapshot = await db.collectionGroup('investments').get();
      
      for (const doc of investmentsSnapshot.docs) {
        try {
          const investment = doc.data();
          
          if (investment.type === 'sip' && investment.symbol) {
            // Fetch NAV from Yahoo Finance
            const quote = await yahooFinance.quote(investment.symbol);
            
            if (quote && (quote as any).regularMarketPrice) {
              const nav = (quote as any).regularMarketPrice;
              const units = investment.units || 0;
              const currentValue = nav * units;
              
              await doc.ref.update({
                nav,
                currentValue,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
              });
              
              console.log(`Updated ${investment.name}: NAV=${nav}, Value=${currentValue}`);
            }
          } else if (investment.type === 'stock' && investment.symbol) {
            // Fetch stock price
            const quote = await yahooFinance.quote(investment.symbol);
            
            if (quote && (quote as any).regularMarketPrice) {
              const price = (quote as any).regularMarketPrice;
              const units = investment.units || 0;
              const currentValue = price * units;
              
              await doc.ref.update({
                nav: price,
                currentValue,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
              });
              
              console.log(`Updated ${investment.name}: Price=${price}, Value=${currentValue}`);
            }
          }
        } catch (error) {
          console.error(`Error updating investment ${doc.id}:`, error);
        }
      }
      
      return;
    } catch (error) {
      console.error('Error in updateSIPs:', error);
      throw error;
    }
  }
);
