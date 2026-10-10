# Plano de correção e reformulação dos insights de IA

**Estado:** em execução
**Origem:** solicitação do autor em 2026-10-01
**Escopo:** somente geração, validação, contingência e apresentação de insights interpretativos. Métricas oficiais, dashboards e análise automática de materiais permanecem fora desta alteração.

## Diagnóstico confirmado

- A interface chama rotas `POST` no servidor, que montam um DTO de métricas e sessões, consultam credenciais cifradas por conta e percorrem a fila de provedores.
- O banco atual possui somente Groq ativo para `diego.alves`; Gemini não está configurado no banco nem no ambiente.
- A chave Groq e o modelo `openai/gpt-oss-20b` respondem a uma solicitação estruturada pequena.
- O DTO real do Dashboard possui cerca de 15,7 mil caracteres. A requisição observada solicitou 6.246 tokens e recebeu HTTP 429 porque o limite da conta era 8.000 tokens por minuto e já havia 2.066 tokens consumidos.
- Após a falha, o bloqueio temporário retira o único provedor da fila; a chamada seguinte aparece como `SEM_CHAVE`, embora a chave continue salva.
- O tratamento atual não preserva detalhes suficientes para distinguir modelo inválido, requisição inválida, rede e resposta malformada.

## Fases

1. **Contrato e testes:** adicionar cenários de parsing, ausência de dados, poucos/muitos dados, fallback, linguagem pedagógica e compactação.
2. **Confiabilidade dos provedores:** centralizar modelos e prioridade, permitir `AI_PRIMARY_PROVIDER`, classificar erros, testar cada provedor com geração mínima e adicionar logs sanitizados somente em desenvolvimento.
3. **Contexto estruturado:** preservar métricas calculadas pelo sistema, incluir amostras e médias já calculadas e limitar descrições recentes para respeitar orçamento de entrada.
4. **Resposta humanizada:** adotar insights estruturados com observação, evidência, confiança, pergunta opcional e experimento opcional; centralizar o prompt compartilhado e validar com Zod.
5. **Contingência e interface:** produzir resposta local útil quando não houver dados ou provedores, exibir o caminho de fallback sem quebrar o Dashboard e manter chamadas exclusivamente no servidor.
6. **Verificação:** testar Groq real, testar Gemini real quando houver credencial disponível, executar testes focados, lint, tipos, build e inspeção funcional.

## Critérios de aceite

- Nenhuma chave chega ao cliente ou aparece em logs.
- Contexto vazio não dispara chamada externa.
- Groq e Gemini compartilham o mesmo contrato e prompt.
- Falha do principal tenta o secundário; falha de ambos retorna interpretação local.
- JSON puro, cercado por Markdown, incompleto, inválido e vazio têm comportamento testado.
- Insights evitam causalidade, diagnóstico e linguagem determinista e reconhecem amostra pequena.
- O Dashboard continua funcional sem acesso externo.
