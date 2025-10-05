const generateAlertEmail = (data) => {
  const { userName, alertName, reports, sponsoredContent, alertCreatedAt } = data;

  // Helper to format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Generate report items HTML
  const reportItems = reports.map((report, index) => `
    <div style="background: #f8f9fa; padding: 20px; margin-bottom: 16px; border-radius: 8px; border-left: 4px solid #1a73e8;">
      <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
        ${index + 1}. ${report.title}
      </h3>

      <p style="color: #4b5563; margin: 0 0 16px 0; line-height: 1.6;">
        ${report.summary}
      </p>

      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
          Key Points:
        </h4>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
          ${report.keyPoints.map(point => `<li style="margin-bottom: 4px;">${point}</li>`).join('')}
        </ul>
      </div>

      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px; font-size: 14px;">
        <span style="color: #6b7280;">
          <strong>Relevance:</strong>
          ${generateScoreVisual(report.relevanceScore)}
        </span>
        <span style="color: #6b7280;">
          <strong>Sentiment:</strong>
          <span style="color: ${getSentimentColor(report.sentiment)};">${report.sentiment}</span>
        </span>
        <span style="color: #6b7280;">
          <strong>Urgency:</strong>
          <span style="color: ${getUrgencyColor(report.urgency)};">${report.urgency}</span>
        </span>
      </div>

      <a href="${process.env.SITE_URL}/${report.code}.html?utm_source=email&utm_medium=alert&utm_campaign=${encodeURIComponent(alertName)}"
         style="display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 500;">
        Go Deeper →
      </a>
    </div>
  `).join('');

  // Generate sponsored content if exists
  const sponsoredSection = sponsoredContent ? `
    <div style="border-top: 1px dashed #e5e7eb; padding-top: 24px; margin-top: 32px;">
      <p style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px 0;">
        Sponsored Insights
      </p>
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border: 1px solid #fcd34d;">
        <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px;">
          ${sponsoredContent.title}
        </h4>
        <p style="color: #92400e; margin: 0 0 12px 0; font-size: 14px; line-height: 1.5;">
          ${sponsoredContent.description}
        </p>
        <a href="${sponsoredContent.link}?utm_source=email&utm_medium=sponsored&utm_campaign=${encodeURIComponent(alertName)}"
           style="color: #92400e; font-weight: 500; text-decoration: underline;">
          Learn More →
        </a>
      </div>
    </div>
  ` : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${alertName} - Francisco Money Intel</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; border-spacing: 0;">
          <!-- Header -->
          <tr>
            <td style="background: white; padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 700;">
                Francisco Money Intel
              </h1>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                Your ${alertName} Intelligence Report - Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </td>
          </tr>

          <!-- Context Box -->
          <tr>
            <td style="background: white; padding: 16px 32px 0 32px;">
              <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #1e40af;">
                  <strong>You're receiving this because:</strong> You signed up for personalized reports about
                  <strong>"${alertName}"</strong> with Francisco Money Intel${alertCreatedAt ? ` on ${formatDate(alertCreatedAt)}` : ''}.
                </p>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="background: white; padding: 0 32px 32px 32px;">
              <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
                Hi ${userName},
              </p>
              <p style="color: #4b5563; margin: 0 0 32px 0; font-size: 16px; line-height: 1.5;">
                Here are this week's most relevant ${alertName} insights, analyzed and summarized by AI:
              </p>

              <!-- Reports -->
              ${reportItems}

              <!-- Sponsored Content -->
              ${sponsoredSection}

              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 40px;">
                <p style="color: #9ca3af; font-size: 14px; margin: 0 0 16px 0; text-align: center;">
                  <a href="${process.env.SITE_URL}/dashboard?utm_source=email&utm_medium=footer&utm_campaign=${encodeURIComponent(alertName)}"
                     style="color: #6b7280; text-decoration: underline;">Manage Alerts</a> |
                  <a href="${process.env.SITE_URL}/reports?utm_source=email&utm_medium=footer&utm_campaign=${encodeURIComponent(alertName)}"
                     style="color: #6b7280; text-decoration: underline;">View Past Reports</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                  © ${new Date().getFullYear()} Francisco Money Intel. All rights reserved.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Tracking Pixel -->
  <img src="${process.env.SITE_URL}/api/tracking/email-open?alertId=${data.alertId}&userId=${data.userId}"
       alt="" width="1" height="1" style="display: block; border: 0;">
</body>
</html>
  `;

  const text = generatePlainTextVersion(data);

  return { html, text };
};

// Helper functions
function generateScoreVisual(score) {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  return '●'.repeat(filled) + '○'.repeat(empty) + ` ${score}/100`;
}

function getSentimentColor(sentiment) {
  const colors = {
    positive: '#10b981',
    neutral: '#6b7280',
    negative: '#ef4444'
  };
  return colors[sentiment] || '#6b7280';
}

function getUrgencyColor(urgency) {
  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  };
  return colors[urgency] || '#6b7280';
}

function generatePlainTextVersion(data) {
  const { userName, alertName, reports, sponsoredContent, alertCreatedAt } = data;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  let text = `Francisco Money Intel
Your ${alertName} Intelligence Report - Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

You're receiving this because: You signed up for personalized reports about "${alertName}" with Francisco Money Intel${alertCreatedAt ? ` on ${formatDate(alertCreatedAt)}` : ''}.

Hi ${userName},

Here are this week's most relevant ${alertName} insights, analyzed and summarized by AI:

`;

  reports.forEach((report, index) => {
    text += `
${index + 1}. ${report.title}

${report.summary}

Key Points:
${report.keyPoints.map(point => `- ${point}`).join('\n')}

Relevance: ${report.relevanceScore}/100 | Sentiment: ${report.sentiment} | Urgency: ${report.urgency}

Read full analysis: ${process.env.SITE_URL}/${report.code}.html

---
`;
  });

  if (sponsoredContent) {
    text += `
SPONSORED INSIGHTS

${sponsoredContent.title}
${sponsoredContent.description}

Learn more: ${sponsoredContent.link}

---
`;
  }

  text += `
Manage your alerts: ${process.env.SITE_URL}/dashboard
View past reports: ${process.env.SITE_URL}/reports

© ${new Date().getFullYear()} Francisco Money Intel. All rights reserved.
`;

  return text;
}

module.exports = generateAlertEmail;
