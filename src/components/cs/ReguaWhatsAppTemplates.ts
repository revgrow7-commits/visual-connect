export const whatsappTemplates: Record<string, string> = {
  nps_survey: `Olá, [cliente.name]! 👋

Recentemente concluímos o job *[job.title]* para vocês.

Gostaríamos de saber: em uma escala de 0 a 10, quanto você recomendaria a Indústria Visual para um amigo ou colega?

Responda com um número de 0 a 10. 🙏`,

  post_delivery_follow: `Olá, [cliente.name]! 👋

Passando para saber se está tudo certo com o job *[job.title]* entregue recentemente.

Alguma dúvida ou ajuste necessário? Estamos à disposição! 😊`,

  warranty_reminder: `Olá, [cliente.name]! 🔔

O prazo de garantia do job *[job.title]* vence em 30 dias.

Aproveite para verificar se está tudo dentro do esperado.

Qualquer problema, é só nos chamar aqui! ✅`,

  reorder_nudge: `Olá, [cliente.name]! ⭐

Faz um tempo que não trabalhamos juntos e sentimos sua falta!

Temos novidades e condições especiais para clientes como vocês.

Podemos conversar sobre seu próximo projeto? 🚀`,

  churn_alert: `Olá, [cliente.name]! 👋

Notamos que faz um tempo que não nos falamos.

Gostaríamos de saber se há algo em que possamos ajudar.

Estamos sempre disponíveis para conversar! 💬`,

  anniversary: `Olá, [cliente.name]! 🎂

Hoje celebramos mais um ano de parceria juntos!

Obrigado pela confiança em nosso trabalho.

Temos condições especiais para clientes parceiros como vocês! 🎉`,

  seasonal_campaign: `Olá, [cliente.name]! 📣

Temos novidades e campanhas especiais que podem interessar!

Podemos agendar uma conversa para apresentar nossas soluções?

Responda aqui e marcamos o melhor horário! 📅`,

  complaint_resolved_check: `Olá, [cliente.name]! ✅

Passando para verificar se a resolução do job *[job.title]* ficou satisfatória.

Está tudo certo? Algo mais que possamos ajudar?

Seu feedback é muito importante para nós! 🙏`,
};

export function applyTemplate(template: string, customerName: string, jobTitle?: string): string {
  let msg = template.replace(/\[cliente\.name\]/g, customerName);
  msg = msg.replace(/\[job\.title\]/g, jobTitle || "seu projeto");
  return msg;
}
