// Shared branded email templates for Turkis volunteer platform.

const APP_URL = "https://gamestormers.dk/turkis-volunteers.html";

export function emailLayout(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td style="padding:40px 20px;" align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:540px;">

          <!-- Header -->
          <tr>
            <td style="background:#459A98;padding:28px 36px;">
              <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;line-height:1;">TURKIS</p>
              <p style="margin:5px 0 0;font-size:10px;font-weight:400;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.6);line-height:1;">Volunteer Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 36px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafaf8;border-top:1px solid #e8e0d8;padding:20px 36px;">
              <p style="margin:0;font-size:11px;color:#bbb;line-height:1.7;letter-spacing:0.02em;">
                Turkis · Vester Allé 15, 8000 Aarhus C<br>
                <a href="mailto:volunteers@gamestormers.dk" style="color:#bbb;text-decoration:none;">volunteers@gamestormers.dk</a>
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

export function p(text: string, muted = false): string {
  const color = muted ? "#888" : "#333";
  const size = muted ? "13px" : "15px";
  return `<p style="margin:0 0 16px;font-size:${size};color:${color};line-height:1.65;">${text}</p>`;
}

export function heading(text: string): string {
  return `<p style="margin:0 0 22px;font-size:22px;font-weight:600;color:#111;line-height:1.3;">${text}</p>`;
}

export function infoTable(rows: Array<[string, string]>): string {
  const inner = rows.map(([label, value]) => `
    <tr>
      <td style="padding:9px 20px 9px 0;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#aaa;vertical-align:top;white-space:nowrap;">${label}</td>
      <td style="padding:9px 0;font-size:14px;color:#333;vertical-align:top;line-height:1.5;">${value}</td>
    </tr>`).join("");
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin:20px 0;border-top:1px solid #f0ebe5;border-bottom:1px solid #f0ebe5;">
    ${inner}
  </table>`;
}

export function callout(content: string): string {
  return `<div style="background:#f5f3f0;border-left:3px solid #459A98;padding:14px 18px;margin:20px 0;font-size:14px;color:#444;line-height:1.65;">${content}</div>`;
}

export function button(text: string, href = APP_URL): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 4px;">
    <tr>
      <td style="background:#459A98;">
        <a href="${href}" style="display:inline-block;padding:13px 26px;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`;
}

export { APP_URL };
