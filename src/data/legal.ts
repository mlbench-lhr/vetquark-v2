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
