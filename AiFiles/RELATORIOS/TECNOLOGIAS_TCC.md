# Tecnologias e Arquitetura da Solução

**Projeto:** Aprender com Evidências — plataforma de Learning Analytics  
**Data da verificação:** 17 de outubro de 2026  
**Escopo:** tecnologias encontradas no código executável, nas configurações e nas importações da versão atual do projeto.

## 1. Visão geral

A plataforma é uma aplicação web **full-stack** organizada como um **monólito modular**. O front-end e o back-end fazem parte do mesmo projeto Next.js. As páginas React, as ações de servidor, as rotas HTTP, as regras de negócio e o acesso ao banco são executados dentro da mesma aplicação Node.js.

O fluxo geral é:

```text
Navegador
   ↓
Interface React e páginas Next.js
   ↓
Server Actions e Route Handlers do Next.js
   ↓
Serviços da aplicação e regras de domínio
   ├── Prisma Client → SQLite
   ├── sistema de arquivos local
   └── API Groq → modelo openai/gpt-oss-20b
                         ↓ em caso de falha
                    resposta local
```

Não existe um servidor separado em Express ou NestJS. O próprio Next.js atende a interface e implementa o back-end.

## 2. Linguagens utilizadas

| Linguagem ou formato | Uso no projeto |
|---|---|
| **TypeScript 5.9.3** | Linguagem principal. Implementa páginas, componentes, rotas HTTP, serviços, regras de domínio, métricas, scripts e testes. O modo estrito está ativado. |
| **TSX** | Sintaxe usada nos componentes React e nas páginas do Next.js. |
| **CSS** | Estilos globais, variáveis visuais, responsividade e CSS Modules específicos de páginas e componentes. |
| **SQL** | Presente nas migrações versionadas do banco SQLite geradas e mantidas junto ao Prisma. |
| **Prisma Schema Language** | Define modelos, relações, índices e enums do banco em `prisma/schema.prisma`. |
| **JavaScript ESM** | Uso pontual em configuração, como `postcss.config.mjs`; não é a linguagem principal da aplicação. |

O código TypeScript é configurado para **ES2022** e não aceita arquivos JavaScript dentro de `src` (`allowJs: false`).

## 3. Front-end

### Next.js 16.3.3

É o framework principal da aplicação. O projeto utiliza o **App Router**, com:

- páginas e layouts em `src/app`;
- React Server Components como padrão;
- componentes interativos marcados com `"use client"`;
- Server Actions marcadas com `"use server"`;
- Route Handlers em `src/app/api` para operações HTTP;
- renderização no servidor e geração de páginas pelo mesmo projeto.

O desenvolvimento e o build usam explicitamente **Webpack**, conforme os scripts `next dev --webpack` e `next build --webpack`.

### React 19.2.8 e React DOM 19.2.8

São usados para construir a interface, controlar formulários, estados, modais, cronômetros, filtros e demais interações no navegador.

### Recharts 3.10.1

Biblioteca responsável pelos gráficos dos dashboards, incluindo gráficos de linha, área e barras. Os cálculos não são realizados pelo Recharts: a biblioteca apenas apresenta resultados já produzidos pelas regras de domínio.

### Tailwind CSS 4.3.3, CSS Modules e CSS tradicional

O Tailwind está integrado pelo PostCSS e importado no arquivo global. Entretanto, a estilização efetiva da aplicação utiliza principalmente:

- arquivos `*.module.css`;
- CSS global em `src/app/globais.css`;
- variáveis CSS para cores, espaçamentos, raios e outros tokens visuais;
- seletores e media queries escritos diretamente em CSS.

Portanto, no TCC é mais preciso registrar **Tailwind CSS integrado ao pipeline, combinado com CSS Modules e CSS personalizado**, sem afirmar que toda a interface foi construída exclusivamente com classes utilitárias do Tailwind.

### Lucide React 1.37.0

Fornece os ícones utilizados na navegação, nos botões, nos cards, nos modais e nos estados da interface.

## 4. Back-end

### Node.js 22.23.2

É o ambiente de execução do projeto. Executa o Next.js, os serviços, os scripts TypeScript, a comunicação com o banco, o processamento de arquivos e as chamadas à IA.

### Back-end do Next.js

O back-end é implementado com os recursos nativos do Next.js:

- **Server Actions** para formulários e ações acionadas pelas páginas;
- **Route Handlers** para endpoints `GET`, `POST`, `PATCH` e `DELETE`;
- `NextResponse` para respostas HTTP;
- cookies HTTP-only para a sessão local;
- validação de autenticação, propriedade dos registros e autorização no servidor.

### Zod 4.5.4

