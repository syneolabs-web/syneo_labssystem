/**
 * Delivers queued jobs: meeting/task/announcement emails through Gmail SMTP
 * (with native RFC-5545 iCalendar METHOD:REQUEST calendar sync for meetings)
 * and lead rows to Google Sheets.
 */

import nodemailer from 'nodemailer';
import { pendingJobs, finishJob, getLead, integrationStatus, resolveAppUrl } from './db';

const escHtml = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toIcsDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function buildGoogleCalendarUrl(body) {
  if (!body?.start || !body?.end) return '';
  const dates = `${toIcsDate(body.start)}/${toIcsDate(body.end)}`;
  const details = [
    body.description || '',
    body.link ? `\nJoin meeting: ${body.link}` : ''
  ].join('').trim();
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: body.title || 'Syneolab Meeting',
    dates,
    details,
    location: body.link || body.location || 'Google Meet'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsInvite(body, organizerEmail) {
  if (!body?.start || !body?.end) return null;
  const uid = `${body.meetingId || Date.now()}@syneolab.workspace`;
  const dtStamp = toIcsDate(new Date().toISOString());
  const dtStart = toIcsDate(body.start);
  const dtEnd = toIcsDate(body.end);
  const orgName = escapeIcsText(body.organizerName || 'Syneolab Workspace');
  const orgMail = (body.organizerEmail || organizerEmail || '').trim();
  const desc = escapeIcsText(
    [body.description || '', body.link ? `Join link: ${body.link}` : ''].filter(Boolean).join('\n\n')
  );
  const loc = escapeIcsText(body.link || body.location || 'Online');

  const attendeeLines = (body.to || []).map(
    email =>
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${escapeIcsText(email)}:mailto:${email}`
  );

  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Syneolab Workspace//Calendar//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(body.title)}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${loc}`,
    ...(body.link ? [`URL:${body.link}`] : []),
    ...(orgMail ? [`ORGANIZER;CN=${orgName}:mailto:${orgMail}`] : []),
    ...attendeeLines,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT10M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return lines.join('\r\n');
}

function formatMeetingWindow(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      month: 'MEET',
      day: '•',
      weekday: '',
      dateLine: `${startIso} – ${endIso}`,
      timeLine: '',
      durationMins: 30
    };
  }
  const month = start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = String(start.getDate());
  const weekday = start.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dateLine = start.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  const durationMins = Math.max(5, Math.round((end.getTime() - start.getTime()) / 60000));
  return {
    month,
    day,
    weekday,
    dateLine,
    timeLine: `${startTime} – ${endTime}`,
    durationMins
  };
}

