export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalContent = {
  title: string;
  lastUpdated: string;
  controllerOperator: string;
  dpoEmail: string;
  address: string;
  intro: string;
  sections: LegalSection[];
};

export type LegalLanguage = "pt" | "en";

export const privacyAndTermsContent: LegalContent = {
  title: "Política de Privacidade – VetQuark",
  lastUpdated: "[preencher]",
  controllerOperator: 'Controladora/Operadora: VetQuark Lab Tecnologia em Saúde Animal Ltda. (“VetQuark”, “nós”)',
  dpoEmail: "Encarregado(a)/DPO: contato@vetquark.com",
  address: "Endereço: [inserir endereço completo]",
  intro:
    'Esta Política explica como tratamos dados pessoais de Veterinários(as), Tutores(as) e demais usuários do aplicativo VetQuark (“App”). Ao usar o App, você declara ter lido e concordado com esta Política e com os Termos de Serviço.',
  sections: [
    {
      title: "1. Papéis sob a LGPD",
      paragraphs: [
        "Para dados de conta, cobrança e suporte (p.ex., e-mail do tutor, dados de faturamento do veterinário): o VetQuark atua como Controlador.",
        "Para dados clínicos dos pacientes (pets) e laudos inseridos pelo/ pela veterinário(a): o VetQuark atua como Operador, processando tais dados em nome do(a) veterinário(a), que é o Controlador dessas informações.",
        "Em itens ligados a segurança, logs e auditoria, pode haver corresponsabilidade (controladoria conjunta) quando necessário para atender a obrigações legais ou de prevenção à fraude.",
      ],
    },
    {
      title: "2. Dados que tratamos",
      paragraphs: [],
    },
    {
      title: "2.1. Dados de Veterinários(as) (conta e operação)",
      paragraphs: [
        "Identificação: nome, e-mail, celular, CPF, CRMV/UF, clínica (se aplicável), assinatura digital/eletrônica, foto de perfil.",
        "Financeiro: preço do exame definido pelo usuário, dados de cobrança, dados bancários para repasse, histórico de transações, chargebacks, notas fiscais (quando aplicável).",
        "Uso do App: buscas, ações em telas, métricas de uso, preferências, logs de acesso (IP, dispositivo, data/hora).",
      ],
    },
    {
      title: "2.2. Dados de Tutores(as)",
      paragraphs: [
        "Identificação e contato: nome, e-mail, celular, CPF (se coletado pelo(a) veterinário(a)), endereço (quando informado pelo(a) veterinário(a)).",
        "Vínculos: pets associados e clínica/veterinário(a) responsável.",
        "Uso do App: preferências, métricas de navegação, logs.",
      ],
    },
    {
      title: "2.3. Dados de Pacientes (pets) e Exames",
      paragraphs: [
        "Dados de identificação do pet (nome, espécie, raça, sexo, idade, nº de microchip etc.).",
        "Dados de exames (parâmetros, fotos capturadas da tira reagente, tempos de leitura, notas e laudos).",
        "Metadados técnicos: data/hora da coleta, método de coleta, lote/validade das tiras, dispositivo usado.",
        "Observação: dados clínicos se referem aos animais; ainda assim, podem ser associados a pessoas (tutores). Por zelo e confidencialidade, tratamos tais dados com nível elevado de segurança.",
      ],
    },
    {
      title: "2.4. Imagens/Permissões do Dispositivo",
      paragraphs: [
        "Acesso à câmera para captura das tiras durante o exame.",
        "Acesso a arquivos quando o usuário anexa documentos.",
        "Notificações push (opt-in).",
      ],
    },
    {
      title: "2.5. Cookies e Tecnologias Similares (web)",
      paragraphs: [
        "Cookies estritamente necessários (login, sessão, segurança).",
        "Cookies de desempenho/métricas (analíticos).",
        "Você pode gerenciar preferências no navegador/dispositivo.",
      ],
    },
    {
      title: "3. Finalidades e Bases Legais (LGPD)",
      paragraphs: [
        "Criar e manter contas: cadastro, autenticação, anti-fraude. Base legal: Execução de contrato (art. 7º, V) e legítimo interesse (art. 7º, IX).",
        "Operar o exame e gerar laudos: captura de imagens, tempos, registro e assinatura. Base legal: Execução de contrato (art. 7º, V) — para o(a) vet; Operação em nome do Controlador (art. 39).",
        "Cobrança e repasse: emissão de link de pagamento, split, repasses, chargebacks. Base legal: Execução de contrato; cumprimento legal/regulatório (art. 7º, II).",
        "Atendimento e suporte: suporte técnico e clínico-administrativo ao/à vet. Base legal: Execução de contrato; legítimo interesse.",
        "Segurança e prevenção a fraudes: logs, auditoria, detecção de abusos. Base legal: Legítimo interesse; cumprimento legal.",
        "Comunicações: e-mails transacionais, push (ex.: laudo disponível). Base legal: Execução de contrato; consentimento para push promocional.",
        "Melhoria do App: métricas, testes A/B, estatísticas. Base legal: Legítimo interesse (minimização e anonimização quando possível).",
        "Obrigações legais: guarda de logs, questões fiscais. Base legal: Cumprimento de obrigação legal (art. 7º, II).",
      ],
    },
    {
      title: "4. Compartilhamento de dados",
      paragraphs: [
        "Parceiros de pagamento (p.ex., gateway/ adquirente) para processar cobranças, prevenir fraudes e tratar chargebacks.",
        "Infraestrutura de nuvem, hospedagem e e-mail para prover o App e comunicações.",
        "Ferramentas de métricas/erro (observabilidade) com dados minimizados.",
        "Autoridades públicas quando exigido por lei/ordem judicial.",
        "Auditores/assessores jurídicos em casos específicos (conformidade, disputas).",
        "Não vendemos dados pessoais. Em caso de fusão/aquisição, os dados poderão ser transferidos, mantendo-se esta Política ou equivalente.",
      ],
    },
    {
      title: "5. Transferências internacionais",
      paragraphs: [
        "Dados podem ser processados/armazenados fora do Brasil por provedores de nuvem. Adotamos mecanismos previstos na LGPD (art. 33 e seguintes), como cláusulas contratuais e avaliação de garantias de proteção.",
      ],
    },
    {
      title: "6. Retenção e descarte",
      paragraphs: [
        "Contas: enquanto ativas e pelo tempo necessário ao cumprimento de obrigações legais/contratuais.",
        "Logs de acesso: mínimo de 6 meses (conforme Marco Civil/boas práticas) ou por prazos legais maiores quando aplicável.",
        "Financeiro: prazos fiscais/contábeis (normalmente 5 anos ou conforme legislação).",
        "Exames/laudos: enquanto vinculados à conta do(a) veterinário(a) (Controlador) ou conforme instruções do Controlador e exigências legais.",
        "Ao final dos prazos, faremos eliminação, anonimização ou arquivamento seguro, conforme o caso.",
      ],
    },
    {
      title: "7. Segurança",
      paragraphs: [
        "Adotamos medidas técnicas e administrativas de segurança proporcionais ao risco, incluindo criptografia em trânsito, controle de acesso, logs/auditoria, segmentação de ambientes, backups e programa de resposta a incidentes. Nenhum sistema é 100% seguro; em caso de incidente relevante, seguiremos os protocolos de notificação previstos na LGPD.",
      ],
    },
    {
      title: "8. Direitos do Titular (LGPD)",
      paragraphs: [
        "Você (tutor, veterinário ou outro titular) pode, a qualquer tempo:",
        "Confirmar tratamento e acessar seus dados;",
        "Corrigir dados incompletos/inexatos;",
        "Anonimizar, bloquear ou eliminar dados desnecessários/excessivos;",
        "Portar dados a outro fornecedor;",
        "Revogar consentimento (quando aplicável) e informar-se sobre as consequências;",
        "Opor-se a tratamentos baseados em legítimo interesse;",
        "Revisar decisões automatizadas (se houver);",
        "Peticionar contra o Controlador perante a ANPD.",
        "Como exercer: envie solicitação ao DPO (contato@vetquark.com). Para sua segurança, poderemos pedir comprovação de identidade/informações adicionais. Prazo de resposta: até 15 dias (ou outro prazo legal aplicável).",
        "Importante: para dados clínicos inseridos pelo(a) veterinário(a) (Controlador), o VetQuark poderá encaminhar a solicitação ao/à veterinário(a) responsável, auxiliando como Operador.",
      ],
    },
    {
      title: "9. Menores de idade",
      paragraphs: [
        "O App é destinado a maiores de 18 anos. Não coletamos intencionalmente dados de menores. Se você acredita que coletamos informações de menor, contate o DPO para remoção adequada.",
      ],
    },
    {
      title: "10. Conteúdo clínico e material educativo",
      paragraphs: [
        "O App pode exibir glossários e orientações gerais (ex.: coleta domiciliar). Tais conteúdos são informativos e não substituem avaliação profissional. Não oferecemos recomendações médicas personalizadas a tutores.",
      ],
    },
    {
      title: "11. Decisões automatizadas",
      paragraphs: [
        "Recursos assistivos (ex.: timers, normalizadores, pré-preenchimento sugerido de resultados) não produzem efeitos jurídicos por si. A validação e o laudo dependem da revisão e assinatura do/da veterinário(a).",
      ],
    },
    {
      title: "12. Atualizações desta Política",
      paragraphs: [
        "Podemos atualizar esta Política para refletir mudanças legais ou de produto. Publicaremos a nova versão com data de vigência; o uso contínuo do App significa ciência da versão vigente.",
      ],
    },
    {
      title: "13. Contato do Encarregado (DPO)",
      paragraphs: [
        "E-mail: contato@vetquark.com",
        "Assunto: “Direitos LGPD – VetQuark”",
        "Conteúdo mínimo: identificação do titular, e-mail cadastrado, solicitação e, quando aplicável, comprovação de vínculo (tutor ↔ pet ↔ veterinário).",
      ],
    },
    {
      title: "14. Exemplos práticos de tratamento",
      paragraphs: [
        "Tutor recebe notificação “laudo disponível”: usamos seu e-mail/push para envio transacional (execução do contrato com o(a) veterinário(a) Controlador).",
        "Veterinário solicita saque: tratamos dados bancários e histórico de transações com o processador de pagamentos (execução de contrato/obrigação legal).",
        "Verificação pública de laudo por QR (se habilitado pela clínica): exibimos metadados do laudo estritamente necessários para autenticidade/validação, sem expor dados excessivos do tutor.",
      ],
    },
  ],
};