É usado para validar entradas de formulários, parâmetros, DTOs, configurações e respostas estruturadas da IA. Essa validação ocorre no servidor, independentemente das restrições apresentadas pela interface.

### Organização modular

O código está separado por responsabilidade:

| Pasta | Responsabilidade |
|---|---|
| `src/app` | Páginas, layouts, Server Actions e rotas HTTP. |
| `src/componentes` | Componentes visuais reutilizáveis. |
| `src/servidor` | Casos de uso, autorização, acesso ao banco, arquivos e integrações externas. |
| `src/dominio` | Métricas, análises e regras de negócio testáveis, sem dependência direta da interface. |
| `src/biblioteca` | Infraestrutura compartilhada, como a instância do Prisma. |
| `src/gerado` | Cliente e tipos gerados pelo Prisma. |

Essa estrutura caracteriza um **monólito modular em camadas**, e não uma arquitetura de microsserviços.

## 5. Banco de dados e persistência

### SQLite

O banco utilizado é o **SQLite**, configurado por `DATABASE_URL`. Ele armazena contas, módulos, sessões, materiais, evidências, análises, salas, configurações de IA e demais entidades da plataforma. As métricas oficiais são calculadas pelas regras de domínio a partir desses registros.

O SQLite é adequado à versão local e acadêmica porque funciona em arquivo, não exige um servidor de banco separado e facilita a reprodução do cenário sintético.

### Prisma ORM 7.10.0

O Prisma é a camada principal de acesso aos dados. Ele fornece:

- schema tipado;
- Prisma Client gerado em `src/gerado/prisma`;
- consultas e transações em TypeScript;
- migrações SQL versionadas;
- seed para criação do cenário sintético.

### better-sqlite3 12.11.1 e adaptador Prisma

O Prisma Client se conecta ao SQLite por meio de `@prisma/adapter-better-sqlite3` e `better-sqlite3`. Essa combinação realiza o acesso efetivo ao arquivo do banco.

### Sistema de arquivos local

Os arquivos enviados pelos usuários são armazenados fora da pasta pública, em `.dados/arquivos-materiais`. O banco mantém os metadados e a chave de armazenamento, enquanto o conteúdo binário permanece no sistema de arquivos.

## 6. Inteligência Artificial

### Provedor e modelo

| Item | Configuração atual |
|---|---|
| Provedor externo | **Groq** |
| Modelo padrão | **`openai/gpt-oss-20b`** |
| Sobrescrita opcional | Variável de ambiente `GROQ_MODEL` |
| Endpoint | `https://api.groq.com/openai/v1/chat/completions` |
| Integração | HTTPS por `fetch`, usando contrato compatível com a API da OpenAI |

O projeto não utiliza um SDK específico do Groq. A comunicação é feita diretamente pelo `fetch` nativo do ambiente Node.js.

### Forma de integração

O fluxo de interpretação funciona da seguinte maneira:

1. As métricas são calculadas localmente por regras TypeScript determinísticas.
2. O servidor monta um DTO com as métricas e o contexto autorizado.
3. O DTO é incorporado a um prompt controlado.
4. O servidor envia a solicitação ao endpoint do Groq.
5. Para os insights de aprendizagem, a resposta é solicitada como **JSON Schema estrito**.
6. O conteúdo retornado é convertido e validado novamente com Zod e filtros de linguagem.
7. Se não houver chave, houver timeout, erro de rede, cota, autenticação ou resposta inválida, o sistema gera uma **resposta local de contingência**.

A IA é apenas uma camada interpretativa: ela não calcula as métricas oficiais, não altera registros e não substitui as regras de Learning Analytics.

Na análise automática de materiais, o texto extraído também pode ser enviado ao Groq. Nesse fluxo, a resposta compacta — resumo, conceitos e sugestões — é validada e persistida. O texto integral extraído é descartado após o processamento.

### Segurança das credenciais

As chaves configuradas por conta são cifradas com **AES-256-GCM**, usando uma chave mestra do servidor e contexto autenticado por usuário e provedor. A chave da API não é devolvida ao navegador. Também é possível fornecer `GROQ_API_KEY` exclusivamente no ambiente do servidor.

### Provedores não utilizados

**Gemini e Qwen não integram a versão atual.** Seus adaptadores, endpoints, opções de configuração e variáveis de ambiente foram removidos. Alguns valores podem permanecer somente em enum histórico do banco para evitar uma migração destrutiva; isso não representa integração ativa.

## 7. Processamento de documentos e imagens

A plataforma extrai texto localmente antes da análise de materiais:

