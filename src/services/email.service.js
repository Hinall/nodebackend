import { Resend } from "resend";

let resend;

function getResendClient() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export const sendEmail = async (to, subject, text, html) => {
  await getResendClient().emails.send({
    from: process.env.RESEND_FROM || "onboarding@resend.dev",
    to,
    subject,
    text,
    html,
  });
};

