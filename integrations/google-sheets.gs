// Add this script in Extensions > Apps Script in the destination spreadsheet.
// Set Script Properties: SYNEOLAB_SECRET and SPREADSHEET_ID.
// Deploy as a Web app, execute as yourself, access: Anyone.
// Requests are authenticated with the server-only shared secret below.
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const props = PropertiesService.getScriptProperties();
    const body = JSON.parse(e.postData.contents);
    if (!props.getProperty('SYNEOLAB_SECRET') || body.secret !== props.getProperty('SYNEOLAB_SECRET')) {
      return response({ok:false,error:'Unauthorized'});
    }
    lock.waitLock(30000);
    const book = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
    const sheet = book.getSheetByName('Syneolab Leads') || book.insertSheet('Syneolab Leads');
    const headers = ['Lead ID','Name','Company','Email','Phone','Value','Stage','Follow up','Notes','Updated UTC'];
    if (!sheet.getLastRow()) sheet.appendRow(headers);
    const lead = body.lead;
    if (!lead || !lead.id) return response({ok:false,error:'Lead ID is required'});
    const safe = value => /^[=+@-]/.test(String(value || '')) ? "'" + value : String(value || '');
    const values = [lead.id,lead.title,lead.company,lead.email,lead.phone,Number(lead.value)||0,lead.stage,lead.followup,lead.description,new Date().toISOString()].map(safe);
    const ids = sheet.getLastRow()>1 ? sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues().flat() : [];
    const index = ids.indexOf(lead.id);
    const row = index<0 ? sheet.getLastRow()+1 : index+2;
    sheet.getRange(row,1,1,headers.length).setValues([values]);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#145c40').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    return response({ok:true});
  } catch (error) { return response({ok:false,error:'Unable to update spreadsheet'}); }
  finally { if(lock.hasLock()) lock.releaseLock(); }
}
function response(body) { return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON); }
