import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON and urlencoded request bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Google Site Verification Route
  app.get("/googlec25894882109dde6.html", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send("google-site-verification: googlec25894882109dde6.html");
  });

  // API Route: Send OTP Email
  app.post("/api/send-otp", async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ success: false, error: "이메일 주소와 인증번호가 누락되었습니다." });
      return;
    }

    if (email.trim().toLowerCase() !== "25jeongsonglee@dgmeister.hs.kr") {
      res.status(403).json({ success: false, error: "대표관리자 계정만 OTP 메일링 서비스를 이용할 수 있습니다." });
      return;
    }

    // SMTP credentials helper with multiple fallbacks
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

    // Guard checking if credentials are configured
    if (!smtpUser || !smtpPass) {
      console.warn("SMTP credentials are not configured in system environment. Sending mock-assisted OTP flow.");
      // Return details informing the client about missing config, but providing the code for preview robustness
      res.json({
        success: false,
        error: "SMTP_NOT_CONFIGURED",
        message: "SMTP 서버 로그인 자격 증명(.env)이 설정되지 않았습니다. 메일 발송 시뮬레이션 모드로 작동합니다.",
        code: code
      });
      return;
    }

    try {
      // Configuration for SMTP transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for 587/other ports
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      // Craft polished email template
      const mailOptions = {
        from: `"월간 사람책 플랫폼" <${smtpUser}>`,
        to: email,
        subject: "[월간 사람책] 대표관리자 1회용 로그인 인증번호",
        html: `
          <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #1e3a5f; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">대구일마이스터고 사람책 신문</h2>
              <span style="font-size: 11px; color: #64748b; font-weight: 500;">마스터 최고 기획자 인증 매니저</span>
            </div>
            
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">안녕하세요, <strong>정송이 대표관리자님</strong>.</p>
            <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
              본인 인증 및 관리자 패널 활성화를 완료하기 위해 아래의 1회용 인증번호(OTP)를 기입 필드에 입력해 주십시오.
            </p>
            
            <div style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 6px; text-align: center; margin: 24px 0; padding: 20px; background-color: #f0fdf4; color: #15803d; border-radius: 12px; border: 2px dashed #bbf7d0;">
              ${code}
            </div>
            
            <p style="font-size: 11px; color: #ef4444; font-weight: 600; line-height: 1.6; margin: 0 0 8px; text-align: center;">
              ⚠️ 이 인증번호는 5분간만 유효합니다. 보안을 위해 타인에게 절대로 노출하지 마세요.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 10.5px; color: #94a3b8; text-align: center; margin: 0;">
              본 메일은 수신전용이며 회신되지 않습니다.<br />
              © 대구일마이스터고등학교 월간 사람책 플랫폼
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "대표관리자 주소로 1회용 보안 인증 메일이 발송되었습니다." });
    } catch (err: any) {
      console.error("Nodemailer mail transmission error:", err);
      res.status(500).json({
        success: false,
        error: "SMTP_TRANSMISSION_ERROR",
        message: `SMTP 메일 전송 도중 에러가 발생했습니다: ${err.message}`,
        code: code
      });
    }
  });

  // API Route: Download Desktop Shortcut (.url file) with active custom icon binding
  app.get("/api/download-shortcut", (req, res) => {
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const origin = `${protocol}://${host}`;

    // Standard Windows Internet Shortcut (.url) INI format 
    const urlContent = `[InternetShortcut]\r\nURL=${origin}\r\nIDList=\r\nIconIndex=0\r\nIconFile=${origin}/favicon.ico\r\n`;

    const filename = "월간_사람책_바로가기.url";
    const encodedFilename = encodeURIComponent(filename);
    
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodedFilename}`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(urlContent);
  });

  // API Route: check configurations
  app.get("/api/config-status", (req, res) => {
    res.json({
      smtpConfigured: !!(process.env.SMTP_USER || process.env.GMAIL_USER),
      host: process.env.SMTP_HOST || "smtp.gmail.com"
    });
  });

  // Serve Vite in development, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
