/**
 * Netixa Masterclass 2026 - Auto Email Confirmation
 * Instructions:
 * 1. Open your Google Form.
 * 2. Click the three dots (More) -> Script Editor.
 * 3. Paste this code.
 * 4. Replace the placeholders with your details.
 * 5. Click "Triggers" (Clock icon) -> Add Trigger.
 * 6. Choose "onFormSubmit" and "From form" -> "On form submit".
 */

function onFormSubmit(e) {
  try {
    const responses = e.namedValues;
    
    // Extract data based on your form column names
    const name = responses['Full Name'][0];
    const email = responses['E-mail Address'][0];
    const groupLink = "https://chat.whatsapp.com/Caq3K1c7PMVA3K2IoKP7hh";
    
    const subject = "🚀 Welcome to Netixa Masterclass 2026, " + name + "!";
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #1e0a3d; text-align: center;">NETIXA</h2>
        <h1 style="color: #b90404; text-align: center;">Reservation Initiated!</h1>
        <p>Hi <b>${name}</b>,</p>
        <p>Thank you for choosing Netixa. We've received your registration details for the 2026 Digital Career Mastery session.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <h3 style="margin-top: 0;">What's Next?</h3>
          <p>If you haven't joined the <b>Batch 56</b> group yet, please do so now to stay updated:</p>
          <a href="${groupLink}" style="background: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">JOIN WHATSAPP GROUP</a>
        </div>
        
        <p>Looking forward to seeing you inside!</p>
        <p>Best regards,<br><b>Team Netixa</b></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999; text-align: center;">Click Vesta Education | Netixa Masterclass 2026</p>
      </div>
    `;

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
    
  } catch (error) {
    Logger.log("Error sending email: " + error.toString());
  }
}