export const privacyAndTermsContent_en: LegalContent = {
  title: "Privacy Policy – VetQuark",
  lastUpdated: "[fill in]",
  controllerOperator: 'Controller/Processor: VetQuark Lab Animal Health Technology Ltd. (“VetQuark”, “we”)',
  dpoEmail: "Data Protection Officer (DPO): contato@vetquark.com",
  address: "Address: [insert full address]",
  intro:
    "This Policy explains how we process personal data of Veterinarians, Guardians, and other users of the VetQuark application (“App”). By using the App, you declare that you have read and agreed to this Policy and the Terms of Service.",
  sections: [
    {
      title: "1. Roles under the LGPD",
      paragraphs: [
        "For account, billing, and support data (e.g., guardian's email, veterinarian’s billing details): VetQuark acts as the Controller.",
        "For clinical data of patients (pets) and reports entered by the veterinarian: VetQuark acts as the Processor, handling such data on behalf of the veterinarian, who is the Controller of this information.",
        "For security, logs, and auditing items, there may be joint controllership when necessary to meet legal obligations or prevent fraud.",
      ],
    },
    {
      title: "2. Data we process",
      paragraphs: [],
    },
    {
      title: "2.1. Veterinarians’ data (account and operations)",
      paragraphs: [
        "Identification: name, email, mobile, CPF, CRMV/State, clinic (if applicable), digital/electronic signature, profile photo.",
        "Financial: exam price defined by the user, billing data, bank details for payouts, transaction history, chargebacks, invoices (where applicable).",
        "Use of the App: searches, actions on screens, usage metrics, preferences, access logs (IP, device, date/time).",
      ],
    },
    {
      title: "2.2. Guardians’ data",
      paragraphs: [
        "Identification and contact: name, email, mobile, CPF (if collected by the veterinarian), address (when provided by the veterinarian).",
        "Links: associated pets and responsible clinic/veterinarian.",
        "Use of the App: preferences, navigation metrics, logs.",
      ],
    },
    {
      title: "2.3. Patients (pets) and Exams",
      paragraphs: [
        "Pet identification data (name, species, breed, sex, age, microchip number, etc.).",
        "Exam data (parameters, photos captured of the reagent strip, reading times, notes and reports).",
        "Technical metadata: date/time of collection, collection method, strip lot/expiry, device used.",
        "Note: clinical data refers to animals; however, they may be associated with people (guardians). For care and confidentiality, we treat such data with a high level of security.",
      ],
    },
    {
      title: "2.4. Device Images/Permissions",
      paragraphs: [
        "Access to the camera to capture strips during the exam.",
        "Access to files when the user attaches documents.",
        "Push notifications (opt-in).",
      ],
    },
    {
      title: "2.5. Cookies and Similar Technologies (web)",
      paragraphs: [
        "Strictly necessary cookies (login, session, security).",
        "Performance/metrics cookies (analytics).",
        "You can manage preferences in your browser/device.",
      ],
    },
    {
      title: "3. Purposes and Legal Bases (LGPD)",
      paragraphs: [
        "Create and maintain accounts: registration, authentication, anti-fraud. Legal basis: Performance of a contract (art. 7, V) and legitimate interest (art. 7, IX).",
        "Operate the exam and generate reports: image capture, timing, recording and signature. Legal basis: Performance of a contract (art. 7, V) — for the veterinarian; Processing on behalf of the Controller (art. 39).",
        "Billing and payouts: issuance of payment link, split, payouts, chargebacks. Legal basis: Performance of a contract; legal/regulatory compliance (art. 7, II).",
        "Support and assistance: technical and clinical-administrative support to the veterinarian. Legal basis: Performance of a contract; legitimate interest.",
        "Security and fraud prevention: logs, auditing, abuse detection. Legal basis: Legitimate interest; legal compliance.",
        "Communications: transactional emails, push (e.g., report available). Legal basis: Performance of a contract; consent for promotional push.",
        "App improvement: metrics, A/B tests, statistics. Legal basis: Legitimate interest (minimization and anonymization where possible).",
        "Legal obligations: retention of logs, tax matters. Legal basis: Compliance with legal obligation (art. 7, II).",
      ],
    },
    {
      title: "4. Data sharing",
      paragraphs: [
        "Payment partners (e.g., gateway/acquirer) to process charges, prevent fraud, and handle chargebacks.",
        "Cloud infrastructure, hosting, and email to provide the App and communications.",
        "Metrics/error (observability) tools with minimized data.",
        "Public authorities when required by law/court order.",
        "Auditors/legal advisors in specific cases (compliance, disputes).",
        "We do not sell personal data. In the event of a merger/acquisition, data may be transferred, maintaining this Policy or an equivalent.",
      ],
    },
    {
      title: "5. International transfers",
      paragraphs: [
        "Data may be processed/stored outside Brazil by cloud providers. We adopt mechanisms provided for in the LGPD (art. 33 et seq.), such as contractual clauses and evaluation of protection guarantees.",
      ],
    },
    {
      title: "6. Retention and disposal",
      paragraphs: [
        "Accounts: while active and for as long as necessary to fulfill legal/contractual obligations.",
        "Access logs: at least 6 months (according to Marco Civil/best practices) or for longer legal periods where applicable.",
        "Financial: tax/accounting periods (usually 5 years or according to legislation).",
        "Exams/reports: while linked to the veterinarian’s account (Controller) or according to the Controller’s instructions and legal requirements.",
        "At the end of the periods, we will delete, anonymize, or securely archive, as applicable.",
      ],
    },
    {
      title: "7. Security",
      paragraphs: [
        "We adopt technical and administrative security measures proportional to risk, including encryption in transit, access control, logs/auditing, environment segmentation, backups, and an incident response program. No system is 100% secure; in the event of a relevant incident, we will follow the notification protocols provided in the LGPD.",
      ],
    },
    {
      title: "8. Data Subject Rights (LGPD)",
      paragraphs: [
        "You (guardian, veterinarian, or other data subject) may, at any time:",
        "Confirm processing and access your data;",
        "Correct incomplete/inaccurate data;",
        "Anonymize, block, or delete unnecessary/excessive data;",
        "Port data to another provider;",
        "Revoke consent (where applicable) and be informed of the consequences;",
        "Object to processing based on legitimate interest;",
        "Review automated decisions (if any);",
        "Lodge a complaint against the Controller before the ANPD.",
        "How to exercise: send a request to the DPO (contato@vetquark.com). For your security, we may request identity proof/additional information. Response time: up to 15 days (or another applicable legal period).",
        "Important: for clinical data entered by the veterinarian (Controller), VetQuark may forward the request to the responsible veterinarian, assisting as Processor.",
      ],
    },
    {
      title: "9. Minors",
      paragraphs: [
        "The App is intended for people aged 18 and over. We do not knowingly collect data from minors. If you believe we have collected information from a minor, contact the DPO for appropriate removal.",
      ],
    },
    {
      title: "10. Clinical content and educational material",
      paragraphs: [
        "The App may display glossaries and general guidelines (e.g., at-home collection). Such content is informational and does not replace professional evaluation. We do not offer personalized medical recommendations to guardians.",
      ],
    },
    {
      title: "11. Automated decisions",
      paragraphs: [
        "Assistive features (e.g., timers, normalizers, suggested pre-filling of results) do not, by themselves, produce legal effects. Validation and the report depend on review and signature by the veterinarian.",
      ],
    },
    {
      title: "12. Updates to this Policy",
      paragraphs: [
        "We may update this Policy to reflect legal or product changes. We will publish the new version with an effective date; continued use of the App indicates awareness of the current version.",
      ],
    },
    {
      title: "13. DPO contact",
      paragraphs: [
        "Email: contato@vetquark.com",
        "Subject: “LGPD Rights – VetQuark”",
        "Minimum content: data subject identification, registered email, request and, where applicable, proof of link (guardian ↔ pet ↔ veterinarian).",
      ],
    },
    {
      title: "14. Practical examples of processing",
      paragraphs: [
        "Guardian receives notification “report available”: we use your email/push for transactional sending (performance of a contract with the veterinarian Controller).",
        "Veterinarian requests withdrawal: we process bank data and transaction history with the payment processor (performance of a contract/legal obligation).",
        "Public verification of report by QR (if enabled by the clinic): we display report metadata strictly necessary for authenticity/validation, without exposing excessive guardian data.",
      ],
    },
  ],
};

export function getLegalContent(lang: LegalLanguage): LegalContent {
  return lang === "en" ? privacyAndTermsContent_en : privacyAndTermsContent;
}
