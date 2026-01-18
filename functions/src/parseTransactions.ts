// Version 2.0 - Gmail API enabled
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';

admin.initializeApp();

// Define secrets (set via Firebase Console or CLI)
const gmailClientId = defineSecret('GMAIL_CLIENT_ID');
const gmailClientSecret = defineSecret('GMAIL_CLIENT_SECRET');
const geminiApiKey = defineSecret('GEMINI_API_KEY');

interface ParsedTransaction {
  date: string;
  amount: number;
  type: 'debit' | 'credit';
  merchant: string;
  category: string;
  accountId?: string;
}

export const parseTransactions = onDocumentCreated(
  {
    document: 'users/{userId}/gmailSync/trigger',
    secrets: [gmailClientId, gmailClientSecret, geminiApiKey],
  },
  async (event) => {
    console.log('🚀 parseTransactions function started!');
    
    const snap = event.data;
    if (!snap) {
      console.log('❌ No snap data');
      return;
    }
    
    const userId = event.params.userId;
    console.log(`👤 Processing for user: ${userId}`);
    
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const db = admin.firestore();
    
    try {
      // Get user's Gmail token from Firestore
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData?.gmailToken) {
        console.error('No Gmail token found for user:', userId);
        return;
      }

      // Initialize Gmail API
      const oauth2Client = new google.auth.OAuth2(
        gmailClientId.value(),
        gmailClientSecret.value()
      );
      
      oauth2Client.setCredentials({
        access_token: userData.gmailToken,
        refresh_token: userData.gmailRefreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Fetch only NEW bank emails from last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const dateFilter = `after:${Math.floor(oneDayAgo.getTime() / 1000)}`;
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: `is:unread ${dateFilter} (subject:"debited" OR subject:"credited" OR subject:"transaction" OR from:"alerts" OR from:"noreply")`,
        maxResults: 50,
      });

      if (!response.data.messages || response.data.messages.length === 0) {
        console.log('✅ No new bank emails found in last 24 hours');
        return;
      }
      
      console.log(`📧 Found ${response.data.messages.length} new bank email(s) to process`);

      // Get user accounts for matching
      const accountsSnapshot = await db.collection(`users/${userId}/accounts`).get();
      const accounts = accountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

      // Process each email
      for (const message of response.data.messages) {
        try {
          const messageData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full',
          });

          const payload = messageData.data.payload;
          const subject = payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const from = payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown';
          
          console.log(`📬 Processing email - From: ${from}, Subject: ${subject}`);
          
          let emailBody = '';

          // Extract email body from different MIME types
          if (payload?.body?.data) {
            emailBody = Buffer.from(payload.body.data, 'base64').toString('utf-8');
          } else if (payload?.parts) {
            // Try text/plain first
            for (const part of payload.parts) {
              if (part.body?.data && part.mimeType === 'text/plain') {
                emailBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
                break;
              }
            }
            
            // If no text/plain found, try text/html
            if (!emailBody) {
              for (const part of payload.parts) {
                if (part.body?.data && part.mimeType === 'text/html') {
                  emailBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
                  console.log('📧 Using HTML body');
                  break;
                }
              }
            }
            
            // Also check nested parts (multipart emails)
            if (!emailBody && payload.parts) {
              for (const part of payload.parts) {
                if (part.parts) {
                  for (const nestedPart of part.parts) {
                    if (nestedPart.body?.data) {
                      if (nestedPart.mimeType === 'text/plain' || nestedPart.mimeType === 'text/html') {
                        emailBody = Buffer.from(nestedPart.body.data, 'base64').toString('utf-8');
                        console.log(`📧 Using nested ${nestedPart.mimeType} body`);
                        break;
                      }
                    }
                  }
                  if (emailBody) break;
                }
              }
            }
          }

          if (!emailBody || emailBody.trim().length === 0) {
            console.log('⚠️ No email body found, skipping');
            continue;
          }
          
          console.log(`📝 Email body length: ${emailBody.length} chars`);

          // Use Gemini to parse transaction
          const prompt = `Parse this Indian bank transaction SMS/email. Extract transaction details and return ONLY valid JSON (no markdown, no code blocks):
{
  "date": "DD-MM-YYYY",
  "amount": 1250.00,
  "type": "debit" or "credit",
  "merchant": "Merchant name",
  "category": "food" or "shopping" or "transport" or "bills" or "entertainment" or "healthcare" or "education" or "other"
}

Email content:
${emailBody.substring(0, 2000)}

Available accounts: ${accounts.map((a: any) => `${a.name} (${a.bank})`).join(', ')}

Match the transaction to the most likely account based on bank name in email. Return JSON only.`;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          
          // Extract JSON from response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.error('No JSON found in Gemini response:', responseText);
            continue;
          }

          const parsed: ParsedTransaction = JSON.parse(jsonMatch[0]);
          
          console.log(`💰 Parsed transaction: ${parsed.merchant} - ₹${parsed.amount} (${parsed.type})`);

          // Match to account
          let matchedAccountId: string | undefined;
          for (const account of accounts) {
            const accountBank = (account as any).bank?.toLowerCase() || '';
            if (emailBody.toLowerCase().includes(accountBank)) {
              matchedAccountId = (account as any).id;
              break;
            }
          }

          if (!matchedAccountId && accounts.length > 0) {
            matchedAccountId = (accounts[0] as any).id;
          }
          
          // If no accounts exist, create a default account
          if (accounts.length === 0) {
            console.log('⚠️ No accounts found, creating default account...');
            const defaultAccountRef = db.collection(`users/${userId}/accounts`).doc();
            await defaultAccountRef.set({
              name: 'Default Account',
              bank: 'Unknown',
              type: 'savings',
              balance: 0,
              currency: 'INR',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            matchedAccountId = defaultAccountRef.id;
            console.log(`✅ Created default account: ${matchedAccountId}`);
          }
          
          const matchedAccount = accounts.find((a: any) => a.id === matchedAccountId);
          console.log(`🏦 Matched to account: ${(matchedAccount as any)?.name || 'Default Account'}`);

          // Parse date
          const [day, month, year] = parsed.date.split('-');
          const transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

          // Ensure we have a valid accountId
          if (!matchedAccountId) {
            console.error('❌ No accountId available, skipping transaction');
            continue;
          }

          // Save transaction
          await db.collection(`users/${userId}/transactions`).add({
            userId,
            accountId: matchedAccountId,
            date: admin.firestore.Timestamp.fromDate(transactionDate),
            amount: parsed.amount,
            type: parsed.type,
            merchant: parsed.merchant,
            category: parsed.category,
            source: 'gmail',
            emailId: message.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          console.log(`✅ Transaction saved: ${parsed.merchant} - ₹${parsed.amount}`);

          // Update account balance
          const accountRef = db.doc(`users/${userId}/accounts/${matchedAccountId}`);
          const accountDoc = await accountRef.get();
          const accountData = accountDoc.data();
          
          if (accountData) {
            const currentBalance = accountData.balance || 0;
            const newBalance = parsed.type === 'debit'
              ? currentBalance - parsed.amount
              : currentBalance + parsed.amount;
            
            await accountRef.update({ balance: newBalance });
            console.log(`💰 Account balance updated. New balance: ₹${newBalance}`);
          }

          // Mark email as read
          await gmail.users.messages.modify({
            userId: 'me',
            id: message.id!,
            requestBody: {
              removeLabelIds: ['UNREAD'],
            },
          });
          
          console.log(`📖 Email marked as read`);

        } catch (error) {
          console.error('❌ Error processing email:', message.id, error);
        }
      }

      // Delete trigger document
      console.log('🗑️ Deleting trigger document...');
      await snap.ref.delete();
      console.log('✅ Trigger document deleted');

    } catch (error) {
      console.error('❌ Error in parseTransactions:', error);
      // Still delete the trigger even on error
      try {
        await snap.ref.delete();
      } catch (deleteError) {
        console.error('Failed to delete trigger:', deleteError);
      }
      throw error;
    }
    
    console.log('🎉 parseTransactions completed successfully');
  }
);

// Force redeploy v2