| Tecnologia | Função |
|---|---|
| **pdf-parse 2.4.5** | Extração de texto de arquivos PDF. |
| **Mammoth 1.12.3** | Extração de texto de documentos DOCX. |
| **read-excel-file 5.8.3** | Leitura de planilhas XLSX. |
| **Tesseract.js 7.0.0** | OCR de imagens PNG, JPG, JPEG, WEBP e GIF. |
| **@tesseract.js-data/por 1.0.0** | Dados de reconhecimento óptico para português. |
| APIs nativas do Node.js | Leitura, escrita, movimentação e exclusão controlada dos arquivos locais. |

Arquivos TXT e CSV são lidos diretamente como texto UTF-8. O conteúdo extraído é normalizado e limitado a 60.000 caracteres antes de qualquer chamada externa.

## 8. Autenticação e segurança

- Senhas são protegidas com **scrypt**, sal aleatório e comparação resistente a ataques de temporização, usando `node:crypto`.
- A sessão local utiliza cookie **HTTP-only** com `SameSite=Lax`.
- Autenticação, autorização e propriedade dos dados são conferidas no servidor.
- Uploads validam nome, extensão, MIME, tamanho e assinatura binária.
- Credenciais de IA usam AES-256-GCM.
- Um scanner próprio verifica se padrões de segredo foram incluídos em arquivos versionáveis.

A autenticação atual é adequada à demonstração local do TCC, mas o cookie armazena diretamente o identificador da conta e não deve ser descrito como uma solução completa de identidade para produção pública.

## 9. Testes e qualidade

| Tecnologia | Uso |
|---|---|
| **Vitest 4.1.11** | Testes unitários e de integração dos módulos TypeScript. |
| **Testing Library React 16.3.3** | Testes de comportamento dos componentes React. |
| **user-event e jest-dom** | Interação e asserções de acessibilidade nos testes de interface. |
| **jsdom 27.4.0** | Simulação do ambiente do navegador nos testes de componentes. |
| **ESLint 9.39.5 e eslint-config-next** | Verificação estática e padrões de qualidade. |
| **TypeScript `tsc --noEmit`** | Verificação de tipos sem gerar arquivos JavaScript. |
| **tsx 4.23.13** | Execução direta dos scripts TypeScript de banco, cenário e avaliação. |
| **Webpack** | Compilação usada explicitamente no desenvolvimento e no build de produção. |

O comando `npm run validar` executa scanner de segredos, ESLint, verificação de tipos, testes e build de produção.

## 10. Resumo recomendado para o TCC

> A solução foi desenvolvida em TypeScript, utilizando Next.js e React em uma arquitetura full-stack de monólito modular. O próprio Next.js fornece a interface, a renderização no servidor, as ações de servidor e os endpoints HTTP. A persistência utiliza SQLite, acessado pelo Prisma ORM com o adaptador better-sqlite3. Os dashboards empregam Recharts, enquanto a validação de entradas e respostas estruturadas é realizada com Zod. A camada de Inteligência Artificial utiliza exclusivamente a API da Groq, com o modelo `openai/gpt-oss-20b`, chamada por HTTPS por meio de `fetch`. As métricas de Learning Analytics são calculadas localmente por regras determinísticas; a IA apenas interpreta os resultados e possui contingência local em caso de indisponibilidade. A plataforma também realiza extração local de texto de PDF, DOCX, XLSX e imagens com pdf-parse, Mammoth, read-excel-file e Tesseract.js.

## 11. Tecnologias que não devem ser apresentadas como parte da versão atual

- **Gemini e Qwen:** integrações removidas; existem somente referências históricas ou valores de compatibilidade do banco.
- **Express, NestJS ou outro servidor Node separado:** não são usados.
- **PostgreSQL ou MySQL:** o banco atual é SQLite.
- **Python:** não participa da aplicação.
- **SDK do Groq ou SDK da OpenAI:** a integração usa `fetch` diretamente.
- **Microsserviços:** a solução atual é um monólito modular.

## 12. Principais evidências no repositório

- `package.json`: dependências, versões declaradas e scripts.
- `tsconfig.json`: TypeScript estrito e alvo ES2022.
- `src/app`: páginas, Server Actions e Route Handlers do Next.js.
- `src/dominio`: métricas e regras de negócio.
- `src/servidor`: serviços, autenticação, arquivos, Prisma e IA.
- `prisma/schema.prisma`: SQLite e modelo de dados.
- `prisma/migrations`: migrações SQL versionadas.
- `src/servidor/ia/catalogo-provedores.ts`: Groq e modelo padrão.
- `src/servidor/ia/groq.ts`: endpoint e configuração da integração.
- `src/servidor/ia/openai-compativel.ts`: chamada HTTPS e saída estruturada.
- `src/servidor/extracao-materiais.ts`: processamento de documentos, planilhas e imagens.
- `src/servidor/ia/cofre-credenciais.ts`: criptografia das chaves de IA.
