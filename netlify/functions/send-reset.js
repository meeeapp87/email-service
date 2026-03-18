import nodemailer from "nodemailer";

export async function handler(event) {
  // ✅ CORS (لو هتستدعي من المتصفح)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  // نسمح فقط بـ POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: "Method Not Allowed",
    };
  }

  try {
    // ✅ حماية بسيطة: Bearer Token
    const auth = event.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token || token !== process.env.EMAIL_SERVICE_TOKEN) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: "Unauthorized",
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { email, code, appName } = body;

    if (!email || !code) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: "Missing email/code",
      };
    }

    // ✅ SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const fromName = appName ? String(appName) : "DarkFit";
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

    // ✅ قالب الإيميل بهوية DARKFIT
    const htmlTemplate = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0d08; color: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
        <div style="background: linear-gradient(135deg, #59f20d22, #00000000); padding: 32px 24px; text-align: center; border-bottom: 1px solid #59f20d33;">
          <h1 style="color: #59f20d; font-size: 28px; margin: 0; letter-spacing: 4px; font-weight: 900;">DARKFIT</h1>
          <p style="color: #aaa; margin: 8px 0 0; font-size: 13px; font-weight: bold; letter-spacing: 2px;">PREMIUM TRAINING</p>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <h2 style="color: #fff; font-size: 20px; margin: 0 0 12px;">إعادة تعيين كلمة المرور</h2>
          <p style="color: #aaa; font-size: 14px; margin: 0 0 28px;">
            استخدم رمز التحقق التالي لتغيير كلمة مرورك. الرمز صالح لمدة قصيرة.
          </p>
          
          <div style="background: #111; border: 1px solid #59f20d55; border-radius: 12px; padding: 20px; letter-spacing: 12px; font-size: 38px; font-weight: bold; color: #59f20d; margin-bottom: 28px;">
            ${code}
          </div>
          
          <p style="color: #666; font-size: 12px; margin: 0;">
            إذا لم تقم بطلب إعادة تعيين كلمة المرور، يُرجى تجاهل هذه الرسالة والمحافظة على أمان حسابك.
          </p>
        </div>
      </div>
    `;

    // ✅ إرسال الإيميل
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: "رمز إعادة تعيين كلمة المرور - DARKFIT",
      text: `رمز التحقق الخاص بك هو: ${code}`,
      html: htmlTemplate,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: `Server error: ${err?.message || "unknown"}`,
    };
  }
}
