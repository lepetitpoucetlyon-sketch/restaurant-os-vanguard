// TODO: Set RESEND_API_KEY in .env (see .env.example for the key name)
// TODO: Install resend if not present: npm install resend

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@restaurant-os.app';

interface ConfirmPayload {
    to: string;
    name: string;
    date: string;
    time: string;
    covers: number;
    restaurantName: string;
}

function buildHtml({ name, date, time, covers, restaurantName }: ConfirmPayload): string {
    const formattedDate = (() => {
        try {
            return new Date(date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return date;
        }
    })();

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmation de réservation — ${restaurantName}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0"
          style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:24px;overflow:hidden;max-width:580px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:48px 48px 32px;text-align:center;border-bottom:1px solid #2a2a2a;">
              <div style="display:inline-block;background:#c5a059;border-radius:16px;padding:12px 24px;margin-bottom:24px;">
                <span style="color:#0d0d0d;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;">
                  ${restaurantName}
                </span>
              </div>
              <h1 style="color:#fff;font-size:28px;font-weight:400;margin:0;font-style:italic;letter-spacing:-0.02em;">
                Réservation Confirmée
              </h1>
              <p style="color:#888;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:12px 0 0;">
                Numéro de dossier : <span style="color:#c5a059;">${'RES-' + Date.now().toString(36).toUpperCase()}</span>
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <p style="color:#ccc;font-size:16px;margin:0 0 32px;line-height:1.6;">
                Cher(e) <strong style="color:#fff;">${name}</strong>,
              </p>
              <p style="color:#999;font-size:14px;margin:0 0 40px;line-height:1.7;">
                Nous avons le plaisir de confirmer votre réservation au
                <strong style="color:#c5a059;">${restaurantName}</strong>.
                Nous nous réjouissons de vous accueillir.
              </p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#111;border:1px solid #2a2a2a;border-radius:16px;margin-bottom:40px;">
                <tr>
                  <td style="padding:32px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 0 20px;">
                          <p style="color:#666;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 6px;">Date</p>
                          <p style="color:#fff;font-size:16px;font-style:italic;margin:0;">${formattedDate}</p>
                        </td>
                        <td style="padding:0 0 20px;text-align:right;">
                          <p style="color:#666;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 6px;">Heure</p>
                          <p style="color:#c5a059;font-size:22px;font-family:monospace;font-weight:700;margin:0;">${time}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top:1px solid #2a2a2a;padding-top:20px;" colspan="2">
                          <p style="color:#666;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 6px;">Nombre de couverts</p>
                          <p style="color:#fff;font-size:16px;margin:0;">
                            <strong style="color:#c5a059;">${covers}</strong> personne${covers > 1 ? 's' : ''}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Cancel link placeholder -->
              <p style="color:#555;font-size:12px;text-align:center;line-height:1.6;margin:0 0 8px;">
                Vous souhaitez annuler ou modifier votre réservation ?
              </p>
              <p style="text-align:center;margin:0 0 40px;">
                <!-- TODO: Replace with real cancellation URL from your booking system -->
                <a href="#cancel-placeholder"
                   style="color:#c5a059;font-size:12px;letter-spacing:0.1em;text-decoration:none;border-bottom:1px solid #c5a059;padding-bottom:2px;">
                  Annuler ma réservation
                </a>
              </p>

              <p style="color:#999;font-size:13px;line-height:1.7;margin:0;">
                En cas de question, n'hésitez pas à nous contacter directement.
                Nous vous souhaitons une excellente soirée.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111;padding:24px 48px;border-top:1px solid #2a2a2a;text-align:center;">
              <p style="color:#444;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:0;">
                &copy; ${new Date().getFullYear()} ${restaurantName} — Restaurant OS
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = (await request.json()) as Partial<ConfirmPayload>;

        const { to, name, date, time, covers, restaurantName } = body;

        if (!to || !name || !date || !time || !covers || !restaurantName) {
            return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
        }

        const payload: ConfirmPayload = { to, name, date, time, covers, restaurantName };

        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `Confirmation — ${restaurantName} — ${date} à ${time}`,
            html: buildHtml(payload),
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur interne';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
