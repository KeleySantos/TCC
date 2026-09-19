# Registro de riscos

| ID | Risco | Prob. | Impacto | Mitigação | Gatilho |
|---|---|---:|---:|---|---|
| R-01 | Apresentar associação como causalidade | Alta | Alto | Linguagem condicionada, nível de evidência e explicação obrigatória | Texto afirmar que um formato “faz” o aluno aprender |
| R-02 | Personalização com poucos dados | Alta | Alto | Estado de dados insuficientes e recomendação de exploração | Melhor formato indicado com menos de 2 evidências |
| R-03 | Comparar avaliações não equivalentes | Média | Alto | Quizzes de mesmo tópico, limite explícito e cenários sintéticos controlados | Comparação entre tópicos/instrumentos distintos |
| R-04 | Escopo excessivo | Alta | Alto | MVP local, sem integrações externas ou dados reais | Funcionalidade não rastreável ao MVP |
| R-05 | Exposição de dados pessoais ou acesso horizontal | Baixa | Alto | Somente dados sintéticos; propriedade direta validada no servidor | Dado real no repositório ou seed; conta acessa recurso de outra conta |
| R-06 | Cálculo analítico incorreto | Média | Alto | Funções puras, casos de referência e testes | Divergência de cenário esperado |
| R-07 | Fonte externa indisponível durante demo | Média | Médio | Recursos descritivos internos no seed | Fluxo depender de URL externa |
| R-08 | Credenciais sintéticas confundidas com segurança de produção | Média | Alto | Hash de senha, validação no servidor, contas declaradamente fictícias e sem uso público | Implantar a versão local com dados reais ou senhas reutilizadas |
| R-09 | Índice ou referências de IA divergirem após movimentos | Média | Médio | Fonte única por assunto; atualização conjunta do índice e referências; verificação de links e caminhos antes de concluir | Documento movido, renomeado ou duplicado sem atualização de `AiFiles/INDICE.md` |
| R-10 | Migração de papéis legados deixar rota, dado ou permissão incoerente com conta pessoal única | Alta | Alto | Migração aditiva, retirada completa das rotas por papel do fluxo e testes de propriedade entre contas | Rota por papel permanece acessível ou estrutura legada é removida antes de conferir dados sintéticos |
| R-11 | Gemini inventar dados, linguagem causal ou se tornar dependência da demonstração | Média | Alto | Métricas determinísticas, DTO agregado sem identificadores, schema, filtro de linguagem, limite de sete segundos, cota local e resposta local | Painel falhar sem chave/rede; saída extrapolar métricas, amostra, período ou limitação |
| R-12 | Migração para módulos perder ou tornar órfãs sessões e tentativas existentes | Média | Alto | Migração aditiva, backup do banco sintético, conferência de contagens e reset completo antes de restringir chaves | Contagens ou notas divergirem após ligar tópicos e proprietários |
| R-13 | Runtime Node incompatível impedir a instalação do driver SQLite nativo | Média | Médio | Usar Node.js 22.23.2 e `better-sqlite3` 12.x, compatível com o adaptador Prisma; manter lockfile atualizado | Instalação tenta compilar `better-sqlite3` ou exige Visual Studio C++ no ambiente local |
| R-14 | Arquivo local expor conteúdo ou ficar órfão após falha | Média | Alto | Diretório fora de `public/`, chave UUID, lista positiva, MIME/assinatura/limite, rota autenticada e remoção compensatória após falha de metadados | Arquivo acessível por URL estática, metadado sem conteúdo físico ou conteúdo sem metadado |
| R-15 | Comparação de desafio ser entendida como efeito causal do método | Alta | Alto | Vínculo explícito, contexto idêntico de módulo e método, exposições únicas, mínimo de duas evidências em cada grupo e linguagem observacional com limitação | Interface ou interpretação afirmar que o desafio, método ou Bloom causou melhora |
