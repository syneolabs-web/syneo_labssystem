// Google Calendar + Auto Google Meet Link Generator for Syneolab Workspace
// Works out-of-the-box with built-in CalendarApp, and also auto-generates
// a Google Meet link (meet.google.com/...) if "Google Calendar API" is added under Services (+).

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const body = JSON.parse(e.postData.contents);
    const expectedSecret = props.getProperty('SYNEOLAB_SECRET');
    if (expectedSecret && body.secret !== expectedSecret) {
      return json({ ok: false, error: 'Unauthorized' });
    }

    const attendeeEmails = Array.isArray(body.attendees)
      ? body.attendees.filter(Boolean).map(email => String(email).trim())
      : [];

    // Mode 1: If Advanced "Google Calendar API" service is enabled under Services (+),
    // create the calendar event AND auto-generate a real Google Meet room (meet.google.com/...).
    if (typeof Calendar !== 'undefined' && Calendar.Events) {
      const eventResource = {
        summary: body.title || 'Syneolab Meeting',
        description: body.description || '',
        location: body.location || 'Google Meet',
        start: { dateTime: new Date(body.start).toISOString() },
        end: { dateTime: new Date(body.end).toISOString() },
        attendees: attendeeEmails.map(email => ({ email: email })),
        conferenceData: {
          createRequest: {
            requestId: String(body.id || Utilities.getUuid()),
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      };

      const created = Calendar.Events.insert(eventResource, 'primary', {
        conferenceDataVersion: 1,
        sendUpdates: 'all'
      });

      const meetLink =
        created.hangoutLink ||
        (created.conferenceData &&
          created.conferenceData.entryPoints &&
          created.conferenceData.entryPoints[0] &&
          created.conferenceData.entryPoints[0].uri) ||
        '';

      return json({
        ok: true,
        mode: 'advanced_meet',
        meetLink: meetLink,
        eventUrl: created.htmlLink || ''
      });
    }

    // Mode 2: Built-in CalendarApp fallback (works without enabling Services (+))
    const cal = CalendarApp.getDefaultCalendar();
    const event = cal.createEvent(
      body.title || 'Syneolab Meeting',
      new Date(body.start),
      new Date(body.end),
      {
        description: body.description || '',
        location: body.location || 'Google Meet',
        guests: attendeeEmails.join(','),
        sendInvites: true
      }
    );

    return json({
      ok: true,
      mode: 'calendar_app',
      meetLink: '',
      eventId: event.getId()
    });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
