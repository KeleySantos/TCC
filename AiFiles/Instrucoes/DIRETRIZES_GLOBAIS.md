# Diretrizes globais para agentes

## Inicialização obrigatória

Toda nova sessão começa sem agente ativo. Depois de ler este arquivo e antes de consultar o contexto funcional ou executar trabalho relevante, pergunte exatamente: **"Qual agente você deseja usar nesta sessão?"**

O isolamento é por sessão: várias sessões podem existir simultaneamente, cada uma com seu próprio agente ativo. A escolha feita em uma sessão não ativa, troca nem encerra o agente usado em outra. A única combinação proibida é manter dois agentes ativos dentro da mesma sessão.

Consulte `../Agentes/CATALOGO.md` para listar opções. Atividades estritamente necessárias para listar, selecionar, criar ou trocar agentes podem ocorrer sem agente ativo. Após a seleção:

1. carregue primeiro `AGENT.md` e depois os demais arquivos Markdown da pasta do agente;
2. mantenha exatamente um agente ativo nesta sessão, sem interferir nas demais sessões;
3. leia `../INDICE.md` e carregue apenas os documentos indicados para a tarefa;
4. não pergunte novamente pelo agente, salvo pedido explícito de troca.

O ciclo completo de criação, isolamento, memória e troca está em `SISTEMA_MULTIAGENTES.md`.

## Precedência

Em caso de conflito, siga esta ordem:

1. políticas de segurança e execução do ambiente;
2. instruções explícitas e mais recentes do usuário;
3. estas diretrizes globais e as fontes canônicas apontadas pelo índice;
4. especificação do agente ativo;
5. memória complementar do agente;
6. contexto temporário da tarefa.

Não resolva conflitos silenciosamente. Se uma ambiguidade puder alterar escopo, dados, método, privacidade ou comportamento, registre-a em `../Memoria/DECISOES_DO_PROJETO.md` e solicite direção quando necessário.

## Organização e recuperação de contexto

- Todo recurso criado especificamente para uso da IA deve ficar em `AiFiles/`, exceto este adaptador obrigatório `AGENTS.md` da raiz e blocos de compatibilidade gerados por ferramentas.
- Código, configurações, testes, migrações, assets e documentação de uso do produto permanecem em suas estruturas normais.
- Use `../INDICE.md` como mapa. Não carregue toda a árvore nem o planejamento completo por padrão.
- Consulte uma única fonte canônica para cada assunto e prefira links a cópias de conteúdo.
- Crie diretórios de prompts ou contexto temporário somente quando houver conteúdo real.
- Não crie `docs/` para documentação consumida pela IA.
- Preserve alterações existentes do usuário e inspecione o repositório antes de editar.

## Idioma

- Todo artefato próprio do projeto deve ser escrito em português do Brasil: domínio, banco, rotas, páginas, componentes, módulos, funções, variáveis, scripts, testes, mensagens e interface.
- Nomes impostos por bibliotecas, protocolos ou ferramentas externas podem permanecer no idioma original, como `Next.js`, `PrismaClient`, `package.json` e `AGENTS.md`.
- Não introduza novos nomes de domínio em inglês. Refatore nomenclatura existente antes de expandir a funcionalidade relacionada.

## Escopo científico e dados

- O produto é uma plataforma educacional de Learning Analytics focada no aluno, com apoio complementar ao professor.
- Não classifique alunos por estilos fixos de aprendizagem.
- Não afirme causalidade a partir de dados observacionais.
- Contextualize conclusões por período, quantidade e limites das evidências.
- Dados insuficientes devem gerar incerteza explícita e recomendação de exploração, nunca personalização definitiva.
- Esta versão usa somente dados sintéticos. Não insira, colete ou publique dados de pessoas reais sem autorização institucional, base legal e protocolo aprovado.

## Execução técnica

- Stack vigente: TypeScript, Next.js, React, Tailwind CSS, Recharts, Prisma e SQLite, salvo decisão registrada.
- Use TypeScript estrito e não introduza `any` sem justificativa documentada.
- Componentes não acessam Prisma diretamente. Regras de negócio e analytics ficam em módulos testáveis fora da interface.
- Valide entradas e autorização no servidor, independentemente da interface.
- Persista datas em UTC e apresente-as no fuso apropriado.
- Mantenha banco e cenário sintético reproduzíveis por migrações e seed.
- Não implemente funcionalidade sem requisito e critério de aceite em `../Memoria/MATRIZ_REQUISITOS_TESTES.md`.
- Antes de alterar código Next.js, leia a documentação aplicável da versão instalada em `node_modules/next/dist/docs/`.

## Qualidade, memória e rastreabilidade

- Após alteração relevante, atualize `../Memoria/ACOMPANHAMENTO.md` com arquivos, validações, resultados e pendências.
- Atualize a matriz de requisitos e testes quando uma funcionalidade do produto for implementada ou validada.
- Registre decisões duradouras em `../Memoria/DECISOES_DO_PROJETO.md` e riscos em `../Memoria/REGISTRO_DE_RISCOS.md`.
- Memória deve ser curada: registre somente decisões, restrições, preferências recorrentes e descobertas úteis no futuro.
- Não armazene conversas completas, cadeia de pensamento, credenciais, segredos, dados reais ou fatos triviais.
- Antes de concluir alterações, execute lint, verificação de tipos, testes aplicáveis e build quando configurados. Relate impedimentos com evidência.
- Não remova nem sobrescreva dados, migrações ou arquivos do usuário sem autorização explícita.