async function sendEmail(body) {
  if (!body.to?.length) return;
  const user = (process.env.GMAIL_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 15000
  });
  const appUrl = resolveAppUrl() || 'http://localhost:3000';
  const isMeeting = Boolean(body.start && body.end);
  const gcalUrl = isMeeting ? buildGoogleCalendarUrl(body) : '';
  const win = isMeeting ? formatMeetingWindow(body.start, body.end) : null;
  const attendeesText = Array.isArray(body.attendeeNames) && body.attendeeNames.length
    ? body.attendeeNames.join(', ')
    : `${body.to.length} team member${body.to.length === 1 ? '' : 's'}`;

  const badgeLabel = isMeeting
    ? 'MEETING INVITATION · CALENDAR SYNC'
    : body.type === 'task_assigned'
    ? 'TASK ASSIGNMENT'
    : body.type === 'announcement'
    ? 'TEAM ANNOUNCEMENT'
    : 'WORKSPACE NOTIFICATION';

  const html = `
  <div style="background-color:#f3f6f2;padding:28px 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#203c2e;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dce6dc;box-shadow:0 8px 28px rgba(9,62,43,0.07);">
      
      <!-- Top Branded Header -->
      <div style="background:linear-gradient(135deg,#093e2b 0%,#145c40 60%,#2c8558 100%);padding:26px 28px;color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;background:#1c714e;border:2px solid #86cba4;border-radius:8px;font-weight:800;font-size:15px;color:#ffffff;margin-right:8px;vertical-align:middle;">s</span>
              <span style="font-size:18px;font-weight:700;letter-spacing:-0.4px;vertical-align:middle;color:#ffffff;">syneolab<span style="color:#86cba4;">.</span></span>
            </td>
            <td align="right">
              <span style="display:inline-block;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.24);color:#e6f2e9;font-size:10px;font-weight:700;letter-spacing:1.1px;padding:5px 11px;border-radius:20px;text-transform:uppercase;">
                ${escHtml(badgeLabel)}
              </span>
            </td>
          </tr>
        </table>
        <h1 style="margin:18px 0 4px;font-size:24px;line-height:1.25;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
          ${escHtml(body.title)}
        </h1>
        ${
          body.organizerName
            ? `<p style="margin:4px 0 0;font-size:13px;color:#c8e6d4;">Organized by <strong style="color:#ffffff;">${escHtml(body.organizerName)}</strong></p>`
            : ''
        }
      </div>

      <!-- Main Body -->
      <div style="padding:26px 28px;">
        ${
          isMeeting && win
            ? `
            <!-- Visual Date & Time Schedule Box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6faf7;border:1px solid #dfeae0;border-radius:14px;padding:16px;margin-bottom:20px;">
              <tr>
                <td width="72" valign="top" style="padding-right:16px;">
                  <div style="width:68px;background:#ffffff;border:1px solid #d4e3d6;border-radius:12px;overflow:hidden;text-align:center;box-shadow:0 2px 6px rgba(20,92,64,0.06);">
                    <div style="background:#145c40;color:#ffffff;font-size:10px;font-weight:700;letter-spacing:1px;padding:5px 0;text-transform:uppercase;">
                      ${escHtml(win.month)}
                    </div>
                    <div style="font-size:24px;font-weight:800;color:#145c40;padding:6px 0 2px;line-height:1;">
                      ${escHtml(win.day)}
                    </div>
                    <div style="font-size:10px;font-weight:600;color:#788b7d;padding-bottom:6px;">
                      ${escHtml(win.weekday)}
                    </div>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-size:15px;font-weight:700;color:#183326;margin-bottom:4px;">
                    ${escHtml(win.dateLine)}
                  </div>
                  <div style="font-size:13px;color:#3d5a49;font-weight:600;margin-bottom:8px;">
                    🕒 ${escHtml(win.timeLine)}
                    <span style="display:inline-block;background:#e6f2e9;color:#145c40;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:6px;">
                      ${win.durationMins} mins
                    </span>
                  </div>
                  <div style="font-size:12px;color:#5c7465;">
                    📍 <strong>Location:</strong> ${escHtml(body.location || 'Google Meet / Online')}
                  </div>
                  <div style="font-size:12px;color:#5c7465;margin-top:4px;">
                    👥 <strong>Invited:</strong> ${escHtml(attendeesText)}
                  </div>
                </td>
              </tr>
            </table>
            `
            : ''
        }

        ${
          body.type === 'task_assigned'
            ? `
            <div style="margin-bottom:16px;">
              <span style="display:inline-block;background:#e6f2e9;color:#145c40;font-size:12px;font-weight:700;padding:4px 10px;border-radius:12px;margin-right:6px;">
                Priority: ${escHtml(body.priority || 'Medium')}
              </span>
              <span style="display:inline-block;background:#f3f6f2;color:#203c2e;font-size:12px;font-weight:600;padding:4px 10px;border-radius:12px;margin-right:6px;">
                Status: ${escHtml(body.status || 'To do')}
              </span>
              ${
                body.due
                  ? `<span style="display:inline-block;background:#fbf2d9;color:#7d5b10;font-size:12px;font-weight:700;padding:4px 10px;border-radius:12px;">Due: ${escHtml(body.due)}</span>`
                  : ''
              }
            </div>
            `
            : ''
        }

        ${
          body.description
            ? `
            <div style="margin:0 0 22px;padding:15px 18px;background:#f9fbf9;border-left:4px solid #1c714e;border-radius:6px 12px 12px 6px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#788b7d;margin-bottom:6px;">
                ${isMeeting ? 'Agenda & Notes' : 'Details'}
              </div>
              <div style="white-space:pre-wrap;font-size:14px;line-height:1.55;color:#203c2e;">${escHtml(body.description)}</div>
            </div>
            `
            : ''
        }

        ${
          isMeeting && body.link
            ? `
            <div style="margin:0 0 20px;padding:12px 14px;background:#eef6f0;border:1px dashed #9fc5ae;border-radius:10px;font-size:12px;color:#203c2e;">
              <strong>Video Meeting Link:</strong>
              <a href="${escHtml(body.link)}" style="color:#145c40;font-weight:600;word-break:break-all;margin-left:4px;">${escHtml(body.link)}</a>
            </div>
            `
            : ''
        }

        <!-- Action CTA Buttons -->
        <div style="margin-top:22px;">
          ${
            body.link
              ? `<a href="${escHtml(body.link)}" style="display:inline-block;background:#145c40;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:24px;font-weight:700;font-size:13px;margin:0 10px 10px 0;box-shadow:0 3px 10px rgba(20,92,64,0.22);">
                  ${isMeeting ? 'Join Meeting ↗' : 'View Details ↗'}
                </a>`
              : ''
          }
          ${
            gcalUrl
              ? `<a href="${escHtml(gcalUrl)}" style="display:inline-block;background:#e6f2e9;color:#145c40;border:1px solid #9fc5ae;text-decoration:none;padding:11px 18px;border-radius:24px;font-weight:700;font-size:13px;margin:0 10px 10px 0;">
                  + Add to Google Calendar ↗
                </a>`
              : ''
          }
          ${
            appUrl
              ? `<a href="${escHtml(appUrl)}" style="display:inline-block;background:#ffffff;color:#203c2e;border:1px solid #d4e0d5;text-decoration:none;padding:11px 18px;border-radius:24px;font-weight:600;font-size:13px;margin:0 0 10px 0;">
                  Open Workspace ↗
                </a>`
              : ''
          }
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f6faf7;border-top:1px solid #e4ede5;padding:14px 28px;font-size:11px;color:#788b7d;text-align:center;">
        ${
          isMeeting
            ? 'A Google Calendar / iCalendar (.ics) invitation is attached so this meeting syncs automatically with your calendar.'
            : 'Sent from your Syneolab Workspace.'
        }
      </div>
    </div>
  </div>`;

  const mailOptions = {
    from: `"Syneolab Workspace" <${user}>`,
    to: body.to,
    subject: isMeeting ? `Invitation: ${body.title} (@ ${win?.dateLine || body.start})` : `Syneolab · ${body.title}`,
    text: body.text,
    html
  };

  if (isMeeting) {
    const ics = buildIcsInvite(body, user);
    if (ics) {
      mailOptions.icalEvent = {
        filename: 'invite.ics',
        method: 'REQUEST',
        content: ics
      };
    }
  }

  await transport.sendMail(mailOptions);
}

async function sendLead(body) {
  // Always send the lead's current contents, including when retrying an older job.
  const lead = await getLead(body.id);
  if (!lead) return;
  const res = await fetch(process.env.GOOGLE_SHEETS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.GOOGLE_SHEETS_SECRET, lead }),
    signal: AbortSignal.timeout(20000)
  });
  const result = await res.json();
  if (!result.ok) throw new Error('Sheets endpoint did not confirm update');
}

export async function processJobs() {
  const configured = integrationStatus();
  for (const job of await pendingJobs()) {
    const ready = job.kind === 'email' ? configured.gmail : configured.sheets;
    if (!ready) {
      await finishJob(job._id, 'waiting');
      continue;
    }
    try {
      if (job.kind === 'email') await sendEmail(job.body);
      else await sendLead(job.body);
      await finishJob(job._id, 'sent');
    } catch (e) {
      console.error(`Delivery of ${job.kind} job ${job._id} failed:`, e.message);
      await finishJob(job._id, 'failed', 'Delivery failed. Verify server configuration and retry.');
    }
  }
}
