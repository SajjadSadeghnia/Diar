import { prisma } from "@/lib/prisma";

type TelegramSendOptions = {
  parseMode?: "HTML" | "Markdown";
};

/** Send a Persian admin alert. Failures are logged and never thrown. */
export async function sendAdminTelegram(
  message: string,
  options: TelegramSendOptions = {}
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return;

  try {
    const recipients = await prisma.telegramRecipient.findMany({
      where: { active: true },
      select: { chatId: true },
    });

    if (!recipients.length) return;

    const parseMode = options.parseMode ?? "HTML";

    await Promise.all(
      recipients.map(async ({ chatId }) => {
        try {
          const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: parseMode,
            }),
          });

          if (!response.ok) {
            const body = await response.text();
            console.error(`[telegram-service] send failed for chat ${chatId}:`, body);
            return;
          }

          await prisma.telegramRecipient.updateMany({
            where: { chatId },
            data: { lastSuccessfulSendAt: new Date() },
          });
        } catch (error) {
          console.error(`[telegram-service] send error for chat ${chatId}:`, error);
        }
      })
    );
  } catch (error) {
    console.error("[telegram-service] failed to send admin telegram:", error);
  }
}
