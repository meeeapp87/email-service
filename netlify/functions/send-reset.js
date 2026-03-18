import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, token } = JSON.parse(event.body || '{}');

    if (!email || !token) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'email and token are required',
        }),
      };
    }

    const resetUrl = `https://darkfit.netlify.app/reset-password?token=${encodeURIComponent(
      token
    )}`;

    await resend.emails.send({
      from: 'DarkFit <noreply@send.darkfit>', // غيّرها للإيميل من الدومين اللي فعلته في Resend
      to: email,
      subject: 'إعادة تعيين كلمة المرور - DarkFit',
      html: `
        <p>مرحباً،</p>
        <p>اضغط على الرابط التالي لإعادة تعيين كلمة المرور:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>إذا لم تطلب إعادة تعيين، يمكنك تجاهل هذه الرسالة.</p>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.message || 'Failed to send email',
      }),
    };
  }
}
